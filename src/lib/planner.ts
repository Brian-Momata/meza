import { MEAL_LIST, MEALS } from "./data/meals";
import { addDays, isWeekend } from "./dates";
import { fitsProfile, info, kcalOf } from "./nutrition";
import type { DayPlan, Meal, Profile, Slot } from "./types";

export const SLOTS: Slot[] = ["breakfast", "snack", "lunch", "supper"];

export const SLOT_META: Record<Slot, { name: string; sw: string; time: string; color: string }> = {
  breakfast: { name: "Breakfast", sw: "Kifungua kinywa", time: "7:00", color: "var(--maize)" },
  snack: { name: "Chai break", sw: "Chai ya saa nne", time: "10:00", color: "var(--peach)" },
  lunch: { name: "Lunch", sw: "Chakula cha mchana", time: "13:00", color: "var(--clay)" },
  supper: { name: "Supper", sw: "Chakula cha jioni", time: "19:30", color: "var(--forest)" },
};

export function activeSlots(profile: Profile): Slot[] {
  return profile.snacks ? SLOTS : SLOTS.filter((s) => s !== "snack");
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
  const pool = MEAL_LIST.filter((m) => m.slots.includes(slot) && fitsProfile(m.id, profile));
  const ok = pool.filter((m) => {
    if (m.weekendOnly && !weekend) return false;
    if (strict && profile.quickWeekdays && !weekend && slot !== "snack" && m.minutes > timeLimit(slot)) return false;
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
 * Fill every unlocked, uneaten slot for the given dates. Picks the combination
 * of meals for each day whose calories land closest to the target while
 * avoiding repeats from the days before.
 */
export function planDays(
  dates: string[],
  profile: Profile,
  days: Record<string, DayPlan>,
  seed: number,
): Record<string, DayPlan> {
  const rand = mulberry32(seed);
  const out: Record<string, DayPlan> = { ...days };
  const slots = activeSlots(profile);

  for (const date of [...dates].sort()) {
    const existing = out[date] ?? {};
    const keep = (s: Slot) => {
      const pm = existing[s];
      return !!pm && (pm.locked || pm.eaten) && !!MEALS[pm.meal];
    };
    const pools: string[][] = slots.map((s) =>
      keep(s) ? [existing[s]!.meal] : candidates(s, profile, date).map((m) => m.id),
    );
    const recent = recentUse(out, date);

    let best: string[] | null = null;
    let bestScore = Infinity;
    const combo: string[] = [];

    const walk = (i: number) => {
      if (i === pools.length) {
        let total = 0;
        let score = 0;
        for (const id of combo) {
          total += kcalOf(id);
          score += repeatPenalty(id, recent);
        }
        score += (Math.abs(total - profile.target) / profile.target) * 150;
        const li = slots.indexOf("lunch");
        const si = slots.indexOf("supper");
        const lunch = combo[li];
        const supper = combo[si];
        if (lunch === supper) score += 300;
        else {
          if (staple(lunch) && staple(lunch) === staple(supper)) score += 9;
          if (protein(lunch) && protein(lunch) === protein(supper)) score += 7;
        }
        score += rand() * 10;
        if (score < bestScore) {
          bestScore = score;
          best = [...combo];
        }
        return;
      }
      for (const id of pools[i]) {
        combo[i] = id;
        walk(i + 1);
      }
    };
    walk(0);

    const chosen: string[] = best ?? pools.map((p) => p[0]);
    const next: DayPlan = {};
    slots.forEach((s, i) => {
      const id = chosen[i];
      if (!id) return;
      next[s] = keep(s) ? existing[s] : { meal: id };
    });
    out[date] = next;
  }
  return out;
}

/** Alternatives for one slot, best calorie fit for the rest of the day first. */
export function alternatives(
  slot: Slot,
  date: string,
  profile: Profile,
  day: DayPlan,
): { id: string; kcal: number; dayTotal: number; fit: number }[] {
  const others = activeSlots(profile)
    .filter((s) => s !== slot)
    .reduce((sum, s) => sum + (day[s] ? kcalOf(day[s]!.meal) : 0), 0);
  const pool = MEAL_LIST.filter((m) => m.slots.includes(slot) && fitsProfile(m.id, profile));
  return pool
    .map((m) => {
      const k = kcalOf(m.id);
      const dayTotal = others + k;
      return { id: m.id, kcal: k, dayTotal, fit: Math.abs(dayTotal - profile.target) };
    })
    .sort((a, b) => a.fit - b.fit);
}

export function dayTotal(day: DayPlan | undefined, profile: Profile): number {
  if (!day) return 0;
  return activeSlots(profile).reduce((sum, s) => sum + (day[s] ? kcalOf(day[s]!.meal) : 0), 0);
}
