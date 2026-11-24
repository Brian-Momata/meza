"use client";

import { Check, Copy, Leaf, MessageCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MEALS } from "@/lib/data/meals";
import { addDays, dayNum, rangeLabel, shortDay, today, weekDates, weekStart } from "@/lib/dates";
import { buy } from "@/lib/format";
import { buildShoppingList, type ShopItem } from "@/lib/shopping";
import { clearChecked, ensureWeek, toggleChecked } from "@/lib/store";
import { usePlan } from "@/lib/use-plan";
import { Chip, MobileTopBar, PageHeader, Skeleton, Toggle } from "./ui";

type Preset = "today" | "three" | "rest" | "next";

function presetDates(p: Preset, t: string): string[] {
  const thisWeek = weekDates(weekStart(t));
  if (p === "today") return [t];
  if (p === "three") return [t, addDays(t, 1), addDays(t, 2)];
  if (p === "rest") return thisWeek.filter((d) => d >= t);
  return weekDates(addDays(weekStart(t), 7));
}

export function ShoppingView() {
  const plan = usePlan();
  const [preset, setPreset] = useState<Preset | null>("rest");
  const [picked, setSelected] = useState<string[] | null>(null);
  const [hideStaples, setHideStaples] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = plan ? today() : "";
  const selected = useMemo(() => picked ?? (t ? presetDates("rest", t) : null), [picked, t]);

  useEffect(() => {
    if (!selected?.length) return;
    // Make sure every week we're shopping for is planned (e.g. "next week", or a 3-day span over Sunday).
    for (const ws of new Set(selected.map(weekStart))) ensureWeek(ws);
  }, [selected]);

  const groups = useMemo(
    () => (plan && selected ? buildShoppingList(plan.app.days, selected, plan.profile) : []),
    [plan, selected],
  );

  if (!plan || !selected) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 pt-24 sm:px-8 lg:px-12">
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="mt-10 h-96" />
      </main>
    );
  }

  const { app, profile } = plan;
  const shownWeek = weekDates(weekStart(selected[0] ?? t));
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !(hideStaples && i.ingredient.staple)) }))
    .filter((g) => g.items.length);
  const all = visible.flatMap((g) => g.items);
  const done = all.filter((i) => app.checked[i.ingredient.id]).length;
  const mealCount = selected.reduce((n, d) => n + Object.values(app.days[d] ?? {}).filter(Boolean).length, 0);

  const choose = (p: Preset) => {
    setPreset(p);
    setSelected(presetDates(p, t));
  };
  const toggleDay = (d: string) => {
    setPreset(null);
    setSelected(() => {
      const s = new Set(selected ?? []);
      if (s.has(d)) s.delete(d);
      else s.add(d);
      return [...s].sort();
    });
  };

  const asText = () => {
    const lines = [`*Meza market list* · ${rangeLabel(selected)} · for ${profile.people}`, ""];
    for (const g of visible) {
      const items = g.items.filter((i) => !app.checked[i.ingredient.id]);
      if (!items.length) continue;
      lines.push(`*${g.name}*`);
      for (const i of items) lines.push(`- ${i.ingredient.name}: ${buy(i.ingredient, i.grams).main}`);
      lines.push("");
    }
    return lines.join("\n").trim();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12 lg:pb-20">
      <MobileTopBar />
      <PageHeader eyebrow={`Soko · ${rangeLabel(selected) || "pick some days"}`} title="Market list">
        Everything for <span className="tnum">{mealCount}</span> meals for {profile.people}{" "}
        {profile.people === 1 ? "person" : "people"}, rounded up to what you can actually buy. Tick things off as you go.
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Range */}
          <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {(
              [
                ["today", "Today"],
                ["three", "Next 3 days"],
                ["rest", "Rest of the week"],
                ["next", "Next week"],
              ] as const
            ).map(([p, label]) => (
              <Chip key={p} active={preset === p} onClick={() => choose(p)}>
                {label}
              </Chip>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {shownWeek.map((d) => {
              const on = selected.includes(d);
              const past = d < t;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={past}
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className={`flex flex-col items-center rounded-2xl border py-2 transition disabled:opacity-30 ${
                    on ? "border-forest bg-forest-soft text-forest" : "border-line bg-card/50 text-ink-2 hover:border-line-2"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{shortDay(d)}</span>
                  <span className="tnum text-[15px] font-semibold">{dayNum(d)}</span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="mt-8 space-y-10">
            {visible.map((g) => {
              const gDone = g.items.filter((i) => app.checked[i.ingredient.id]).length;
              return (
                <section key={g.aisle} className="animate-rise">
                  <div className="flex items-end justify-between border-b border-ink/80 pb-2.5">
                    <div>
                      <div className="eyebrow text-clay">{g.sw}</div>
                      <h2 className="font-display mt-1 text-[26px] leading-none">{g.name}</h2>
                    </div>
                    <span className="tnum pb-0.5 text-sm text-muted">
                      {gDone}/{g.items.length}
                    </span>
                  </div>
                  {g.hint && <p className="mt-2 text-[13px] text-muted">{g.hint}</p>}
                  <ul className="divide-y divide-line">
                    {g.items.map((i) => (
                      <Row key={i.ingredient.id} item={i} checked={!!app.checked[i.ingredient.id]} longRange={selected.length > 3} />
                    ))}
                  </ul>
                </section>
              );
            })}
            {!visible.length && (
              <div className="rounded-[24px] border border-dashed border-line-2 px-6 py-16 text-center">
                <p className="font-display text-2xl">Nothing to buy</p>
                <p className="mt-2 text-sm text-muted">Pick a day or two above to build your list.</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="overflow-hidden rounded-[24px] border border-line bg-card">
            <div className="kikoi h-1.5" />
            <div className="p-6">
              <div className="eyebrow text-muted">Progress</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display tnum text-[44px] leading-none">{done}</span>
                <span className="tnum text-sm text-muted">of {all.length} in the basket</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
              </div>

              <div className="mt-6 grid gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(asText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-medium text-paper hover:bg-forest-2"
                >
                  <MessageCircle className="size-4" strokeWidth={1.8} /> Send on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line-2 px-4 py-3 text-sm font-medium text-ink hover:border-ink-2"
                >
                  {copied ? <Check className="size-4 text-forest" /> : <Copy className="size-4" strokeWidth={1.8} />}
                  {copied ? "Copied" : "Copy as text"}
                </button>
                {done > 0 && (
                  <button
                    type="button"
                    onClick={() => clearChecked(all.map((i) => i.ingredient.id))}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted hover:text-ink"
                  >
                    <RotateCcw className="size-3.5" /> Clear ticks
                  </button>
                )}
              </div>

              <div className="mt-4 border-t border-line">
                <Toggle checked={hideStaples} onChange={setHideStaples} label="Hide pantry staples" hint="Salt, oil, sugar, tea and spices." />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ item, checked, longRange }: { item: ShopItem; checked: boolean; longRange: boolean }) {
  const b = buy(item.ingredient, item.grams);
  const uses = [...new Set(item.uses.map((u) => MEALS[u.meal]?.name.split(/[,&]/)[0].trim()))];
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => toggleChecked(item.ingredient.id)}
        className="flex w-full items-center gap-4 py-3.5 text-left"
      >
        <span
          className={`grid size-[22px] shrink-0 place-items-center rounded-full border transition ${
            checked ? "border-forest bg-forest text-paper" : "border-line-2 bg-card"
          }`}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] transition ${checked ? "text-muted line-through decoration-line-2" : "text-ink"}`}>
            {item.ingredient.name}
            {item.ingredient.sw && <span className="ml-2 text-[13px] text-muted">{item.ingredient.sw}</span>}
          </span>
          <span className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted">
            {item.ingredient.fresh && longRange && !checked && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[#4d7a35]">
                <Leaf className="size-3" /> buy fresh
              </span>
            )}
            <span className="truncate">
              {uses.slice(0, 3).join(" · ")}
              {uses.length > 3 && ` +${uses.length - 3}`}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`tnum block text-[15px] font-medium ${checked ? "text-muted" : "text-ink"}`}>{b.main}</span>
          {b.sub && <span className="tnum block text-xs text-muted">{b.sub}</span>}
        </span>
      </button>
    </li>
  );
}
