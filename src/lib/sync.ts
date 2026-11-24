"use client";

import { onLocalChange, readState, writeRemote } from "./store";
import type { AppState, DayPlan, HouseholdLink, Profile } from "./types";

/**
 * Household sync. The shared plan is split into small fields (the profile,
 * one per day, one per ticked market item) so two phones editing different
 * things never clobber each other. Local edits are pushed as field diffs a
 * moment after they happen; remote edits are pulled while the app is open.
 */

type Fields = Record<string, unknown>;

const PULL_EVERY_MS = 15_000;
const PUSH_AFTER_MS = 600;
/** Only sync days from a week ago onward; older history stays on the phone. */
const KEEP_DAYS = 7;

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^([A-Z]+?)([2-9A-Z]{6})$/, "$1-$2");
}

function cutoff() {
  const d = new Date();
  d.setDate(d.getDate() - KEEP_DAYS);
  return d.toISOString().slice(0, 10);
}

/** The parts of the app state a household shares. Favourites stay personal. */
export function sharedFields(s: AppState): Fields {
  const out: Fields = {};
  if (s.profile) out.profile = s.profile;
  const from = cutoff();
  for (const [date, day] of Object.entries(s.days)) {
    if (date >= from && Object.keys(day).length) out[`d:${date}`] = day;
  }
  for (const [id, on] of Object.entries(s.checked)) if (on) out[`c:${id}`] = true;
  return out;
}

function applyFields(s: AppState, fields: Fields): AppState {
  const days: Record<string, DayPlan> = {};
  // Keep old local history that the household no longer carries.
  const from = cutoff();
  for (const [d, day] of Object.entries(s.days)) if (d < from) days[d] = day;
  const checked: Record<string, boolean> = {};
  let profile: Profile | null = s.profile;
  for (const [f, v] of Object.entries(fields)) {
    if (f === "profile") profile = v as Profile;
    else if (f.startsWith("d:")) days[f.slice(2)] = v as DayPlan;
    else if (f.startsWith("c:")) checked[f.slice(2)] = true;
  }
  return { ...s, profile, days, checked };
}

/* ── Pending local changes ─────────────────────────────────────────────── */

/** field → new value, or null for "delete this field". */
const pending = new Map<string, unknown>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let pulling = false;
let pullAgain = false;

function diff(prev: AppState, next: AppState) {
  const a = sharedFields(prev);
  const b = sharedFields(next);
  for (const [f, v] of Object.entries(b)) {
    if (JSON.stringify(a[f]) !== JSON.stringify(v)) pending.set(f, v);
  }
  for (const f of Object.keys(a)) if (!(f in b) && f.startsWith("c:")) pending.set(f, null);
  // Days that merely aged past the cutoff aren't deletions, so only ticks are removed.
}

function setLink(patch: Partial<HouseholdLink> | null) {
  const s = readState();
  if (!s.household && patch) return;
  writeRemote({ ...s, household: patch === null ? null : { ...s.household!, ...patch } });
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(push, PUSH_AFTER_MS);
}

async function push() {
  const link = readState().household;
  if (!link || pushing || !pending.size) return;
  pushing = true;
  const batch = new Map(pending);
  const set: Fields = {};
  const del: string[] = [];
  for (const [f, v] of batch) {
    if (v === null) del.push(f);
    else set[f] = v;
  }
  try {
    const res = await fetch(`/api/household/${link.code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set, del }),
    });
    if (res.status === 404) return setLink({ status: "gone" });
    if (!res.ok) throw new Error(String(res.status));
    const { v } = (await res.json()) as { v: number };
    // Forget what we sent, unless it changed again while in flight.
    for (const [f, val] of batch) if (pending.get(f) === val) pending.delete(f);
    const someoneElseWrote = v !== link.v + 1;
    setLink({ v, syncedAt: Date.now(), status: "ok" });
    // Our version number skipped ahead, so fetch what the other phone wrote.
    if (someoneElseWrote) void pull(true);
  } catch {
    setLink({ status: "offline" });
  } finally {
    pushing = false;
    if (pending.size) schedulePush();
  }
}

export async function pull(force = false) {
  const link = readState().household;
  if (!link) return;
  if (pulling) {
    if (force) pullAgain = true;
    return;
  }
  pulling = true;
  try {
    const res = await fetch(`/api/household/${link.code}`, { cache: "no-store" });
    if (res.status === 404) return setLink({ status: "gone" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { v: number; fields: Fields };
    const s = readState();
    if (!s.household || s.household.code !== link.code) return;
    if (!force && data.v === s.household.v && !pending.size) {
      return setLink({ syncedAt: Date.now(), status: "ok" });
    }
    // Remote wins, except for local edits that haven't been sent yet.
    const merged: Fields = { ...data.fields };
    for (const [f, v] of pending) {
      if (v === null) delete merged[f];
      else merged[f] = v;
    }
    writeRemote({ ...applyFields(s, merged), household: { code: link.code, v: data.v, syncedAt: Date.now(), status: "ok" } });
  } catch {
    setLink({ status: "offline" });
  } finally {
    pulling = false;
    if (pullAgain) {
      pullAgain = false;
      void pull(true);
    }
  }
}

/* ── Lifecycle ─────────────────────────────────────────────────────────── */

let started = false;

/** Start syncing. Safe to call more than once. */
export function startSync() {
  if (started) return;
  started = true;
  onLocalChange((prev, next) => {
    if (!next.household || next.household.status === "gone") return;
    if (prev.household?.code !== next.household.code) return; // just joined/created
    diff(prev, next);
    if (pending.size) schedulePush();
  });
  const tick = () => {
    if (document.visibilityState === "visible") void pull();
  };
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("focus", tick);
  window.addEventListener("online", () => {
    void push();
    void pull();
  });
  setInterval(tick, PULL_EVERY_MS);
  tick();
}

/* ── Create / join / leave ─────────────────────────────────────────────── */

export async function createHousehold(): Promise<string> {
  const s = readState();
  const res = await fetch("/api/household", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ set: sharedFields(s) }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not create a household");
  const { code, v } = (await res.json()) as { code: string; v: number };
  pending.clear();
  writeRemote({ ...readState(), household: { code, v, syncedAt: Date.now(), status: "ok" } });
  return code;
}

/** Look a household up without joining it. */
export async function peekHousehold(code: string) {
  const res = await fetch(`/api/household/${normalizeCode(code)}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error("Could not reach the household right now");
  return (await res.json()) as { v: number; fields: Fields };
}

/** Replace this phone's plan with the household's. */
export async function joinHousehold(raw: string) {
  const code = normalizeCode(raw);
  const data = await peekHousehold(code);
  if (!data) throw new Error("There's no household with that code. Check it and try again.");
  pending.clear();
  const s = readState();
  writeRemote({
    ...applyFields({ ...s, days: {}, checked: {} }, data.fields),
    household: { code, v: data.v, syncedAt: Date.now(), status: "ok" },
  });
}

/** Stop sharing. This phone keeps a copy of the plan as it is now. */
export function leaveHousehold() {
  pending.clear();
  writeRemote({ ...readState(), household: null });
}
