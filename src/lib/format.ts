import { ingredient, shortName } from "./data/ingredients";
import type { Ingredient } from "./types";

const FRACTIONS: [number, string][] = [
  [0, ""],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
  [1, ""],
];

/** Nearest kitchen-friendly fraction: ¼ ⅓ ½ ⅔ ¾ (thirds only when allowed). */
export function frac(x: number, thirds = false): string {
  if (x <= 0) return "0";
  const whole = Math.floor(x);
  const rest = x - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) {
    if (!thirds && (f[1] === "⅓" || f[1] === "⅔")) continue;
    if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  }
  const w = best[0] === 1 ? whole + 1 : whole;
  if (w === 0) return best[1] || (thirds ? "⅓" : "¼");
  return `${w}${best[1]}`;
}

function fracValue(x: number, thirds = false): number {
  const s = frac(x, thirds);
  const m = s.match(/^(\d*)([¼⅓½⅔¾]?)$/);
  if (!m) return x;
  const map: Record<string, number> = { "¼": 0.25, "⅓": 1 / 3, "½": 0.5, "⅔": 2 / 3, "¾": 0.75, "": 0 };
  return (m[1] ? Number(m[1]) : 0) + map[m[2]];
}

export function grams(g: number): string {
  if (g >= 1000) return `${(Math.round(g / 50) * 50 / 1000).toLocaleString("en-KE", { maximumFractionDigits: 2 })} kg`;
  if (g >= 200) return `${Math.round(g / 10) * 10} g`;
  if (g >= 20) return `${Math.round(g / 5) * 5} g`;
  if (g >= 1) return `${Math.round(g)} g`;
  return `${Math.max(0.5, Math.round(g * 2) / 2)} g`;
}

function millilitres(ml: number): string {
  if (ml >= 1000) return `${(Math.round(ml / 50) * 50 / 1000).toLocaleString("en-KE", { maximumFractionDigits: 2 })} L`;
  if (ml >= 100) return `${Math.round(ml / 10) * 10} ml`;
  return `${Math.round(ml / 5) * 5} ml`;
}

function plural(n: number, one: string, many: string) {
  return n > 1 ? many : one;
}

export interface Amount {
  main: string;
  sub?: string;
}

/** How much of an ingredient, in the units a Kenyan home cook would reach for. */
export function amount(ingOrId: Ingredient | string, g: number): Amount {
  const ing = typeof ingOrId === "string" ? ingredient(ingOrId) : ingOrId;
  if (g <= 0) return { main: "—" };

  if (ing.count) {
    const n = g / ing.count.g;
    if (n < 0.2 && ing.tsp) return spoons(ing, g);
    // Cloves, chillies and cubes don't come in quarters; tomatoes and onions can be halved.
    const tiny = ing.count.g <= 15;
    const val = n >= 4 || (tiny && n >= 0.75) ? Math.max(1, Math.round(n)) : n >= 1 ? Math.round(n * 2) / 2 : fracValue(n);
    const shown = Number.isInteger(val) ? String(val) : frac(val);
    return { main: `${shown} ${plural(val, ing.count.one, ing.count.many)}`, sub: ing.count.g * val >= 20 ? grams(g) : undefined };
  }

  if (ing.density) {
    const ml = g / ing.density;
    if (ml < 12.5) return { main: `${frac(ml / 5)} tsp` };
    if (ml < 62.5) return { main: `${frac(ml / 15)} tbsp`, sub: millilitres(ml) };
    const cups = ml / 250;
    return { main: `${frac(cups, true)} ${plural(fracValue(cups, true), "cup", "cups")}`, sub: millilitres(ml) };
  }

  if (ing.tsp) return spoons(ing, g);

  if (ing.cup && g >= ing.cup / 4) {
    const cups = g / ing.cup;
    return { main: `${frac(cups, true)} ${plural(fracValue(cups, true), "cup", "cups")}`, sub: grams(g) };
  }

  return { main: grams(g) };
}

function spoons(ing: Ingredient, g: number): Amount {
  const t = g / (ing.tsp ?? 5);
  if (t < 0.2) return { main: "a pinch" };
  if (t < 2.75) return { main: `${frac(t)} tsp` };
  if (ing.cup && g >= ing.cup / 4) {
    const cups = g / ing.cup;
    return { main: `${frac(cups, true)} ${plural(fracValue(cups, true), "cup", "cups")}`, sub: grams(g) };
  }
  if (t / 3 > 6) return { main: grams(g) };
  return { main: `${frac(t / 3)} tbsp`, sub: g >= 5 ? grams(g) : undefined };
}

/** How much to buy, rounded up to what you can actually buy. */
export function buy(ingOrId: Ingredient | string, g: number): Amount {
  const ing = typeof ingOrId === "string" ? ingredient(ingOrId) : ingOrId;

  if (ing.count && !ing.tsp && !ing.byWeight) {
    // Small tolerance so 2.05 tomatoes doesn't become 3.
    const n = Math.max(1, Math.ceil(g / ing.count.g - 0.12));
    if (ing.id === "garlic") {
      const heads = Math.ceil(n / 10);
      return { main: `${n} ${plural(n, "clove", "cloves")}`, sub: `${heads} ${plural(heads, "head", "heads")}` };
    }
    if (ing.pack) {
      const packs = Math.ceil(g / ing.pack.g);
      return { main: `${packs} × ${ing.pack.label}`, sub: `${n} ${plural(n, ing.count.one, ing.count.many)}` };
    }
    return { main: `${n} ${plural(n, ing.count.one, ing.count.many)}`, sub: `≈ ${grams(n * ing.count.g)}` };
  }

  if (ing.pack) {
    const packs = Math.max(1, Math.ceil(g / ing.pack.g - 0.03));
    const need = ing.density ? millilitres(g / ing.density) : grams(g);
    if (ing.staple) return { main: need, sub: "check the pantry" };
    return { main: `${packs} × ${ing.pack.label}`, sub: `you'll use ${need}` };
  }

  if (ing.tsp) {
    const a = spoons(ing, g);
    return { main: a.main, sub: ing.staple ? "check the pantry" : a.sub };
  }

  if (ing.density) {
    return { main: millilitres(g / ing.density) };
  }

  // Loose weight: butchery, fishmonger, pulses, produce by the kilo.
  const step = g >= 1000 ? 250 : g >= 200 ? 50 : 10;
  return { main: grams(Math.ceil(g / step) * step) };
}

export function kcal(n: number) {
  return Math.round(n).toLocaleString("en-KE");
}

export function plateGrams(g: number) {
  return `${Math.round(g / 5) * 5} g`;
}

export function duration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Amount plus a short name, for use inside method steps. */
export function inline(id: string, g: number): string {
  const ing = ingredient(id);
  const a = amount(ing, g);
  if (a.main === "a pinch") return `a pinch of ${shortName(id)}`;
  if (ing.count && !(g / ing.count.g < 0.2 && ing.tsp)) {
    return ing.count.of ? `${a.main} of ${shortName(id)}` : a.main;
  }
  return `${a.sub ? `${a.main} (${a.sub})` : a.main} ${shortName(id)}`;
}
