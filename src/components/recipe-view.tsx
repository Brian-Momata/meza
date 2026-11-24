"use client";

import { ArrowLeft, CalendarPlus, Check, Heart, ListOrdered, Moon } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import { ingredient } from "@/lib/data/ingredients";
import { MEAL_LIST, MEALS } from "@/lib/data/meals";
import { addDays, enDay, monthDay, today } from "@/lib/dates";
import { amount, duration, frac, inline, kcal } from "@/lib/format";
import { info, type PlatePart } from "@/lib/nutrition";
import { availableSlots, fitsSlot, SLOT_META } from "@/lib/planner";
import { scaleRecipe } from "@/lib/shopping";
import { setMeal, toggleFavorite, useApp } from "@/lib/store";
import type { Recipe, Slot } from "@/lib/types";
import { Kcal, MealPhoto, Sheet, Stepper } from "./ui";

const PART_COLORS = ["var(--color-forest)", "var(--color-clay)", "var(--color-maize)", "var(--color-peach)"];

const SIZES = [0.75, 1, 1.25, 1.5, 1.75, 2];

/** Plate size from the plan link (`?p=1.5`), read on the client only. */
function usePlanSize(): number | null {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const v = Number(new URLSearchParams(window.location.search).get("p"));
      return v >= 0.5 && v <= 2.5 ? v : null;
    },
    () => null,
  );
}

/** How many pieces / portions to cook of one part for `people` at plate size `size`. */
function partCount(part: PlatePart, people: number, size: number) {
  const r = part.recipe;
  const qty = part.qty * size;
  if (r.unit) {
    const pieces = Math.max(1, Math.round(people * qty));
    return { portions: pieces, n: pieces, each: r.portion.g, label: `${pieces} ${pieces === 1 ? r.unit.one : r.unit.many}` };
  }
  return { portions: people * qty, n: people, each: r.portion.g * qty, label: `${people} ${people === 1 ? "portion" : "portions"}` };
}

export function RecipeView({ id, credit }: { id: string; credit?: { author: string; license: string; source: string } }) {
  const meal = MEALS[id];
  const mi = info(id);
  const app = useApp();
  const household = app?.profile?.people;
  const [people, setPeople] = useState<number | null>(null);
  const planSize = usePlanSize();
  const [sizePick, setSize] = useState<number | null>(null);
  const size = sizePick ?? planSize ?? 1;
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const saved = !!app?.favorites.includes(id);

  // Default to the household size once we know it.
  const n = people ?? household ?? 4;

  const parts = useMemo(
    () =>
      mi.plate.map((p) => {
        const count = partCount(p, n, size);
        return { part: p, count, lines: scaleRecipe(p.recipe, count.portions) };
      }),
    [mi, n, size],
  );
  const nn = { kcal: mi.n.kcal * size, p: mi.n.p * size, c: mi.n.c * size, f: mi.n.f * size };

  const related = MEAL_LIST.filter((m) => m.id !== id && m.slots.some((s) => meal.slots.includes(s)))
    .map((m) => ({ m, score: (m.region === meal.region ? 2 : 0) + ((hash(m.id + id) % 100) / 100) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.m);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12 lg:pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 pt-4 lg:pt-8">
        <Link href="/recipes" className="inline-flex items-center gap-2 rounded-full py-2 pr-3 text-sm font-medium text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> Recipes
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(id)}
            aria-pressed={saved}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 bg-card/70 px-4 text-sm font-medium hover:border-ink-2"
          >
            <Heart className={`size-4 ${saved ? "fill-clay text-clay" : ""}`} strokeWidth={1.8} />
            <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
          </button>
          {app?.profile && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-paper hover:bg-forest-2"
            >
              <CalendarPlus className="size-4" strokeWidth={1.8} /> Add to plan
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="mt-6 grid items-end gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="animate-rise">
          <MealPhoto id={id} priority sizes="(min-width: 1024px) 600px, 100vw" className="aspect-[4/3] rounded-[28px]" />
          {credit && (
            <p className="mt-2 text-[11px] text-muted">
              Photo: {credit.author},{" "}
              <a href={credit.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink-2">
                {credit.license}
              </a>
              , via Wikimedia Commons
            </p>
          )}
        </div>
        <div className="animate-rise pb-2 [animation-delay:80ms]">
          <div className="eyebrow text-clay">
            {meal.region} · {meal.slots.map((s) => SLOT_META[s].name).join(" & ")}
          </div>
          <h1 className="font-display mt-3 text-[40px] leading-[1.02] sm:text-[54px]">{meal.name}</h1>
          <p className="mt-2 text-lg text-ink-2">{meal.sw}</p>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{meal.blurb}</p>
          <dl className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[
              { label: "Per person", value: <Kcal value={nn.kcal} /> },
              { label: "Protein", value: <span className="tnum">{Math.round(nn.p)} g</span> },
              { label: "Total time", value: duration(meal.minutes) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-4">
                <dt className="eyebrow text-[10px] text-muted">{label}</dt>
                <dd className="font-display mt-1.5 text-[19px] leading-none sm:text-[22px]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Plate */}
      <section className="mt-14 rounded-[28px] border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-muted">
              One person&rsquo;s plate
              {planSize && planSize === size && <span className="ml-2 normal-case tracking-normal text-clay">· sized by your plan</span>}
            </div>
            <h2 className="font-display mt-2 text-[28px] leading-tight">
              Serve this, and it&rsquo;s <span className="tnum text-forest">{kcal(nn.kcal)}</span> kcal
            </h2>
          </div>
          <div className="tnum text-sm text-muted">
            ≈ {Math.round((mi.plateGrams * size) / 10) * 10} g of food · P {Math.round(nn.p)} g · C {Math.round(nn.c)} g · F {Math.round(nn.f)} g
          </div>
        </div>
        <div className="mt-6 flex h-3 overflow-hidden rounded-full">
          {mi.plate.map((p, i) => (
            <div key={p.recipe.id} style={{ width: `${(p.n.kcal / mi.n.kcal) * 100}%`, background: PART_COLORS[i % 4] }} className="border-r-2 border-card last:border-r-0" />
          ))}
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mi.plate.map((p, i) => (
            <li key={p.recipe.id} className="flex gap-3">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: PART_COLORS[i % 4] }} />
              <div>
                <div className="text-[15px] font-medium">
                  {p.recipe.name}
                </div>
                <div className="mt-0.5 text-sm leading-snug text-ink-2">
                  {p.recipe.unit && p.qty * size !== 1
                    ? `${frac(p.qty * size)} ${p.qty * size > 1 ? p.recipe.unit.many : p.recipe.unit.one}`
                    : p.qty * size !== 1
                      ? `${frac(p.qty * size)}× a standard portion: ${p.recipe.portion.looks}`
                      : p.recipe.portion.looks}
                </div>
                <div className="tnum mt-1 text-xs text-muted">
                  {Math.round((p.grams * size) / 5) * 5} g · {kcal(p.n.kcal * size)} kcal
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Plate size</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Plate size">
          {SIZES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === size}
              onClick={() => setSize(v)}
              className={`tnum rounded-full border px-3 py-1 text-[13px] font-medium transition ${
                v === size ? "border-forest bg-forest text-paper" : "border-line-2 bg-card/60 text-ink-2 hover:border-ink-2"
              }`}
            >
              {frac(v)}×
            </button>
          ))}
        </div>
        {planSize && size !== planSize && (
          <button type="button" onClick={() => setSize(planSize)} className="text-sm text-forest underline underline-offset-2">
            Back to your plan&rsquo;s {frac(planSize)}×
          </button>
        )}
      </div>

      {/* Cook */}
      <section className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* Ingredients */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/80 pb-4">
            <h2 className="font-display text-[30px] leading-none">Ingredients</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Cooking for</span>
              <Stepper value={n} onChange={setPeople} min={1} max={30} label="people" />
            </div>
          </div>
          {household && n !== household && (
            <button type="button" onClick={() => setPeople(household)} className="mt-3 text-sm text-forest underline underline-offset-2">
              Reset to your table of {household}
            </button>
          )}
          <div className="mt-2 space-y-7">
            {parts.map(({ part, count, lines }) => (
              <div key={part.recipe.id}>
                <div className="flex items-baseline justify-between pt-5">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-clay">{part.recipe.name}</h3>
                  <span className="tnum text-xs text-muted">makes {count.label}</span>
                </div>
                <ul className="mt-2 divide-y divide-line">
                  {lines
                    .filter((l) => l.g > 0)
                    .map((l, i) => {
                      const ing = ingredient(l.id);
                      const a = amount(ing, l.g);
                      const key = `${part.recipe.id}:${l.id}:${i}`;
                      const got = !!have[key];
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => setHave((h) => ({ ...h, [key]: !h[key] }))}
                            className="flex w-full items-start gap-3 py-2.5 text-left"
                            aria-pressed={got}
                          >
                            <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border transition ${got ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
                              {got && <Check className="size-3" strokeWidth={3} />}
                            </span>
                            <span className={`min-w-0 flex-1 text-[15px] leading-snug ${got ? "text-muted line-through decoration-line-2" : ""}`}>
                              {ing.name}
                              {l.note && <span className="block text-xs text-muted no-underline">{l.note}</span>}
                            </span>
                            <span className="shrink-0 text-right">
                              <span className={`tnum block text-[15px] font-medium ${got ? "text-muted" : ""}`}>{a.main}</span>
                              {a.sub && <span className="tnum block text-xs text-muted">{a.sub}</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Weights are as bought, before peeling or trimming. Calories count only what you eat: bones, peel and the frying oil left in the pan are left out.
          </p>
        </div>

        {/* Method */}
        <div>
          <h2 className="font-display border-b border-ink/80 pb-4 text-[30px] leading-none">Method</h2>
          {(meal.prepAhead || meal.order) && (
            <div className="mt-6 space-y-3">
              {meal.prepAhead && (
                <div className="flex gap-3 rounded-2xl bg-forest px-5 py-4 text-paper">
                  <Moon className="mt-0.5 size-4 shrink-0 text-maize" strokeWidth={2} />
                  <p className="text-[15px] leading-relaxed">
                    <span className="font-semibold">The night before: </span>
                    {meal.prepAhead}
                  </p>
                </div>
              )}
              {meal.order && (
                <div className="flex gap-3 rounded-2xl bg-maize-soft px-5 py-4 text-[#5c3f0b]">
                  <ListOrdered className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                  <p className="text-[15px] leading-relaxed">
                    <span className="font-semibold">Cooking order: </span>
                    {meal.order}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            {parts.map(({ part, count, lines }) => (
              <div key={part.recipe.id} className="pt-8">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[24px]">{part.recipe.name}</h3>
                  <span className="tnum text-xs text-muted">
                    {duration(part.recipe.prep + part.recipe.cook)}
                  </span>
                </div>
                <ol className="mt-3 space-y-5">
                  {part.recipe.steps.map((s, i) => (
                    <li key={i} className="grid grid-cols-[32px_1fr] gap-3">
                      <span className="font-display tnum pt-0.5 text-lg leading-none text-clay">{i + 1}</span>
                      <p className="text-[15px] leading-[1.7] text-ink-2">
                        <Step text={s} recipe={part.recipe} lines={lines} n={count.n} each={count.each} />
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[24px] border border-line p-6">
            <div className="eyebrow text-muted">Nutrition · one plate</div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-center">
              {(
                [
                  ["Energy", `${kcal(nn.kcal)}`, "kcal"],
                  ["Protein", `${Math.round(nn.p)}`, "g"],
                  ["Carbs", `${Math.round(nn.c)}`, "g"],
                  ["Fat", `${Math.round(nn.f)}`, "g"],
                ] as const
              ).map(([l, v, u]) => (
                <div key={l}>
                  <div className="font-display tnum text-2xl">{v}</div>
                  <div className="text-xs text-muted">
                    {u} {l.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Estimates from the Kenya Food Composition Tables and USDA data, calculated from the ingredient weights above.
            </p>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mt-20">
        <h2 className="font-display text-[28px]">You might also like</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          {related.map((m) => (
            <li key={m.id}>
              <Link href={`/recipes/${m.id}`} className="group flex items-center gap-4 sm:block">
                <div className="w-28 shrink-0 overflow-hidden rounded-[18px] sm:w-auto">
                  <MealPhoto id={m.id} sizes="(min-width: 640px) 33vw, 112px" className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <div className="sm:mt-3">
                  <div className="font-display text-lg leading-snug group-hover:text-forest">{m.name}</div>
                  <div className="tnum mt-1 text-sm text-muted">{kcal(info(m.id).n.kcal)} kcal</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AddToPlan open={adding} onClose={() => setAdding(false)} mealId={id} onAdded={setAdded} />
      {added && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8 lg:left-[248px]">
          <div className="animate-rise rounded-full bg-ink px-5 py-3 text-sm text-paper shadow-xl">
            <Check className="-mt-0.5 mr-2 inline size-4 text-maize" />
            {added}
          </div>
        </div>
      )}
    </main>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function Step({
  text,
  recipe,
  lines,
  n,
  each,
}: {
  text: string;
  recipe: Recipe;
  lines: { id: string; g: number }[];
  n: number;
  each: number;
}) {
  const bits = text.split(/(\{[a-z-]+\})/g);
  return (
    <>
      {bits.map((b, i) => {
        const m = b.match(/^\{([a-z-]+)\}$/);
        if (!m) return <Fragment key={i}>{b}</Fragment>;
        const key = m[1];
        if (key === "n") return <strong key={i} className="tnum font-semibold text-ink">{n}</strong>;
        if (key === "portion") return <strong key={i} className="tnum font-semibold text-ink">{Math.round(each / 5) * 5} g</strong>;
        const g = lines.filter((l) => l.id === key).reduce((s, l) => s + l.g, 0);
        if (!g) return <Fragment key={i}>{recipe.lines.find((l) => l.id === key) ? "" : key}</Fragment>;
        return (
          <strong key={i} className="tnum font-semibold text-ink">
            {inline(key, g)}
          </strong>
        );
      })}
    </>
  );
}

function AddToPlan({ open, onClose, mealId, onAdded }: { open: boolean; onClose: () => void; mealId: string; onAdded: (msg: string | null) => void }) {
  const app = useApp();
  const meal = MEALS[mealId];
  if (!app?.profile) return null;
  const profile = app.profile;
  const slots = availableSlots(profile).filter((s) => fitsSlot(meal, s)) as Slot[];
  const t = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i));

  return (
    <Sheet open={open} onClose={onClose} eyebrow="Add to plan" title={meal.name}>
      {!slots.length ? (
        <p className="pb-6 text-sm text-muted">
          This is a chai-break snack. Turn on the chai break in{" "}
          <Link href="/settings" className="text-forest underline">
            your table settings
          </Link>{" "}
          to plan it.
        </p>
      ) : (
        <ul className="divide-y divide-line pb-2">
          {days.map((d) => (
            <li key={d} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="block text-[15px] font-medium">{d === t ? "Today" : enDay(d)}</span>
                <span className="text-xs text-muted">{monthDay(d)}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const current = app.days[d]?.[s]?.meal;
                  const here = current === mealId;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={here}
                      onClick={() => {
                        setMeal(d, s, mealId);
                        onClose();
                        onAdded(`Added to ${d === t ? "today" : enDay(d)}'s ${SLOT_META[s].name.toLowerCase()}`);
                        setTimeout(() => onAdded(null), 2600);
                      }}
                      title={current && !here ? `Replaces ${MEALS[current]?.name}` : undefined}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
                        here ? "border-forest bg-forest-soft text-forest" : "border-line-2 hover:border-forest hover:bg-forest hover:text-paper"
                      }`}
                    >
                      {here ? <Check className="-mt-0.5 mr-1 inline size-3.5" /> : null}
                      {SLOT_META[s].name}
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="pb-2 text-xs text-muted">Adding a meal replaces what&rsquo;s there and locks it, so shuffling keeps it.</p>
    </Sheet>
  );
}
