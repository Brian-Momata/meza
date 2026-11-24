"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MEALS } from "@/lib/data/meals";
import { enDay, monthDay } from "@/lib/dates";
import { kcal } from "@/lib/format";
import { MEAL_INFO } from "@/lib/nutrition";
import { alternatives, SLOT_META } from "@/lib/planner";
import { setMeal, useApp } from "@/lib/store";
import type { Slot } from "@/lib/types";
import { MealPhoto, Sheet } from "./ui";

export function SwapSheet({
  target,
  onClose,
}: {
  target: { date: string; slot: Slot } | null;
  onClose: () => void;
}) {
  const app = useApp();
  const [q, setQ] = useState("");
  const profile = app?.profile;
  const day = target && app ? app.days[target.date] ?? {} : {};
  const current = target ? day[target.slot]?.meal : undefined;

  const options = useMemo(() => {
    if (!target || !profile) return [];
    const all = alternatives(target.slot, target.date, profile, day);
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((o) => MEAL_INFO[o.id].search.includes(needle)) : all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, profile, q, app?.days]);

  if (!profile) return null;
  const meta = target ? SLOT_META[target.slot] : null;

  return (
    <Sheet
      open={!!target}
      onClose={() => {
        setQ("");
        onClose();
      }}
      eyebrow={target ? `${meta?.name} · ${enDay(target.date)} ${monthDay(target.date)}` : ""}
      title="Swap this meal"
    >
      <p className="-mt-1 text-sm text-muted">
        Sorted by how well each one fits the rest of the day, against your {kcal(profile.target)} kcal goal.
      </p>
      <label className="mt-4 flex items-center gap-2.5 rounded-2xl border border-line-2 bg-card px-4 py-3 focus-within:border-forest">
        <Search className="size-4 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: beans, coconut, ugali…"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
        />
      </label>
      <ul className="mt-3 divide-y divide-line">
        {options.map((o, i) => {
          const m = MEALS[o.id];
          const isCurrent = o.id === current;
          const diff = o.dayTotal - profile.target;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  if (!target) return;
                  setMeal(target.date, target.slot, o.id);
                  setQ("");
                  onClose();
                }}
                className="group flex w-full items-center gap-4 py-3 text-left disabled:cursor-default"
              >
                <MealPhoto id={o.id} sizes="64px" className="size-16 shrink-0 rounded-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-ink group-hover:text-forest">{m.name}</span>
                    {i === 0 && !q && !isCurrent && (
                      <span className="shrink-0 rounded-full bg-forest-soft px-2 py-0.5 text-[11px] font-semibold text-forest">Best fit</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{m.sw}</span>
                  <span className="tnum mt-1 block text-xs text-ink-2">
                    {kcal(o.kcal)} kcal · day total {kcal(o.dayTotal)}{" "}
                    <span className={Math.abs(diff) <= profile.target * 0.06 ? "text-forest" : "text-clay"}>
                      ({diff > 0 ? "+" : ""}
                      {kcal(diff)})
                    </span>
                  </span>
                </span>
                {isCurrent ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-forest">
                    <Check className="size-4" /> Planned
                  </span>
                ) : (
                  <span className="rounded-full border border-line-2 px-3 py-1 text-xs font-medium text-ink-2 group-hover:border-forest group-hover:bg-forest group-hover:text-paper">
                    Choose
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {!options.length && <li className="py-10 text-center text-sm text-muted">Nothing matches “{q}”.</li>}
      </ul>
    </Sheet>
  );
}
