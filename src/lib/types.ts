export type Slot = "breakfast" | "snack" | "lunch" | "supper";

/** Where in a Kenyan shopping trip an ingredient is bought. */
export type Aisle = "mboga" | "nyama" | "samaki" | "duka" | "maziwa" | "viungo" | "none";

/** Used for diet filtering. Anything not listed is plant-based. */
export type Kind = "beef" | "goat" | "chicken" | "fish" | "egg" | "dairy";

export type Diet = "all" | "pescatarian" | "vegetarian";

export interface Ingredient {
  id: string;
  name: string;
  sw?: string;
  /** Nutrition per 100 g of the edible part. */
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** Fraction of the bought weight you actually eat (peel, bone, stalks). */
  edible?: number;
  aisle: Aisle;
  kind?: Kind;
  /** A countable household unit, e.g. one medium tomato = 120 g. */
  count?: { one: string; many: string; g: number; of?: boolean };
  /** Density in g/ml — marks the ingredient as a liquid. */
  density?: number;
  /** Grams in one level teaspoon, for small measures. */
  tsp?: number;
  /** Grams in one 250 ml cup. */
  cup?: number;
  /** How it is sold, e.g. a 2 kg packet. */
  pack?: { label: string; g: number };
  /** Usually already in the kitchen (salt, oil, spices). */
  staple?: boolean;
  /** Sold loose by weight even though recipes count it in pieces. */
  byWeight?: boolean;
  /** Wilts or spoils fast — buy close to cooking. */
  fresh?: boolean;
}

export interface RecipeLine {
  id: string;
  /** Bought weight in grams for the base recipe. */
  g: number;
  note?: string;
  /** Grams that actually end up eaten, when different from g (e.g. frying oil). */
  eat?: number;
}

export interface Recipe {
  id: string;
  name: string;
  sw?: string;
  /** How many portions the base recipe makes. */
  yields: number;
  /** Name for one portion when it is a countable thing (chapati, mandazi). */
  unit?: { one: string; many: string };
  /** Cooked weight of one portion and what it looks like on the plate. */
  portion: { g: number; looks: string };
  lines: RecipeLine[];
  /** Steps. `{ingredientId}` is replaced with the scaled amount, `{n}` with the
   *  number of portions and `{portion}` with the cooked weight of one portion. */
  steps: string[];
  prep: number;
  cook: number;
}

export interface MealPart {
  recipe: string;
  /** Portions of this recipe per person (default 1). */
  qty?: number;
}

export type Region =
  | "Countrywide"
  | "Central"
  | "Coast"
  | "Western"
  | "Nyanza"
  | "Rift Valley";

export interface Meal {
  id: string;
  name: string;
  sw: string;
  blurb: string;
  slots: Slot[];
  parts: MealPart[];
  region: Region;
  minutes: number;
  /** Order to cook the parts so everything lands hot together. */
  order?: string;
  /** Something to do the day before. */
  prepAhead?: string;
  weekendOnly?: boolean;
  budget?: boolean;
  /** Focal point for object-position when cropping the photo. */
  focus?: string;
}

export interface Profile {
  people: number;
  target: number;
  diet: Diet;
  avoid: Kind[];
  snacks: boolean;
  quickWeekdays: boolean;
}

export interface PlannedMeal {
  meal: string;
  locked?: boolean;
  eaten?: boolean;
}

export type DayPlan = Partial<Record<Slot, PlannedMeal>>;

export interface AppState {
  v: 1;
  profile: Profile | null;
  days: Record<string, DayPlan>;
  checked: Record<string, boolean>;
  favorites: string[];
  seed: number;
}
