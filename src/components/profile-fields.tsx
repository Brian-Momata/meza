"use client";

import { Check } from "lucide-react";
import { kcal, ksh } from "@/lib/format";
import { mealsOf } from "@/lib/planner";
import type { Diet, Fill, Kind, MainSlot, Profile } from "@/lib/types";
import { Chip, Stepper, Toggle } from "./ui";

export const DEFAULT_PROFILE: Profile = {
  people: 4,
  target: 2000,
  diet: "all",
  avoid: [],
  snacks: false,
  quickWeekdays: false,
  meals: ["breakfast", "lunch", "supper"],
  fill: "portions",
};

type Set = (p: Partial<Profile>) => void;

export function PeopleField({ profile, set }: { profile: Profile; set: Set }) {
  return (
    <div className="flex flex-col items-start gap-5">
      <Stepper value={profile.people} onChange={(people) => set({ people })} min={1} max={16} size="lg" label="people" />
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        Every recipe and the market list scale to this number. Feeding small children? Count two as one adult.
      </p>
    </div>
  );
}

const TARGETS = [
  { kcal: 1600, name: "Lighter", hint: "Gentle weight loss for most adults" },
  { kcal: 2000, name: "Steady", hint: "The everyday reference for adults" },
  { kcal: 2400, name: "Active", hint: "Physical work, sport, or teenagers" },
];

export function TargetField({ profile, set }: { profile: Profile; set: Set }) {
  const custom = !TARGETS.some((t) => t.kcal === profile.target);
  return (
    <div>
      <div className="grid gap-3">
        {TARGETS.map((t) => {
          const on = profile.target === t.kcal;
          return (
            <button
              key={t.kcal}
              type="button"
              onClick={() => set({ target: t.kcal })}
              aria-pressed={on}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
                on ? "border-forest bg-card shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-2 bg-card/50 hover:border-ink-2"
              }`}
            >
              <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium">{t.name}</span>
                <span className="block text-sm text-muted">{t.hint}</span>
              </span>
              <span className="font-display tnum text-xl">{kcal(t.kcal)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line-2 px-5 py-4">
        <span>
          <span className="block text-[15px] font-medium">{custom ? "Custom goal" : "Something else?"}</span>
          <span className="block text-sm text-muted">Fine-tune in steps of 100 kcal</span>
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line-2 bg-card text-lg disabled:opacity-35"
            disabled={profile.target <= 1300}
            onClick={() => set({ target: profile.target - 100 })}
            aria-label="Lower goal"
          >
            −
          </button>
          <span className="tnum w-16 text-center font-medium">{kcal(profile.target)}</span>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line-2 bg-card text-lg disabled:opacity-35"
            disabled={profile.target >= 3500}
            onClick={() => set({ target: profile.target + 100 })}
            aria-label="Raise goal"
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
}

/** Budget tiers, in KSh per person per day. */
const BUDGETS = [
  { pp: 150, name: "Tight", hint: "Githeri, ndengu, beans, ugali and greens. Little meat." },
  { pp: 250, name: "Modest", hint: "Mostly pulses and greens, with chicken or beef a few times a week." },
  { pp: 400, name: "Comfortable", hint: "Room for nyama, fish and pilau most days." },
];

/** A tier's weekly total for this household, rounded to KSh 100. */
const weekly = (pp: number, people: number) => Math.round((pp * 7 * people) / 100) * 100;

export function BudgetField({ profile, set }: { profile: Profile; set: Set }) {
  const presets = BUDGETS.map((b) => ({ ...b, week: weekly(b.pp, profile.people) }));
  const none = !profile.budget;
  const custom = !none && !presets.some((b) => b.week === profile.budget);
  const card = (on: boolean) =>
    `flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
      on ? "border-forest bg-card shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-2 bg-card/50 hover:border-ink-2"
    }`;
  const dot = (on: boolean) => (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
  const step = profile.people * 7 * 25; // KSh 25 per person a day
  const adjust = (dir: 1 | -1) => {
    const cur = profile.budget ?? weekly(250, profile.people);
    set({ budget: Math.max(step, Math.round((cur + dir * step) / 50) * 50) });
  };
  return (
    <div>
      <div className="grid gap-3">
        {presets.map((b) => {
          const on = profile.budget === b.week;
          return (
            <button key={b.name} type="button" onClick={() => set({ budget: b.week })} aria-pressed={on} className={card(on)}>
              {dot(on)}
              <span className="flex-1">
                <span className="block text-[15px] font-medium">{b.name}</span>
                <span className="block text-sm text-muted">{b.hint}</span>
              </span>
              <span className="text-right">
                <span className="font-display tnum block text-xl">{ksh(b.week)}</span>
                <span className="tnum block text-xs text-muted">a week</span>
              </span>
            </button>
          );
        })}
        <button type="button" onClick={() => set({ budget: undefined })} aria-pressed={none} className={card(none)}>
          {dot(none)}
          <span className="flex-1">
            <span className="block text-[15px] font-medium">No limit</span>
            <span className="block text-sm text-muted">Plan for taste and variety, whatever it costs</span>
          </span>
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line-2 px-5 py-4">
        <span>
          <span className="block text-[15px] font-medium">{custom ? "Your own budget" : "A different amount?"}</span>
          <span className="block text-sm text-muted">
            {none ? "Set exactly what you spend a week" : `About ${ksh(profile.budget! / 7 / profile.people)} per person a day`}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line-2 bg-card text-lg disabled:opacity-35"
            disabled={!none && profile.budget! <= step}
            onClick={() => adjust(-1)}
            aria-label="Lower budget"
          >
            −
          </button>
          <span className="tnum min-w-24 text-center font-medium">{none ? "—" : ksh(profile.budget!)}</span>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line-2 bg-card text-lg"
            onClick={() => adjust(1)}
            aria-label="Raise budget"
          >
            +
          </button>
        </span>
      </div>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        For food for the whole household, at typical Nairobi market prices. Cooking gas or charcoal isn&rsquo;t included.
      </p>
    </div>
  );
}

const DIETS: { id: Diet; name: string; hint: string }[] = [
  { id: "all", name: "Everything", hint: "Nyama, kuku, samaki and all the rest" },
  { id: "pescatarian", name: "Fish, no meat", hint: "Tilapia, omena and coastal fish curries" },
  { id: "vegetarian", name: "Vegetarian", hint: "Beans, ndengu, githeri, eggs and milk" },
];

const AVOID: { id: Kind; name: string }[] = [
  { id: "beef", name: "Beef" },
  { id: "goat", name: "Goat" },
  { id: "chicken", name: "Chicken" },
  { id: "fish", name: "Fish" },
];

export function DietField({ profile, set }: { profile: Profile; set: Set }) {
  const blocked = (k: Kind) =>
    profile.diet === "vegetarian" || (profile.diet === "pescatarian" && k !== "fish");
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DIETS.map((d) => {
          const on = profile.diet === d.id;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={on}
              onClick={() => set({ diet: d.id })}
              className={`rounded-2xl border p-4 text-left transition ${
                on ? "border-forest bg-card shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-2 bg-card/50 hover:border-ink-2"
              }`}
            >
              <span className="block text-[15px] font-medium">{d.name}</span>
              <span className="mt-1 block text-[13px] leading-snug text-muted">{d.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <div className="text-sm font-medium text-ink-2">Anything you don&rsquo;t eat?</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {AVOID.map((a) => {
            const off = blocked(a.id);
            const on = profile.avoid.includes(a.id);
            return (
              <Chip
                key={a.id}
                active={on && !off}
                className={off ? "pointer-events-none opacity-40" : ""}
                onClick={() => set({ avoid: on ? profile.avoid.filter((x) => x !== a.id) : [...profile.avoid, a.id] })}
              >
                No {a.name.toLowerCase()}
              </Chip>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HabitsField({ profile, set }: { profile: Profile; set: Set }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      <Toggle
        checked={profile.snacks}
        onChange={(snacks) => set({ snacks })}
        label="Always have a 10 o'clock chai break"
        hint="A mid-morning snack every day: chai and mandazi, roast maize, njugu or fruit."
      />
      <Toggle
        checked={profile.quickWeekdays}
        onChange={(quickWeekdays) => set({ quickWeekdays })}
        label="Keep weekdays quick"
        hint="Monday to Friday meals under an hour. Pilau and nyama choma wait for the weekend."
      />
    </div>
  );
}

const PATTERNS: { meals: MainSlot[]; name: string; hint: string }[] = [
  { meals: ["breakfast", "lunch", "supper"], name: "Three meals", hint: "Breakfast, lunch and supper" },
  { meals: ["lunch", "supper"], name: "Skip breakfast", hint: "Lunch and supper" },
  { meals: ["breakfast", "supper"], name: "Skip lunch", hint: "Breakfast and supper" },
  { meals: ["supper"], name: "One meal a day", hint: "A big supper" },
];

const MEAL_NAMES: Record<MainSlot, string> = { breakfast: "Breakfast", lunch: "Lunch", supper: "Supper" };

const FILLS: { id: Fill; name: string; hint: string }[] = [
  { id: "portions", name: "Bigger portions", hint: "Each plate is sized to your goal, up to double. Snacks only if that's still not enough." },
  { id: "snacks", name: "Add snacks", hint: "Normal plates, with chai-time snacks at 10:00 and 16:00. Plates grow only if snacks can't close the gap." },
];

export function MealsField({ profile, set }: { profile: Profile; set: Set }) {
  const meals = mealsOf(profile);
  const key = meals.join();
  const toggle = (m: MainSlot) => {
    const next = meals.includes(m) ? meals.filter((x) => x !== m) : [...meals, m];
    if (next.length) set({ meals: (["breakfast", "lunch", "supper"] as MainSlot[]).filter((x) => next.includes(x)) });
  };
  const fill = profile.fill ?? "portions";
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PATTERNS.map((pt) => {
          const on = pt.meals.join() === key;
          return (
            <button
              key={pt.name}
              type="button"
              aria-pressed={on}
              onClick={() => set({ meals: pt.meals })}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
                on ? "border-forest bg-card shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-2 bg-card/50 hover:border-ink-2"
              }`}
            >
              <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span>
                <span className="block text-[15px] font-medium">{pt.name}</span>
                <span className="block text-sm text-muted">{pt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">Or pick:</span>
        {(["breakfast", "lunch", "supper"] as MainSlot[]).map((m) => (
          <Chip key={m} active={meals.includes(m)} onClick={() => toggle(m)}>
            {MEAL_NAMES[m]}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        <div className="text-sm font-medium text-ink-2">
          {meals.length < 3 ? `${meals.length === 1 ? "One meal" : "Two meals"} can't usually reach ${kcal(profile.target)} kcal on normal plates. How should we make up the difference?` : "When the meals alone fall short of your goal:"}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FILLS.map((f) => {
            const on = fill === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ fill: f.id })}
                className={`rounded-2xl border p-4 text-left transition ${
                  on ? "border-forest bg-card shadow-[0_0_0_1px_var(--color-forest)]" : "border-line-2 bg-card/50 hover:border-ink-2"
                }`}
              >
                <span className="block text-[15px] font-medium">{f.name}</span>
                <span className="mt-1 block text-[13px] leading-snug text-muted">{f.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
