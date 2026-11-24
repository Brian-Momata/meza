"use client";

import { useSyncExternalStore } from "react";
import { MEALS } from "./data/meals";
import { today, weekDates, weekStart } from "./dates";
import { planDays } from "./planner";
import type { AppState, DayPlan, Profile, Slot } from "./types";

const KEY = "meza:v1";

const fresh = (): AppState => ({
  v: 1,
  profile: null,
  days: {},
  checked: {},
  favorites: [],
  seed: Math.floor(Math.random() * 1e9),
});

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.v !== 1) return fresh();
    // Drop meals that no longer exist (data updates between versions).
    for (const day of Object.values(parsed.days)) {
      for (const slot of Object.keys(day) as Slot[]) if (!MEALS[day[slot]!.meal]) delete day[slot];
    }
    return { ...fresh(), ...parsed };
  } catch {
    return fresh();
  }
}

function read(): AppState {
  if (!state) state = load();
  return state;
}

function write(next: AppState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or disabled — keep working in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** The app state, or `null` while rendering on the server / before hydration. */
export function useApp(): AppState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

function update(fn: (s: AppState) => AppState) {
  write(fn(read()));
}

const nextSeed = () => Math.floor(Math.random() * 1e9);

/* ── Actions ─────────────────────────────────────────────────────────────── */

/** Make sure every day of the week starting `start` has a plan. */
export function ensureWeek(start: string) {
  const s = read();
  if (!s.profile) return;
  const missing = weekDates(start).filter((d) => !s.days[d] || !Object.keys(s.days[d]).length);
  if (!missing.length) return;
  write({ ...s, days: planDays(missing, s.profile, s.days, s.seed ^ Number(missing[0].replace(/-/g, ""))) });
}

export function saveProfile(profile: Profile, opts: { replan?: boolean } = {}) {
  update((s) => {
    const first = !s.profile;
    let days = s.days;
    const t = today();
    if (first || opts.replan) {
      // Re-plan from today onward; keep the past and anything locked or eaten.
      const future = Object.keys(days).filter((d) => d >= t);
      const thisWeek = weekDates(weekStart(t)).filter((d) => d >= t);
      const dates = [...new Set([...future, ...thisWeek])];
      const cleared: Record<string, DayPlan> = { ...days };
      for (const d of dates) {
        const day = cleared[d] ?? {};
        const kept: DayPlan = {};
        for (const slot of Object.keys(day) as Slot[]) {
          const pm = day[slot]!;
          if (pm.locked || pm.eaten) kept[slot] = pm;
        }
        cleared[d] = kept;
      }
      days = planDays(dates, profile, cleared, nextSeed());
      // Fill the earlier part of this week too, so the week view is complete.
      const past = weekDates(weekStart(t)).filter((d) => d < t && !days[d]);
      if (past.length) days = planDays(past, profile, days, nextSeed());
    }
    return { ...s, profile, days };
  });
}

/** Shuffle every unlocked, uneaten slot from today onward in the given week. */
export function reshuffleWeek(start: string) {
  update((s) => {
    if (!s.profile) return s;
    const t = today();
    const dates = weekDates(start).filter((d) => d >= t);
    const cleared: Record<string, DayPlan> = { ...s.days };
    for (const d of dates) {
      const kept: DayPlan = {};
      const day = s.days[d] ?? {};
      for (const slot of Object.keys(day) as Slot[]) {
        const pm = day[slot]!;
        if (pm.locked || pm.eaten) kept[slot] = pm;
      }
      cleared[d] = kept;
    }
    return { ...s, days: planDays(dates, s.profile, cleared, nextSeed()) };
  });
}

export function setMeal(date: string, slot: Slot, mealId: string) {
  update((s) => ({
    ...s,
    days: { ...s.days, [date]: { ...s.days[date], [slot]: { meal: mealId, locked: true } } },
  }));
}

export function toggleLock(date: string, slot: Slot) {
  update((s) => {
    const pm = s.days[date]?.[slot];
    if (!pm) return s;
    return { ...s, days: { ...s.days, [date]: { ...s.days[date], [slot]: { ...pm, locked: !pm.locked } } } };
  });
}

export function toggleEaten(date: string, slot: Slot) {
  update((s) => {
    const pm = s.days[date]?.[slot];
    if (!pm) return s;
    return { ...s, days: { ...s.days, [date]: { ...s.days[date], [slot]: { ...pm, eaten: !pm.eaten } } } };
  });
}

export function toggleChecked(key: string) {
  update((s) => {
    const checked = { ...s.checked };
    if (checked[key]) delete checked[key];
    else checked[key] = true;
    return { ...s, checked };
  });
}

export function clearChecked(keys: string[]) {
  update((s) => {
    const checked = { ...s.checked };
    for (const k of keys) delete checked[k];
    return { ...s, checked };
  });
}

export function toggleFavorite(id: string) {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
  }));
}

export function resetEverything() {
  write(fresh());
}
