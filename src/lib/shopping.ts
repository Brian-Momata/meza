import { AISLES, ingredient } from "./data/ingredients";
import { MEALS } from "./data/meals";
import { recipe } from "./data/recipes";
import { daySlots } from "./planner";
import type { Aisle, DayPlan, Ingredient, Profile, Recipe } from "./types";

export interface ShopItem {
  ingredient: Ingredient;
  grams: number;
  uses: { meal: string; date: string }[];
}

export interface ShopGroup {
  aisle: Exclude<Aisle, "none">;
  name: string;
  sw: string;
  hint: string;
  items: ShopItem[];
}

/** Estimated KSh for the amount the meals use (whole packs cost more up front). */
export function itemCost(item: ShopItem): number {
  return (item.grams / 1000) * item.ingredient.kes;
}

/** Scaled lines of a recipe for `portions` portions. */
export function scaleRecipe(r: Recipe, portions: number) {
  const k = portions / r.yields;
  return r.lines.map((l) => ({ ...l, g: l.g * k, eat: l.eat !== undefined ? l.eat * k : undefined }));
}

export function buildShoppingList(
  days: Record<string, DayPlan>,
  dates: string[],
  profile: Profile,
): ShopGroup[] {
  const items = new Map<string, ShopItem>();
  for (const date of dates) {
    const day = days[date];
    if (!day) continue;
    for (const slot of daySlots(day)) {
      const pm = day[slot];
      const meal = pm && MEALS[pm.meal];
      if (!meal) continue;
      for (const part of meal.parts) {
        const r = recipe(part.recipe);
        for (const line of scaleRecipe(r, profile.people * (part.qty ?? 1) * (pm!.scale ?? 1))) {
          const ing = ingredient(line.id);
          if (ing.aisle === "none") continue;
          const item = items.get(ing.id) ?? { ingredient: ing, grams: 0, uses: [] };
          item.grams += line.g;
          if (!item.uses.some((u) => u.meal === meal.id && u.date === date)) item.uses.push({ meal: meal.id, date });
          items.set(ing.id, item);
        }
      }
    }
  }
  return AISLES.map((a) => ({
    aisle: a.id,
    name: a.name,
    sw: a.sw,
    hint: a.hint,
    items: [...items.values()]
      .filter((i) => i.ingredient.aisle === a.id)
      .sort((x, y) => Number(!!x.ingredient.staple) - Number(!!y.ingredient.staple) || x.ingredient.name.localeCompare(y.ingredient.name)),
  })).filter((g) => g.items.length);
}
