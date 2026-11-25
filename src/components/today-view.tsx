"use client";

import { ArrowRight, ArrowUpRight, Check, Clock, Moon, Repeat2, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MEALS } from "@/lib/data/meals";
import { addDays, enDay, monthDay, swDay, today, weekDates, weekStart } from "@/lib/dates";
import { buy, duration, kcal, ksh, portions, recipeHref } from "@/lib/format";
import { info } from "@/lib/nutrition";
import { dailyBudget, daySlots, dayTotal, hasBudget, householdDayCost, isSnack, pmCost, pmKcal, SLOT_META } from "@/lib/planner";
import { buildShoppingList } from "@/lib/shopping";
import { toggleEaten } from "@/lib/store";
import type { DayPlan, Profile, Slot } from "@/lib/types";
import { usePlan } from "@/lib/use-plan";
import { SwapSheet } from "./swap-sheet";
import { Kcal, MealPhoto, MobileTopBar, Skeleton } from "./ui";

const SLOT_HOUR: Record<Slot, number> = { breakfast: 7, snack: 10, lunch: 13, snack2: 16, supper: 19.5 };

function greeting(h: number) {
  if (h < 12) return "Habari ya asubuhi";
  if (h < 16) return "Habari ya mchana";
  return "Habari ya jioni";
}

export function TodayView() {
  const plan = usePlan();
  const [swap, setSwap] = useState<{ date: string; slot: Slot } | null>(null);

  if (!plan) return <TodaySkeleton />;
  const { app, profile } = plan;
  const t = today();
  const day = app.days[t] ?? {};
  const slots = daySlots(day);
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  let featured: { date: string; slot: Slot; label: string } | null = null;
  const nextSlot = slots.filter((s) => !isSnack(s)).find((s) => !day[s]?.eaten && SLOT_HOUR[s] + 1.5 > hour);
  if (nextSlot) featured = { date: t, slot: nextSlot, label: `Up next · ${SLOT_META[nextSlot].name} · ${SLOT_META[nextSlot].time}` };
  else {
    const tmr = addDays(t, 1);
    if (app.days[tmr]?.breakfast) featured = { date: tmr, slot: "breakfast", label: "Tomorrow · Breakfast" };
  }

  const total = dayTotal(day);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12 lg:pb-20">
      <MobileTopBar
        right={
          <Link href="/settings" className="flex items-center gap-2 rounded-full border border-line-2 bg-card/70 py-1.5 pl-3 pr-2 text-sm text-ink-2">
            <Users className="size-4" strokeWidth={1.8} />
            <span className="tnum font-medium">{profile.people}</span>
            <Settings2 className="size-4 text-muted" strokeWidth={1.8} />
          </Link>
        }
      />

      <header className="animate-rise pb-8 pt-8 lg:pt-14">
        <div className="eyebrow text-clay">
          {swDay(t)} · {enDay(t)} {monthDay(t)}
        </div>
        <h1 className="font-display mt-3 text-[44px] leading-[0.98] text-ink sm:text-[64px]">Leo tunakula nini?</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2 sm:text-base">
          {greeting(hour)}. Today is decided: {slots.length} meals for your table of {profile.people}, about{" "}
          <span className="tnum font-medium text-ink">{kcal(total)} kcal</span> each, for about{" "}
          <span className="tnum font-medium text-ink">{ksh(householdDayCost(day, profile))}</span>
          {hasBudget(profile) && <> against a day&rsquo;s share of {ksh(dailyBudget(profile) * profile.people)}</>}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 space-y-10">
          {featured && (
            <Featured
              date={featured.date}
              slot={featured.slot}
              label={featured.label}
              mealId={app.days[featured.date]![featured.slot]!.meal}
              eaten={!!app.days[featured.date]![featured.slot]!.eaten}
              scale={app.days[featured.date]![featured.slot]!.scale ?? 1}
              people={profile.people}
              onSwap={() => setSwap({ date: featured!.date, slot: featured!.slot })}
            />
          )}
          <DayLedger date={t} day={day} slots={slots} profile={profile} featured={featured} onSwap={(slot) => setSwap({ date: t, slot })} />
        </div>

        <aside className="min-w-0 space-y-5 lg:pt-0">
          <EnergyCard day={day} slots={slots} profile={profile} />
          <PrepCard date={addDays(t, 1)} day={app.days[addDays(t, 1)]} />
          <MarketCard profile={profile} days={app.days} checked={app.checked} />
          <TomorrowCard date={addDays(t, 1)} day={app.days[addDays(t, 1)]} />
        </aside>
      </div>

      <SwapSheet target={swap} onClose={() => setSwap(null)} />
    </main>
  );
}

function Featured({
  date,
  slot,
  label,
  mealId,
  eaten,
  people,
  scale,
  onSwap,
}: {
  date: string;
  slot: Slot;
  label: string;
  mealId: string;
  eaten: boolean;
  people: number;
  scale: number;
  onSwap: () => void;
}) {
  const meal = MEALS[mealId];
  const i = info(mealId);
  const href = recipeHref(mealId, scale);
  return (
    <article className="animate-rise overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_30px_60px_-40px_rgba(60,40,10,.35)] [animation-delay:80ms]">
      <Link href={href} className="group relative block">
        <MealPhoto id={mealId} sizes="(min-width: 1024px) 680px, 100vw" priority className="aspect-[5/4] transition-transform duration-700 group-hover:scale-[1.015] sm:aspect-[16/10]" />
        <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur">
          <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: SLOT_META[slot].color }} />
          {label}
        </span>
      </Link>
      <div className="p-6 sm:p-8">
        <div className="text-sm text-clay">{meal.sw}</div>
        <h2 className="font-display mt-1.5 text-[30px] leading-[1.08] text-ink sm:text-[38px]">{meal.name}</h2>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{meal.blurb}</p>

        <dl className="mt-6 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
          <div>
            <dt className="eyebrow text-muted">Per person</dt>
            <dd className="font-display mt-1.5 text-2xl">
              <Kcal value={i.n.kcal * scale} />
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">Protein</dt>
            <dd className="tnum font-display mt-1.5 text-2xl">
              {Math.round(i.n.p * scale)}
              <span className="text-[0.78em] text-muted"> g</span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">Time</dt>
            <dd className="font-display mt-1.5 text-2xl">{duration(meal.minutes)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <div className="eyebrow text-muted">Each plate{scale !== 1 && <span className="ml-2 rounded-full bg-maize-soft px-2 py-0.5 normal-case tracking-normal text-[#7a5410]">{portions(scale)}</span>}</div>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {i.plate.map((p) => (
              <li key={p.recipe.id} className="rounded-full bg-paper-2 px-3 py-1.5 text-[13px] text-ink-2">
                <span className="font-medium text-ink">{p.recipe.name}</span> · <span className="tnum">{Math.round((p.grams * scale) / 5) * 5} g</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-[15px] font-medium text-paper transition hover:bg-forest-2"
          >
            Cook for {people} <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center gap-2 rounded-full border border-line-2 px-5 py-3 text-[15px] font-medium text-ink transition hover:border-ink-2"
          >
            <Repeat2 className="size-4" strokeWidth={1.8} /> Swap
          </button>
          <button
            type="button"
            onClick={() => toggleEaten(date, slot)}
            className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-medium transition ${eaten ? "text-forest" : "text-muted hover:text-ink"}`}
          >
            <span className={`grid size-5 place-items-center rounded-full border ${eaten ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
              {eaten && <Check className="size-3" strokeWidth={3} />}
            </span>
            {eaten ? "Eaten" : "Mark eaten"}
          </button>
        </div>
      </div>
    </article>
  );
}

function DayLedger({
  date,
  day,
  slots,
  profile,
  featured,
  onSwap,
}: {
  date: string;
  day: DayPlan;
  slots: Slot[];
  profile: Profile;
  featured: { date: string; slot: Slot } | null;
  onSwap: (s: Slot) => void;
}) {
  return (
    <section className="animate-rise [animation-delay:160ms]">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="font-display text-[26px]">Today&rsquo;s table</h2>
        <Link href="/plan" className="text-sm font-medium text-forest hover:underline">
          Whole week
        </Link>
      </div>
      <ol>
        {slots.map((s) => {
          const pm = day[s]!;
          const m = MEALS[pm.meal];
          const scale = pm.scale ?? 1;
          const isNext = featured?.date === date && featured.slot === s;
          return (
            <li key={s} className={`flex items-center gap-4 border-b border-line py-4 transition-opacity ${pm.eaten ? "opacity-55" : ""}`}>
              <div className="w-[68px] shrink-0">
                <div className="tnum text-[15px] font-semibold text-ink">{SLOT_META[s].time}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <span className="size-1.5 rounded-full" style={{ background: SLOT_META[s].color }} />
                  {SLOT_META[s].name}
                </div>
              </div>
              <Link href={recipeHref(m.id, pm.scale)} className="group flex min-w-0 flex-1 items-center gap-4">
                <MealPhoto id={m.id} sizes="72px" className="size-[60px] shrink-0 rounded-2xl sm:size-[72px]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-ink group-hover:text-forest sm:text-base">{m.name}</span>
                    {isNext && <span className="hidden shrink-0 rounded-full bg-maize-soft px-2 py-0.5 text-[11px] font-semibold text-[#7a5410] sm:inline">Next</span>}
                  </div>
                  <div className="tnum mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                    <span>{kcal(pmKcal(pm))} kcal</span>
                    <span className="text-line-2">·</span>
                    <span>{ksh(pmCost(pm) * profile.people)}</span>
                    {scale !== 1 && (
                      <>
                        <span className="text-line-2">·</span>
                        <span className="text-[#7a5410]">{portions(scale)}</span>
                      </>
                    )}
                    <span className="text-line-2">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {duration(m.minutes)}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSwap(s)}
                  className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-ink"
                  aria-label={`Swap ${SLOT_META[s].name.toLowerCase()}`}
                >
                  <Repeat2 className="size-[18px]" strokeWidth={1.7} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleEaten(date, s)}
                  className="grid size-9 place-items-center rounded-full hover:bg-paper-2"
                  aria-label={pm.eaten ? "Mark as not eaten" : "Mark as eaten"}
                  aria-pressed={!!pm.eaten}
                >
                  <span className={`grid size-[22px] place-items-center rounded-full border transition ${pm.eaten ? "border-forest bg-forest text-paper" : "border-line-2"}`}>
                    {pm.eaten && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-muted">
        Not feeling it? Swap any meal; we&rsquo;ll suggest the ones that keep you closest to {kcal(profile.target)} kcal.
      </p>
    </section>
  );
}

function EnergyCard({ day, slots, profile }: { day: DayPlan; slots: Slot[]; profile: Profile }) {
  const parts = slots.map((s) => {
    const n = info(day[s]!.meal).n;
    const k = day[s]!.scale ?? 1;
    return { s, n: { kcal: n.kcal * k, p: n.p * k, c: n.c * k, f: n.f * k }, eaten: !!day[s]!.eaten };
  });
  const total = parts.reduce((a, p) => a + p.n.kcal, 0);
  const eaten = parts.filter((p) => p.eaten).reduce((a, p) => a + p.n.kcal, 0);
  const scale = Math.max(total, profile.target);
  const macros = parts.reduce((a, p) => ({ p: a.p + p.n.p, c: a.c + p.n.c, f: a.f + p.n.f }), { p: 0, c: 0, f: 0 });
  const diff = total - profile.target;

  return (
    <section className="animate-rise rounded-[24px] border border-line bg-card p-6 [animation-delay:120ms]">
      <div className="eyebrow text-muted">Energy · per person</div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="font-display text-[44px] leading-none">
          <span className="tnum">{kcal(total)}</span>
        </div>
        <div className="tnum pb-1 text-right text-sm text-muted">
          of {kcal(profile.target)} kcal
          <div className={Math.abs(diff) <= profile.target * 0.06 ? "text-forest" : "text-clay"}>
            {Math.abs(diff) <= profile.target * 0.06 ? "On target" : `${diff > 0 ? "+" : "−"}${kcal(Math.abs(diff))} kcal`}
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex h-3 overflow-hidden rounded-full bg-paper-2">
        {parts.map((p) => (
          <div
            key={p.s}
            className="h-full border-r-2 border-card last:border-r-0"
            style={{ width: `${(p.n.kcal / scale) * 100}%`, background: SLOT_META[p.s].color, opacity: p.eaten ? 1 : 0.85 }}
          />
        ))}
        <div className="absolute inset-y-[-3px] w-0.5 rounded bg-ink" style={{ left: `${(profile.target / scale) * 100}%` }} title="Target" />
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.s} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ background: SLOT_META[p.s].color }} />
            <span className="flex-1 text-ink-2">{SLOT_META[p.s].name}</span>
            {p.eaten && <Check className="size-3.5 text-forest" strokeWidth={2.5} />}
            <span className="tnum font-medium">{kcal(p.n.kcal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
        {(
          [
            ["Protein", macros.p],
            ["Carbs", macros.c],
            ["Fat", macros.f],
          ] as const
        ).map(([label, v]) => (
          <div key={label}>
            <div className="tnum text-lg font-semibold">
              {Math.round(v)}
              <span className="text-xs font-normal text-muted"> g</span>
            </div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>
      {eaten > 0 && (
        <p className="tnum mt-4 rounded-xl bg-forest-soft px-3 py-2 text-[13px] text-forest">
          Eaten so far: {kcal(eaten)} kcal · {kcal(Math.max(0, total - eaten))} to go
        </p>
      )}
    </section>
  );
}

function PrepCard({ date, day }: { date: string; day: DayPlan | undefined }) {
  const notes = Object.values(day ?? {})
    .map((pm) => pm && MEALS[pm.meal])
    .filter((m) => m && m.prepAhead) as (typeof MEALS)[string][];
  if (!notes.length) return null;
  return (
    <section className="animate-rise rounded-[24px] bg-forest p-6 text-paper [animation-delay:180ms]">
      <div className="flex items-center gap-2">
        <Moon className="size-4 text-maize" strokeWidth={2} />
        <span className="eyebrow text-paper/70">Tonight, for {enDay(date)}</span>
      </div>
      <ul className="mt-3 space-y-3">
        {notes.map((m) => (
          <li key={m.id}>
            <p className="font-display text-xl leading-snug">{m.prepAhead}</p>
            <p className="mt-1 text-sm text-paper/70">For {m.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MarketCard({
  profile,
  days,
  checked,
}: {
  profile: Profile;
  days: Record<string, DayPlan>;
  checked: Record<string, boolean>;
}) {
  const t = today();
  const dates = weekDates(weekStart(t)).filter((d) => d >= t);
  const groups = buildShoppingList(days, dates, profile);
  const items = groups.flatMap((g) => g.items).filter((i) => !i.ingredient.staple);
  const left = items.filter((i) => !checked[i.ingredient.id]);
  const fresh = left.filter((i) => i.ingredient.aisle === "mboga").slice(0, 4);
  return (
    <Link
      href="/shopping"
      className="group block animate-rise rounded-[24px] border border-line bg-card p-6 transition hover:border-line-2 [animation-delay:220ms]"
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted">Soko · rest of the week</span>
        <ArrowUpRight className="size-4 text-muted transition group-hover:text-forest" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display tnum text-[40px] leading-none">{left.length}</span>
        <span className="text-sm text-ink-2">of {items.length} things left to buy</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full rounded-full bg-maize" style={{ width: `${items.length ? ((items.length - left.length) / items.length) * 100 : 0}%` }} />
      </div>
      {fresh.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {fresh.map((i) => (
            <li key={i.ingredient.id} className="flex justify-between gap-3">
              <span className="truncate text-ink-2">{i.ingredient.sw?.split(" / ")[0] ?? i.ingredient.name}</span>
              <span className="tnum shrink-0 text-muted">{buy(i.ingredient, i.grams).main}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

function TomorrowCard({ date, day }: { date: string; day: DayPlan | undefined }) {
  if (!day) return null;
  const slots = daySlots(day);
  return (
    <section className="animate-rise rounded-[24px] border border-line p-6 [animation-delay:260ms]">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-muted">Kesho · {enDay(date)}</span>
        <span className="tnum text-sm text-muted">{kcal(dayTotal(day))} kcal</span>
      </div>
      <ul className="mt-4 space-y-3">
        {slots.map((s) => (
          <li key={s}>
            <Link href={recipeHref(day[s]!.meal, day[s]!.scale)} className="group flex items-center gap-3">
              <MealPhoto id={day[s]!.meal} sizes="44px" className="size-11 shrink-0 rounded-xl" />
              <span className="min-w-0">
                <span className="block text-xs text-muted">{SLOT_META[s].name}</span>
                <span className="block truncate text-[15px] text-ink group-hover:text-forest">{MEALS[day[s]!.meal].name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12">
      <div className="pt-24 lg:pt-14">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-14 w-3/4 max-w-lg" />
        <Skeleton className="mt-4 h-4 w-2/3 max-w-md" />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_1fr]">
        <Skeleton className="aspect-[5/4] rounded-[28px] sm:aspect-[16/10]" />
        <Skeleton className="h-80 rounded-[24px]" />
      </div>
    </main>
  );
}
