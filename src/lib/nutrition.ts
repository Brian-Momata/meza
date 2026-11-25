import { ingredient } from "./data/ingredients";
import { MEAL_LIST, MEALS } from "./data/meals";
import { RECIPES, recipe } from "./data/recipes";
import type { Kind, Meal, Profile, Recipe, RecipeLine } from "./types";

export interface Nutrients {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

const zero = (): Nutrients => ({ kcal: 0, p: 0, c: 0, f: 0 });

function add(a: Nutrients, b: Nutrients, k = 1): Nutrients {
  return { kcal: a.kcal + b.kcal * k, p: a.p + b.p * k, c: a.c + b.c * k, f: a.f + b.f * k };
}

/** Nutrients in one recipe line, counting only the part you eat. */
export function lineNutrients(line: RecipeLine): Nutrients {
  const ing = ingredient(line.id);
  const eaten = ((line.eat ?? line.g) * (ing.edible ?? 1)) / 100;
  return { kcal: ing.kcal * eaten, p: ing.p * eaten, c: ing.c * eaten, f: ing.f * eaten };
}

/**
 * What one recipe line costs in KES. Counts the weight you buy, except frying
 * oil: most of it goes back in the bottle and gets used about three times.
 */
export function lineCost(line: RecipeLine): number {
  const ing = ingredient(line.id);
  const g = line.eat !== undefined ? line.eat + (line.g - line.eat) / 3 : line.g;
  return (g / 1000) * ing.kes;
}

const costCache = new Map<string, number>();

/** KES for one portion of a recipe. */
export function costPerPortion(r: Recipe | string): number {
  const rec = typeof r === "string" ? recipe(r) : r;
  const hit = costCache.get(rec.id);
  if (hit !== undefined) return hit;
  const out = rec.lines.reduce((sum, l) => sum + lineCost(l), 0) / rec.yields;
  costCache.set(rec.id, out);
  return out;
}

const portionCache = new Map<string, Nutrients>();

/** Nutrients in one portion of a recipe. */
export function perPortion(r: Recipe | string): Nutrients {
  const rec = typeof r === "string" ? recipe(r) : r;
  const hit = portionCache.get(rec.id);
  if (hit) return hit;
  const total = rec.lines.reduce((acc, l) => add(acc, lineNutrients(l)), zero());
  const out = { kcal: total.kcal / rec.yields, p: total.p / rec.yields, c: total.c / rec.yields, f: total.f / rec.yields };
  portionCache.set(rec.id, out);
  return out;
}

export interface PlatePart {
  recipe: Recipe;
  qty: number;
  grams: number;
  n: Nutrients;
}

export interface MealInfo {
  meal: Meal;
  /** Per person. */
  n: Nutrients;
  plate: PlatePart[];
  plateGrams: number;
  /** KES per person for a standard plate. */
  kes: number;
  kinds: Set<Kind>;
  vegetarian: boolean;
  pescatarian: boolean;
  highProtein: boolean;
  search: string;
}

function buildInfo(meal: Meal): MealInfo {
  const plate: PlatePart[] = meal.parts.map((p) => {
    const rec = recipe(p.recipe);
    const qty = p.qty ?? 1;
    const per = perPortion(rec);
    return {
      recipe: rec,
      qty,
      grams: rec.portion.g * qty,
      n: { kcal: per.kcal * qty, p: per.p * qty, c: per.c * qty, f: per.f * qty },
    };
  });
  const n = plate.reduce((acc, part) => add(acc, part.n), zero());
  const kinds = new Set<Kind>();
  const words: string[] = [meal.name, meal.sw, meal.region, meal.blurb];
  for (const part of plate) {
    words.push(part.recipe.name, part.recipe.sw ?? "");
    for (const l of part.recipe.lines) {
      const ing = ingredient(l.id);
      if (ing.kind) kinds.add(ing.kind);
      words.push(ing.name, ing.sw ?? "");
    }
  }
  const meat = kinds.has("beef") || kinds.has("goat") || kinds.has("chicken");
  return {
    meal,
    n,
    plate,
    plateGrams: plate.reduce((s, p) => s + p.grams, 0),
    kes: meal.parts.reduce((s, p) => s + costPerPortion(p.recipe) * (p.qty ?? 1), 0),
    kinds,
    vegetarian: !meat && !kinds.has("fish"),
    pescatarian: !meat,
    highProtein: n.p >= 30,
    search: words.join(" ").toLowerCase(),
  };
}

export const MEAL_INFO: Record<string, MealInfo> = Object.fromEntries(MEAL_LIST.map((m) => [m.id, buildInfo(m)]));

export function info(id: string): MealInfo {
  const i = MEAL_INFO[id];
  if (!i) throw new Error(`Unknown meal: ${id}`);
  return i;
}

export function kcalOf(id: string): number {
  return MEAL_INFO[id]?.n.kcal ?? 0;
}

/** KES per person for a standard plate of this meal. */
export function costOf(id: string): number {
  return MEAL_INFO[id]?.kes ?? 0;
}

export function fitsProfile(id: string, profile: Pick<Profile, "diet" | "avoid">): boolean {
  const i = MEAL_INFO[id];
  if (!i) return false;
  if (profile.diet === "vegetarian" && !i.vegetarian) return false;
  if (profile.diet === "pescatarian" && !i.pescatarian) return false;
  return !profile.avoid.some((k) => i.kinds.has(k));
}

/** Total time for the whole meal, already stored on the meal. */
export function minutesOf(id: string) {
  return MEALS[id]?.minutes ?? 0;
}

export { RECIPES };
