import "server-only";
import { Redis } from "@upstash/redis";
import { MEALS } from "@/lib/data/meals";

/**
 * A household is one Redis hash, keyed by its share code. Each field holds one
 * independently-syncable piece of state, so two phones editing different days
 * (or ticking different market items) never overwrite each other:
 *
 *   profile        → Profile
 *   d:2026-11-24   → DayPlan
 *   c:tomato       → true            (ticked on the market list)
 *   _v             → version, bumped on every write
 */

let client: Redis | null = null;
function redis() {
  // Lazy so `next build` never needs the env vars.
  if (!client) client = Redis.fromEnv();
  return client;
}

const TTL_SECONDS = 60 * 60 * 24 * 120; // forget households unused for 120 days
const MAX_FIELDS = 1500;
const MAX_FIELDS_PER_WRITE = 400;

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const WORDS = [
  "UGALI", "PILAU", "CHAPO", "SUKUMA", "GITHERI", "MUKIMO", "MANDAZI", "NDENGU",
  "OMENA", "MATOKE", "CHAI", "UJI", "NDUMA", "NJUGU", "KUKU", "NYAMA", "SAMAKI",
  "MAHAMRI", "MBAAZI", "EMBE", "NAZI", "KACHUMBARI", "MALA", "MANAGU", "NGWACI",
];

export const CODE_RE = /^[A-Z]{3,10}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
const FIELD_RE = /^(profile|d:\d{4}-\d{2}-\d{2}|c:[a-z0-9-]{1,40})$/;
const SLOTS = new Set(["breakfast", "snack", "lunch", "snack2", "supper"]);
const MAINS = new Set(["breakfast", "lunch", "supper"]);
const KINDS = new Set(["beef", "goat", "chicken", "fish", "egg", "dairy"]);

const key = (code: string) => `household:${code}`;

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^([A-Z]+?)([2-9A-Z]{6})$/, "$1-$2");
}

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  const word = WORDS[bytes[0] % WORDS.length];
  const tail = Array.from(bytes.slice(1), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${word}-${tail}`;
}

export class BadRequest extends Error {}

function validValue(field: string, value: unknown): boolean {
  if (field.startsWith("c:")) return value === true;
  if (field === "profile") {
    const p = value as Record<string, unknown>;
    return (
      !!p &&
      typeof p === "object" &&
      Number.isInteger(p.people) && (p.people as number) >= 1 && (p.people as number) <= 30 &&
      typeof p.target === "number" && p.target >= 1000 && p.target <= 5000 &&
      ["all", "pescatarian", "vegetarian"].includes(p.diet as string) &&
      Array.isArray(p.avoid) && p.avoid.every((k) => KINDS.has(k as string)) &&
      typeof p.snacks === "boolean" &&
      typeof p.quickWeekdays === "boolean" &&
      (p.meals === undefined ||
        (Array.isArray(p.meals) && p.meals.length >= 1 && p.meals.length <= 3 && p.meals.every((m) => MAINS.has(m as string)))) &&
      (p.fill === undefined || p.fill === "portions" || p.fill === "snacks") &&
      (p.budget === undefined || (typeof p.budget === "number" && p.budget > 0 && p.budget <= 1_000_000))
    );
  }
  // A day: { breakfast?: { meal, locked?, eaten? }, ... }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).every(([slot, pm]) => {
    const m = pm as Record<string, unknown>;
    return (
      SLOTS.has(slot) &&
      !!m && typeof m === "object" &&
      typeof m.meal === "string" && !!MEALS[m.meal] &&
      (m.locked === undefined || typeof m.locked === "boolean") &&
      (m.scale === undefined || (typeof m.scale === "number" && m.scale >= 0.5 && m.scale <= 2.5)) &&
      (m.eaten === undefined || typeof m.eaten === "boolean")
    );
  });
}

export function validateWrite(body: unknown): { set: Record<string, unknown>; del: string[] } {
  const b = body as { set?: Record<string, unknown>; del?: unknown };
  const set = b?.set && typeof b.set === "object" ? b.set : {};
  const del = Array.isArray(b?.del) ? (b.del as unknown[]) : [];
  const fields = Object.keys(set);
  if (fields.length + del.length > MAX_FIELDS_PER_WRITE) throw new BadRequest("Too many changes at once");
  for (const f of fields) {
    if (!FIELD_RE.test(f) || !validValue(f, set[f])) throw new BadRequest(`Invalid field: ${f}`);
  }
  for (const f of del) {
    if (typeof f !== "string" || !FIELD_RE.test(f) || f === "profile") throw new BadRequest("Invalid delete");
  }
  return { set, del: del as string[] };
}

export async function createHousehold(set: Record<string, unknown>) {
  if (!("profile" in set)) throw new BadRequest("A household needs a profile");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    // Claim the code atomically; retry on the (very unlikely) collision.
    const claimed = await redis().hsetnx(key(code), "_v", 1);
    if (!claimed) continue;
    const tx = redis().multi();
    tx.hset(key(code), set);
    tx.expire(key(code), TTL_SECONDS);
    await tx.exec();
    return { code, v: 1 };
  }
  throw new Error("Could not allocate a household code");
}

export async function readHousehold(code: string) {
  const data = await redis().hgetall<Record<string, unknown>>(key(code));
  if (!data || !Object.keys(data).length) return null;
  await redis().expire(key(code), TTL_SECONDS);
  const { _v, ...fields } = data;
  return { v: Number(_v) || 0, fields };
}

export async function writeHousehold(code: string, set: Record<string, unknown>, del: string[]) {
  const k = key(code);
  if (!(await redis().exists(k))) return null;
  if (Object.keys(set).length && (await redis().hlen(k)) + Object.keys(set).length > MAX_FIELDS) {
    throw new BadRequest("This household has too much data; old days will be cleaned up automatically.");
  }
  const tx = redis().multi();
  if (Object.keys(set).length) tx.hset(k, set);
  if (del.length) tx.hdel(k, ...del);
  tx.hincrby(k, "_v", 1);
  tx.expire(k, TTL_SECONDS);
  const results = await tx.exec();
  const v = results[results.length - 2] as number;
  return { v };
}
