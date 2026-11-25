"use client";

import { ChevronLeft, ChevronRight, Lock, LockOpen, Moon, Repeat2, Shuffle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MEALS } from "@/lib/data/meals";
import { addDays, dayNum, enDay, monthDay, rangeLabel, shortDay, swDay, today, weekDates, weekStart } from "@/lib/dates";
import { kcal, ksh, portions, recipeHref } from "@/lib/format";
import { daySlots, dayTotal, hasBudget, householdDayCost, pmCost, pmKcal, SLOT_META } from "@/lib/planner";
import { reshuffleWeek, toggleLock, useApp } from "@/lib/store";
import type { DayPlan, Profile, Slot } from "@/lib/types";
import { usePlan } from "@/lib/use-plan";
import { SwapSheet } from "./swap-sheet";
import { MealPhoto, MobileTopBar, PageHeader, Skeleton } from "./ui";

export function PlanView() {
  const [offset, setOffset] = useState(0);
  const hydrated = useApp() !== null;
  const week = hydrated ? addDays(weekStart(today()), offset * 7) : undefined;

  const plan = usePlan(week);
  const [swap, setSwap] = useState<{ date: string; slot: Slot } | null>(null);
  const [flash, setFlash] = useState(false);

  if (!plan || !week) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 pt-24 sm:px-8 lg:px-12">
        <Skeleton className="h-14 w-1/2" />
        <div className="mt-10 space-y-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </main>
    );
  }

  const { app, profile } = plan;
  const t = today();
  const dates = weekDates(week);
  const totals = dates.map((d) => dayTotal(app.days[d])).filter(Boolean);
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const mealCount = dates.reduce((n, d) => n + daySlots(app.days[d]).length, 0);
  const weekCost = dates.reduce((sum, d) => sum + householdDayCost(app.days[d], profile), 0);
  const over = hasBudget(profile) ? weekCost - profile.budget! : 0;
  const title = offset === 0 ? "This week" : offset === 1 ? "Next week" : `Week of ${monthDay(week)}`;

  const shuffle = () => {
    reshuffleWeek(week);
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12 lg:pb-20">
      <MobileTopBar />
      <PageHeader
        eyebrow={`Wiki · ${rangeLabel(dates)}`}
        title={title}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-line-2 bg-card/70">
              <button
                type="button"
                onClick={() => setOffset((o) => Math.max(0, o - 1))}
                disabled={offset === 0}
                className="grid size-10 place-items-center rounded-full text-ink-2 hover:text-ink disabled:opacity-30"
                aria-label="Previous week"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="h-5 w-px bg-line-2" />
              <button
                type="button"
                onClick={() => setOffset((o) => Math.min(3, o + 1))}
                disabled={offset === 3}
                className="grid size-10 place-items-center rounded-full text-ink-2 hover:text-ink disabled:opacity-30"
                aria-label="Next week"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={shuffle}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-paper hover:bg-forest-2"
            >
              <Shuffle className="size-4" strokeWidth={1.8} /> {flash ? "Shuffled" : "Shuffle"}
            </button>
          </div>
        }
      >
        <span className="tnum">
          {mealCount} meals for {profile.people} · averaging <span className="font-medium text-ink">{kcal(avg)} kcal</span> a day each. Lock a meal to keep it when you shuffle.
        </span>
        <BudgetLine weekCost={weekCost} over={over} profile={profile} />
      </PageHeader>

      {/* Day strip */}
      <nav className="sticky top-0 z-20 -mx-5 mb-2 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur-lg sm:-mx-8 sm:px-8 lg:mx-0 lg:rounded-full lg:border lg:px-2 lg:py-2">
        <ol className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {dates.map((d) => (
            <li key={d} className="flex-1">
              <a
                href={`#d-${d}`}
                className={`flex min-w-[46px] flex-col items-center rounded-2xl px-2 py-1.5 transition lg:flex-row lg:justify-center lg:gap-2 lg:rounded-full ${
                  d === t ? "bg-forest text-paper" : "text-ink-2 hover:bg-paper-2"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{shortDay(d)}</span>
                <span className="tnum text-base font-semibold lg:text-sm">{dayNum(d)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div>
        {dates.map((d, idx) => (
          <DaySection
            key={d}
            date={d}
            day={app.days[d]}
            profile={profile}
            past={d < t}
            isToday={d === t}
            tomorrow={app.days[addDays(d, 1)]}
            delay={idx * 50}
            onSwap={(slot) => setSwap({ date: d, slot })}
          />
        ))}
      </div>

      <SwapSheet target={swap} onClose={() => setSwap(null)} />
    </main>
  );
}

function BudgetLine({ weekCost, over, profile }: { weekCost: number; over: number; profile: Profile }) {
  if (!hasBudget(profile)) {
    return (
      <span className="tnum mt-1 block">
        Food for the week comes to about <span className="font-medium text-ink">{ksh(weekCost)}</span>.{" "}
        <Link href="/settings" className="text-forest underline-offset-2 hover:underline">
          Set a budget
        </Link>
      </span>
    );
  }
  // A few shillings over is rounding, not a broken budget.
  const ok = over <= profile.budget! * 0.02;
  return (
    <span className="tnum mt-1 block">
      Food for the week: <span className={`font-medium ${ok ? "text-ink" : "text-clay"}`}>{ksh(weekCost)}</span> of your {ksh(profile.budget!)} budget
      {ok ? (
        <span className="text-forest"> · {ksh(Math.max(0, -over))} to spare</span>
      ) : (
        <span className="text-clay">
          {" "}
          · {ksh(over)} over. Swap in a cheaper meal or shuffle; if it stays over, {kcal(profile.target)} kcal a day costs more than this budget.
        </span>
      )}
    </span>
  );
}

function DaySection({
  date,
  day,
  profile,
  past,
  isToday,
  tomorrow,
  delay,
  onSwap,
}: {
  date: string;
  day: DayPlan | undefined;
  profile: Profile;
  past: boolean;
  isToday: boolean;
  tomorrow: DayPlan | undefined;
  delay: number;
  onSwap: (s: Slot) => void;
}) {
  const slots = daySlots(day);
  const total = dayTotal(day);
  const pct = Math.min(100, (total / profile.target) * 100);
  const near = Math.abs(total - profile.target) <= profile.target * 0.06;
  const prep = Object.values(tomorrow ?? {})
    .map((pm) => pm && MEALS[pm.meal])
    .filter((m) => m?.prepAhead);

  return (
    <section id={`d-${date}`} className="scroll-mt-24 animate-rise border-b border-line py-8" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className={`font-display text-[30px] leading-none ${past ? "text-muted" : ""}`}>{swDay(date)}</h2>
          <span className="text-sm text-muted">
            {enDay(date)} {monthDay(date)}
          </span>
          {isToday && <span className="rounded-full bg-maize-soft px-2.5 py-0.5 text-xs font-semibold text-[#7a5410]">Today</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-paper-2">
            <div className={`h-full rounded-full ${near ? "bg-forest" : "bg-clay"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="tnum text-sm text-ink-2">
            <span className="font-semibold text-ink">{kcal(total)}</span> kcal
            {total > 0 && <span className="text-muted"> · {ksh(householdDayCost(day, profile))}</span>}
          </span>
        </div>
      </div>

      <div className={`grid gap-3 md:gap-4 ${slots.length >= 5 ? "md:grid-cols-5" : slots.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} ${past ? "opacity-60" : ""}`}>
        {slots.map((s) => {
          const pm = day![s]!;
          const m = MEALS[pm.meal];
          return (
            <article
              key={s}
              className="group flex items-center gap-4 rounded-[20px] border border-line bg-card p-2.5 pr-3 transition hover:border-line-2 md:flex-col md:items-stretch md:gap-0 md:p-0"
            >
              <Link href={recipeHref(m.id, pm.scale)} className="shrink-0 overflow-hidden rounded-[14px] md:rounded-none">
                <MealPhoto
                  id={m.id}
                  sizes="(min-width: 768px) 280px, 80px"
                  className="size-[76px] transition-transform duration-500 group-hover:scale-[1.03] md:aspect-[4/3] md:size-auto md:w-full"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col md:p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="size-1.5 rounded-full" style={{ background: SLOT_META[s].color }} />
                  {SLOT_META[s].name}
                  {pm.eaten && <span className="ml-1 text-forest">· eaten</span>}
                </div>
                <Link href={recipeHref(m.id, pm.scale)} className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-ink hover:text-forest">
                  {m.name}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 md:pt-3">
                  <span className="tnum text-[13px] text-muted">
                    {kcal(pmKcal(pm))} kcal · {ksh(pmCost(pm) * profile.people)}
                    {pm.scale && pm.scale !== 1 && <span className="text-[#7a5410]"> · {portions(pm.scale)}</span>}
                  </span>
                  {!past && (
                    <span className="flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleLock(date, s)}
                        className={`grid size-8 place-items-center rounded-full transition ${pm.locked ? "bg-maize-soft text-[#7a5410]" : "text-muted hover:bg-paper-2 hover:text-ink"}`}
                        aria-label={pm.locked ? "Unlock meal" : "Lock meal"}
                        aria-pressed={!!pm.locked}
                        title={pm.locked ? "Locked: shuffle keeps it" : "Lock to keep when shuffling"}
                      >
                        {pm.locked ? <Lock className="size-3.5" strokeWidth={2} /> : <LockOpen className="size-3.5" strokeWidth={1.8} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSwap(s)}
                        className="grid size-8 place-items-center rounded-full text-muted hover:bg-paper-2 hover:text-ink"
                        aria-label="Swap meal"
                      >
                        <Repeat2 className="size-4" strokeWidth={1.8} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!past && prep.length > 0 && (
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-forest-soft px-4 py-3 text-sm text-forest">
          <Moon className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <span>
            <span className="font-semibold">Tonight: </span>
            {prep.map((m) => `${m!.prepAhead} (${m!.name})`).join(" ")}
          </span>
        </p>
      )}
    </section>
  );
}
