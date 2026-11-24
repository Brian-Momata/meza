"use client";

import { Clock, Heart, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MEAL_LIST } from "@/lib/data/meals";
import { duration, kcal } from "@/lib/format";
import { MEAL_INFO } from "@/lib/nutrition";
import { toggleFavorite, useApp } from "@/lib/store";
import type { Meal } from "@/lib/types";
import { Chip, MealPhoto, MobileTopBar, PageHeader } from "./ui";

const FILTERS: { id: string; label: string; test: (m: Meal, fav: string[]) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "breakfast", label: "Breakfast", test: (m) => m.slots.includes("breakfast") },
  { id: "mains", label: "Lunch & supper", test: (m) => m.slots.includes("supper") },
  { id: "snack", label: "Snacks", test: (m) => m.slots.includes("snack") },
  { id: "veg", label: "Vegetarian", test: (m) => MEAL_INFO[m.id].vegetarian },
  { id: "fish", label: "Fish", test: (m) => MEAL_INFO[m.id].kinds.has("fish") },
  { id: "quick", label: "Under 45 min", test: (m) => m.minutes <= 45 },
  { id: "budget", label: "Budget", test: (m) => !!m.budget },
  { id: "protein", label: "High protein", test: (m) => MEAL_INFO[m.id].highProtein },
  { id: "coast", label: "Coastal", test: (m) => m.region === "Coast" },
  { id: "saved", label: "Saved", test: (m, fav) => fav.includes(m.id) },
];

const SORTS = {
  recommended: { label: "Recommended", fn: () => 0 },
  light: { label: "Lightest first", fn: (a: Meal, b: Meal) => MEAL_INFO[a.id].n.kcal - MEAL_INFO[b.id].n.kcal },
  protein: { label: "Most protein", fn: (a: Meal, b: Meal) => MEAL_INFO[b.id].n.p - MEAL_INFO[a.id].n.p },
  quick: { label: "Quickest", fn: (a: Meal, b: Meal) => a.minutes - b.minutes },
} as const;

const SUGGESTIONS = ["ugali", "coconut", "beans", "chapati", "fish", "githeri"];

export function RecipeBrowser() {
  const app = useApp();
  const favorites = app?.favorites;
  const fav = useMemo(() => favorites ?? [], [favorites]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("recommended");

  const results = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return MEAL_LIST.filter((m) => f.test(m, fav) && words.every((w) => MEAL_INFO[m.id].search.includes(w))).sort(SORTS[sort].fn);
  }, [q, filter, sort, fav]);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-32 sm:px-8 lg:px-12 lg:pb-20">
      <MobileTopBar />
      <PageHeader eyebrow="Mapishi" title="Recipes">
        {MEAL_LIST.length} everyday Kenyan meals. Every ingredient weighed, every portion counted, scaled to however many you&rsquo;re feeding.
      </PageHeader>

      <div className="sticky top-0 z-20 -mx-5 bg-paper/90 px-5 pb-4 pt-2 backdrop-blur-lg sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
        <label className="flex items-center gap-3 rounded-full border border-line-2 bg-card px-5 py-3.5 shadow-[0_10px_30px_-22px_rgba(40,30,10,.5)] focus-within:border-forest">
          <Search className="size-[18px] text-muted" strokeWidth={1.8} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a dish or an ingredient: pilau, ndengu, coconut…"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted/70"
            aria-label="Search recipes"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="grid size-7 place-items-center rounded-full bg-paper-2 text-muted hover:text-ink" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.id === "saved" && <Heart className="-mt-0.5 mr-1 inline size-3" />}
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-5 mt-3 flex items-center justify-between gap-4">
        <span className="tnum text-sm text-muted">
          {results.length} {results.length === 1 ? "meal" : "meals"}
        </span>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <span className="text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
            className="rounded-full border border-line-2 bg-card px-3 py-1.5 text-sm font-medium outline-none focus:border-forest"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 xl:gap-x-8">
          {results.map((m, i) => (
            <li key={m.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 9) * 35}ms` }}>
              <RecipeCard meal={m} saved={fav.includes(m.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[24px] border border-dashed border-line-2 px-6 py-16 text-center">
          <p className="font-display text-2xl">No meals match that</p>
          <p className="mt-2 text-sm text-muted">Try one of these instead:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Chip
                key={s}
                onClick={() => {
                  setQ(s);
                  setFilter("all");
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function RecipeCard({ meal, saved }: { meal: Meal; saved: boolean }) {
  const n = MEAL_INFO[meal.id].n;
  const slot = meal.slots.includes("breakfast") ? "Breakfast" : meal.slots.includes("snack") ? "Snack" : "Lunch & supper";
  return (
    <div className="group relative">
      <Link href={`/recipes/${meal.id}`} className="block">
        <div className="overflow-hidden rounded-[20px]">
          <MealPhoto id={meal.id} sizes="(min-width: 1024px) 340px, (min-width: 768px) 33vw, 50vw" className="aspect-[4/5] transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        </div>
        <div className="mt-3.5">
          <div className="eyebrow text-[10px] text-clay">
            {meal.region} · {slot}
          </div>
          <h3 className="font-display mt-1.5 text-[19px] leading-[1.15] text-ink transition-colors group-hover:text-forest sm:text-[21px]">{meal.name}</h3>
          <div className="tnum mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            <span>
              <span className="font-medium text-ink-2">{kcal(n.kcal)}</span> kcal
            </span>
            <span className="text-line-2">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {duration(meal.minutes)}
            </span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(meal.id)}
        aria-label={saved ? `Remove ${meal.name} from saved` : `Save ${meal.name}`}
        aria-pressed={saved}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-paper/85 backdrop-blur transition hover:scale-105"
      >
        <Heart className={`size-4 ${saved ? "fill-clay text-clay" : "text-ink-2"}`} strokeWidth={1.8} />
      </button>
    </div>
  );
}
