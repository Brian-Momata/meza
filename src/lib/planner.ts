import { MEAL_LIST, MEALS } from "./data/meals";
import { addDays, isWeekend } from "./dates";
import { fitsProfile, info, kcalOf } from "./nutrition";
import type { DayPlan, Fill, MainSlot, Meal, PlannedMeal, Profile, Slot } from "./types";

export const SLOTS: Slot[] = ["breakfast", "snack", "lunch", "snack2", "supper"];
export const MAIN_SLOTS: MainSlot[] = ["breakfast", "lunch", "supper"];

export const SLOT_META: Record<Slot, { name: string; sw: string; time: string; color: string }> = {
  breakfast: { name: "Breakfast", sw: "Kifungua kinywa", time: "7:00", color: "var(--maize)" },
  snack: { name: "Chai break", sw: "Chai ya saa nne", time: "10:00", color: "var(--peach)" },
  lunch: { name: "Lunch", sw: "Chakula cha mchana", time: "13:00", color: "var(--clay)" },
  snack2: { name: "Afternoon tea", sw: "Chai ya saa kumi", time: "16:00", color: "#9a7650" },
  supper: { name: "Supper", sw: "Chakula cha jioni", time: "19:30", color: "var(--forest)" },
};

export const isSnack = (s: Slot) => s === "snack" || s === "snack2";

export function mealsOf(p: Profile): MainSlot[] {
  return p.meals?.length ? MAIN_SLOTS.filter((s) => p.meals!.includes(s)) : MAIN_SLOTS;
}

export function fillOf(p: Profile): Fill {
  return p.fill ?? "portions";
}

/**
 * Slots the planner must fill, and snack slots it may add when "add snacks"
 * is how the household prefers to reach its calorie goal.
 */
export function slotPlan(p: Profile): { required: Slot[]; optional: Slot[] } {
  const want = new Set<Slot>(mealsOf(p));
  if (p.snacks) want.add("snack");
  // Snacks can always be added to close a gap; the fill preference decides
  // whether they come before or after bigger portions.
  const optional: Slot[] = p.snacks ? ["snack2"] : ["snack", "snack2"];
  return { required: SLOTS.filter((s) => want.has(s)), optional };
}

/** Every slot this household might see in its plan. */
export function availableSlots(p: Profile): Slot[] {
  const { required, optional } = slotPlan(p);
  return SLOTS.filter((s) => required.includes(s) || optional.includes(s));
}

/** The slots a given day actually has, in time order. */
export function daySlots(day: DayPlan | undefined): Slot[] {
  return day ? SLOTS.filter((s) => day[s]) : [];
}

/** Can this meal go in this slot? Snacks fit either chai break. */
export function fitsSlot(m: Meal, slot: Slot) {
  return m.slots.includes(slot === "snack2" ? "snack" : slot);
}

export const MIN_SCALE = 0.75;
export const MAX_SCALE = 2;

export function pmKcal(pm: PlannedMeal | undefined): number {
  return pm ? kcalOf(pm.meal) * (pm.scale ?? 1) : 0;
}

const quarter = (x: number) => Math.round(x * 4) / 4;

/** Portion size that brings the day to the goal, rounded to quarter portions. */
function fitScale(p: Profile, fixed: number, base: number) {
  // "Add snacks" households only get bigger plates when snacks aren't enough.
  const min = fillOf(p) === "portions" ? MIN_SCALE : 1;
  return quarter(Math.min(MAX_SCALE, Math.max(min, (p.target - fixed) / base)));
}

/**
 * Size the main meals so the day lands on the calorie goal. Snacks and meals
 * already eaten keep their size.
 */
export function withScales(day: DayPlan, p: Profile): DayPlan {
  const out: DayPlan = {};
  const slots = daySlots(day);
  const flexible = slots.filter((s) => !isSnack(s) && !day[s]!.eaten);
  for (const s of slots) out[s] = { ...day[s]! };
  const fixed = slots.filter((s) => !flexible.includes(s)).reduce((sum, s) => sum + pmKcal(day[s]), 0);
  const base = flexible.reduce((sum, s) => sum + kcalOf(day[s]!.meal), 0);
  if (!base) return out;
  const scale = fitScale(p, fixed, base);
  for (const s of flexible) {
    if (scale === 1) delete out[s]!.scale;
    else out[s]!.scale = scale;
  }
  return out;
}

/** Deterministic PRNG so a plan can be reproduced from its seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function timeLimit(slot: Slot) {
  return slot === "breakfast" ? 40 : 60;
}

/** Meals that may go in `slot` on `date` for this household. */
export function candidates(slot: Slot, profile: Profile, date: string, strict = true): Meal[] {
  const weekend = isWeekend(date);
  const pool = MEAL_LIST.filter((m) => fitsSlot(m, slot) && fitsProfile(m.id, profile));
  const ok = pool.filter((m) => {
    if (m.weekendOnly && !weekend) return false;
    if (strict && profile.quickWeekdays && !weekend && !isSnack(slot) && m.minutes > timeLimit(slot)) return false;
    return true;
  });
  if (ok.length >= 3 || !strict) return ok.length ? ok : pool;
  // Too few options under the time limit — relax it rather than repeat endlessly.
  return candidates(slot, profile, date, false);
}

/** How many days ago each meal was last planned, looking back up to a week. */
function recentUse(days: Record<string, DayPlan>, date: string): Map<string, number> {
  const seen = new Map<string, number>();
  for (let back = 1; back <= 7; back++) {
    const d = days[addDays(date, -back)];
    if (!d) continue;
    for (const s of SLOTS) {
      const id = d[s]?.meal;
      if (id && !seen.has(id)) seen.set(id, back);
    }
  }
  return seen;
}

function staple(id: string): string | null {
  const parts = MEALS[id]?.parts.map((p) => p.recipe) ?? [];
  return parts.find((p) => ["ugali", "wali", "chapati", "pilau"].includes(p)) ?? null;
}

function protein(id: string): string | null {
  const k = info(id).kinds;
  for (const kind of ["beef", "goat", "chicken", "fish"] as const) if (k.has(kind)) return kind;
  return null;
}

function repeatPenalty(id: string, recent: Map<string, number>) {
  const d = recent.get(id);
  if (!d) return 0;
  if (d === 1) return 40;
  if (d === 2) return 24;
  if (d <= 4) return 12;
  return 6;
}

/**
 * Fill every unlocked, uneaten slot for the given dates. For each day it
 * scores every combination of meals (and, when snacks are allowed, whether to
 * add them): closest to the calorie goal wins, with penalties for repeats from
 * recent days, for the same staple or protein twice in a day, for extra
 * snacks, and for portions far from the standard plate.
 */
export function planDays(
  dates: string[],
  profile: Profile,
  days: Record<string, DayPlan>,
  seed: number,
): Record<string, DayPlan> {
  const rand = mulberry32(seed);
  const out: Record<string, DayPlan> = { ...days };
  const { required, optional } = slotPlan(profile);
  const slots = SLOTS.filter((s) => required.includes(s) || optional.includes(s));
  // Preference order: "portions" scales plates first and adds snacks only when
  // plates max out; "snacks" adds snacks first and grows plates only if needed.
  const portionsFirst = fillOf(profile) === "portions";
  const snackCost = portionsFirst ? 25 : 4;
  const scaleCost = portionsFirst ? 10 : 60;

  for (const date of [...dates].sort()) {
    const existing = out[date] ?? {};
    const keep = (s: Slot) => {
      const pm = existing[s];
      return !!pm && (pm.locked || pm.eaten) && !!MEALS[pm.meal];
    };
    const recent = recentUse(out, date);
    type Opt = { id: string; k: number; pen: number };
    const pools: Opt[][] = slots.map((s) => {
      const snack = isSnack(s);
      const opt = (id: string): Opt => ({
        id,
        k: kcalOf(id) * (keep(s) && existing[s]!.eaten ? existing[s]!.scale ?? 1 : 1),
        // Everyday snacks repeat happily; meals shouldn't.
        pen: repeatPenalty(id, recent) * (snack ? 0.25 : 1) + (snack && optional.includes(s) ? snackCost : 0),
      });
      if (keep(s)) return [opt(existing[s]!.meal)];
      const ids = candidates(s, profile, date).map((m) => opt(m.id));
      return optional.includes(s) ? [{ id: "", k: 0, pen: 0 }, ...ids] : ids;
    });
    const fixedSlot = slots.map((s) => isSnack(s) || (keep(s) && !!existing[s]!.eaten));
    const li = slots.indexOf("lunch");
    const si = slots.indexOf("supper");
    const s1 = slots.indexOf("snack");
    const s2 = slots.indexOf("snack2");

    let best: string[] | null = null;
    let bestScore = Infinity;
    const combo: Opt[] = [];

    const walk = (i: number) => {
      if (i === pools.length) {
        let fixed = 0;
        let base = 0;
        let score = 0;
        for (let j = 0; j < combo.length; j++) {
          const o = combo[j];
          if (!o.id) continue;
          score += o.pen;
          if (fixedSlot[j]) fixed += o.k;
          else base += o.k;
        }
        let total = fixed + base;
        if (base) {
          const scale = fitScale(profile, fixed, base);
          total = fixed + base * scale;
          score += Math.abs(scale - 1) * scaleCost;
        }
        const off = Math.abs(total - profile.target) / profile.target;
        score += off * 150 + Math.max(0, off - 0.08) * 400;
        if (li >= 0 && si >= 0) {
          const lunch = combo[li].id;
          const supper = combo[si].id;
          if (lunch === supper) score += 300;
          else {
            if (staple(lunch) && staple(lunch) === staple(supper)) score += 9;
            if (protein(lunch) && protein(lunch) === protein(supper)) score += 7;
          }
        }
        if (s1 >= 0 && s2 >= 0 && combo[s1].id && combo[s1].id === combo[s2].id) score += 40;
        score += rand() * 10;
        if (score < bestScore) {
          bestScore = score;
          best = combo.map((o) => o.id);
        }
        return;
      }
      for (const o of pools[i]) {
        combo[i] = o;
        walk(i + 1);
      }
    };
    walk(0);

    const chosen: string[] = best ?? pools.map((p) => p.find((o) => o.id)?.id ?? "");
    const next: DayPlan = {};
    slots.forEach((s, i) => {
      const id = chosen[i];
      if (!id) return;
      next[s] = keep(s) ? existing[s] : { meal: id };
    });
    // Meals already eaten stay on the record even if the pattern changed.
    for (const s of SLOTS) if (!next[s] && existing[s]?.eaten) next[s] = existing[s];
    out[date] = withScales(next, profile);
  }
  return out;
}

/** Alternatives for one slot, best calorie fit for the rest of the day first. */
export function alternatives(
  slot: Slot,
  date: string,
  profile: Profile,
  day: DayPlan,
): { id: string; kcal: number; scale: number; dayTotal: number; fit: number }[] {
  const pool = MEAL_LIST.filter((m) => fitsSlot(m, slot) && fitsProfile(m.id, profile));
  return pool
    .map((m) => {
      const next = withScales({ ...day, [slot]: { meal: m.id } }, profile);
      const total = dayTotal(next);
      return { id: m.id, kcal: pmKcal(next[slot]), scale: next[slot]!.scale ?? 1, dayTotal: total, fit: Math.abs(total - profile.target) };
    })
    .sort((a, b) => a.fit - b.fit);
}

export function dayTotal(day: DayPlan | undefined): number {
  return daySlots(day).reduce((sum, s) => sum + pmKcal(day![s]), 0);
}
