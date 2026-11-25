import type { Ingredient } from "../types";

/**
 * Nutrition per 100 g edible portion. Values follow the Kenya Food Composition
 * Tables (2018) where available and USDA FoodData Central otherwise, rounded.
 * `edible` is the share of the bought weight you eat (bone, peel, stalks).
 *
 * `kes` is an estimated Nairobi retail price per kg as bought (per kg, not per
 * litre, for liquids), from mama mboga, butchery and supermarket shelf prices.
 * Prices move with the season and the town, so treat costs as a guide.
 */
const list: Ingredient[] = [
  // ── Duka: flours, grains, pulses ──────────────────────────────────────────
  { id: "maize-flour", name: "Maize flour", sw: "Unga wa ugali", kes: 80, kcal: 362, p: 8.1, c: 76.9, f: 3.6, aisle: "duka", cup: 130, pack: { label: "2 kg packet", g: 2000 } },
  { id: "wheat-flour", name: "All-purpose wheat flour", sw: "Unga wa ngano", kes: 95, kcal: 364, p: 10.3, c: 76.3, f: 1.0, aisle: "duka", cup: 125, pack: { label: "2 kg packet", g: 2000 } },
  { id: "millet-flour", name: "Finger millet flour", sw: "Unga wa wimbi", kes: 200, kcal: 336, p: 7.3, c: 72.6, f: 1.3, aisle: "duka", cup: 120, pack: { label: "1 kg packet", g: 1000 } },
  { id: "rice", name: "Pishori rice", sw: "Mchele", kes: 220, kcal: 360, p: 6.6, c: 79.3, f: 0.6, aisle: "duka", cup: 190, pack: { label: "1 kg packet", g: 1000 } },
  { id: "bread", name: "White bread", sw: "Mkate", kes: 165, kcal: 265, p: 9.0, c: 49.0, f: 3.2, aisle: "duka", count: { one: "slice", many: "slices", g: 25, of: true }, pack: { label: "400 g loaf", g: 400 } },
  { id: "beans", name: "Dry rosecoco beans", sw: "Maharagwe", kes: 180, kcal: 333, p: 23.6, c: 60.0, f: 0.8, aisle: "duka", cup: 190 },
  { id: "maize-dry", name: "Dry maize kernels", sw: "Mahindi makavu", kes: 65, kcal: 365, p: 9.4, c: 74.3, f: 4.7, aisle: "duka", cup: 180 },
  { id: "ndengu", name: "Green grams", sw: "Ndengu", kes: 200, kcal: 347, p: 23.9, c: 62.6, f: 1.2, aisle: "duka", cup: 200 },
  { id: "mbaazi", name: "Dry pigeon peas", sw: "Mbaazi", kes: 180, kcal: 343, p: 21.7, c: 62.8, f: 1.5, aisle: "duka", cup: 200 },
  { id: "groundnuts", name: "Raw groundnuts", sw: "Njugu karanga", kes: 300, kcal: 567, p: 25.8, c: 16.1, f: 49.2, aisle: "duka", cup: 145 },
  { id: "sugar", name: "Sugar", sw: "Sukari", kes: 170, kcal: 387, p: 0, c: 100, f: 0, aisle: "duka", tsp: 4, cup: 200, pack: { label: "1 kg packet", g: 1000 }, staple: true },
  { id: "oil", name: "Vegetable cooking oil", sw: "Mafuta ya kupika", kes: 350, kcal: 884, p: 0, c: 0, f: 100, aisle: "duka", density: 0.92, pack: { label: "1 L bottle", g: 920 }, staple: true },
  { id: "coconut-milk", name: "Coconut milk", sw: "Tui la nazi", kes: 500, kcal: 197, p: 2.0, c: 2.8, f: 21.3, aisle: "duka", density: 1.0, pack: { label: "400 ml tin", g: 400 } },
  { id: "tomato-paste", name: "Tomato paste", kes: 450, kcal: 82, p: 4.3, c: 18.9, f: 0.5, aisle: "duka", tsp: 5 },
  { id: "stock-cube", name: "Beef stock cube", kes: 1500, kcal: 250, p: 10, c: 30, f: 10, aisle: "duka", count: { one: "cube", many: "cubes", g: 10, of: true } },
  { id: "tea", name: "Tea leaves", sw: "Majani chai", kes: 500, kcal: 0, p: 0, c: 0, f: 0, aisle: "duka", tsp: 2, staple: true },

  // ── Viungo: spices & raising agents ───────────────────────────────────────
  { id: "salt", name: "Salt", sw: "Chumvi", kes: 40, kcal: 0, p: 0, c: 0, f: 0, aisle: "viungo", tsp: 6, staple: true },
  { id: "baking-powder", name: "Baking powder", kes: 1000, kcal: 53, p: 0, c: 28, f: 0, aisle: "viungo", tsp: 4, staple: true },
  { id: "yeast", name: "Instant dry yeast", sw: "Hamira", kes: 3000, kcal: 325, p: 40, c: 41, f: 7.6, aisle: "viungo", tsp: 3, pack: { label: "10 g sachet", g: 10 } },
  { id: "cardamom", name: "Ground cardamom", sw: "Iliki", kes: 4000, kcal: 311, p: 11, c: 68, f: 6.7, aisle: "viungo", tsp: 2, staple: true },
  { id: "pilau-masala", name: "Pilau masala", kes: 1400, kcal: 330, p: 12, c: 50, f: 13, aisle: "viungo", tsp: 2.5, pack: { label: "50 g packet", g: 50 } },
  { id: "cumin", name: "Whole cumin", sw: "Jira", kes: 1500, kcal: 375, p: 18, c: 44, f: 22, aisle: "viungo", tsp: 2, staple: true },
  { id: "curry", name: "Curry powder", sw: "Bizari", kes: 1200, kcal: 325, p: 14, c: 56, f: 14, aisle: "viungo", tsp: 2, staple: true },
  { id: "turmeric", name: "Ground turmeric", sw: "Manjano", kes: 1000, kcal: 312, p: 9.7, c: 67, f: 3.3, aisle: "viungo", tsp: 3, staple: true },
  { id: "black-pepper", name: "Black pepper", sw: "Pilipili manga", kes: 2000, kcal: 251, p: 10, c: 64, f: 3.3, aisle: "viungo", tsp: 2.3, staple: true },
  { id: "chilli-powder", name: "Chilli powder", sw: "Pilipili ya unga", kes: 1200, kcal: 282, p: 13, c: 50, f: 14, aisle: "viungo", tsp: 2.5, staple: true },

  // ── Maziwa: dairy & eggs ──────────────────────────────────────────────────
  { id: "milk", name: "Fresh milk", sw: "Maziwa", kes: 125, kcal: 61, p: 3.2, c: 4.8, f: 3.3, aisle: "maziwa", kind: "dairy", density: 1.03, pack: { label: "500 ml packet", g: 515 } },
  { id: "mala", name: "Fermented milk", sw: "Maziwa lala", kes: 145, kcal: 62, p: 3.3, c: 4.7, f: 3.4, aisle: "maziwa", kind: "dairy", density: 1.03, pack: { label: "500 ml packet", g: 515 } },
  { id: "egg", name: "Eggs", sw: "Mayai", kes: 260, kcal: 143, p: 12.6, c: 0.7, f: 9.5, edible: 0.88, aisle: "maziwa", kind: "egg", count: { one: "egg", many: "eggs", g: 58 } },
  { id: "margarine", name: "Margarine or butter", kes: 800, kcal: 717, p: 0.2, c: 0.7, f: 80, aisle: "maziwa", kind: "dairy", tsp: 5, pack: { label: "250 g tub", g: 250 } },

  // ── Nyama: butchery ───────────────────────────────────────────────────────
  { id: "beef", name: "Beef, stewing cuts", sw: "Nyama ya ng'ombe", kes: 700, kcal: 190, p: 20, c: 0, f: 12, edible: 0.85, aisle: "nyama", kind: "beef" },
  { id: "goat", name: "Goat ribs or leg, on the bone", sw: "Nyama ya mbuzi", kes: 850, kcal: 130, p: 20, c: 0, f: 5.5, edible: 0.7, aisle: "nyama", kind: "goat" },
  { id: "chicken", name: "Chicken, cut in pieces", sw: "Kuku", kes: 550, kcal: 200, p: 18.6, c: 0, f: 14, edible: 0.7, aisle: "nyama", kind: "chicken" },

  // ── Samaki: fish ──────────────────────────────────────────────────────────
  { id: "tilapia", name: "Whole tilapia, cleaned", sw: "Ngege", kes: 650, kcal: 96, p: 20.1, c: 0, f: 1.7, edible: 0.5, aisle: "samaki", kind: "fish", count: { one: "tilapia (about 400 g)", many: "tilapia (about 400 g each)", g: 400 }, fresh: true },
  { id: "fish-fillet", name: "Firm white fish fillets", sw: "Minofu ya samaki", kes: 900, kcal: 105, p: 20.5, c: 0, f: 2.5, aisle: "samaki", kind: "fish", fresh: true },
  { id: "omena", name: "Dried omena", sw: "Dagaa", kes: 450, kcal: 320, p: 60, c: 0, f: 8.5, aisle: "samaki", kind: "fish", cup: 60 },

  // ── Mama mboga: vegetables & fruit ────────────────────────────────────────
  { id: "sukuma", name: "Sukuma wiki (collard greens)", sw: "Sukuma wiki", kes: 80, kcal: 32, p: 3.0, c: 5.4, f: 0.6, edible: 0.8, aisle: "mboga", count: { one: "bunch", many: "bunches", g: 250, of: true }, fresh: true },
  { id: "managu", name: "African nightshade", sw: "Managu", kes: 120, kcal: 38, p: 4.0, c: 5.0, f: 0.8, edible: 0.65, aisle: "mboga", count: { one: "bunch", many: "bunches", g: 250, of: true }, fresh: true },
  { id: "spinach", name: "Pumpkin leaves or spinach", sw: "Seveve / spinachi", kes: 80, kcal: 23, p: 2.9, c: 3.6, f: 0.4, edible: 0.85, aisle: "mboga", count: { one: "bunch", many: "bunches", g: 250, of: true }, fresh: true },
  { id: "cabbage", name: "Cabbage", sw: "Kabichi", kes: 50, kcal: 25, p: 1.3, c: 5.8, f: 0.1, edible: 0.9, aisle: "mboga", count: { one: "medium cabbage", many: "medium cabbages", g: 1200 } },
  { id: "onion", name: "Onions", sw: "Vitunguu", kes: 120, kcal: 40, p: 1.1, c: 9.3, f: 0.1, edible: 0.9, aisle: "mboga", count: { one: "medium onion", many: "medium onions", g: 150 } },
  { id: "spring-onion", name: "Spring onions", sw: "Kitunguu majani", kes: 330, kcal: 32, p: 1.8, c: 7.3, f: 0.2, aisle: "mboga", count: { one: "small bunch", many: "small bunches", g: 60, of: true }, fresh: true },
  { id: "tomato", name: "Tomatoes", sw: "Nyanya", kes: 100, kcal: 18, p: 0.9, c: 3.9, f: 0.2, aisle: "mboga", count: { one: "medium tomato", many: "medium tomatoes", g: 120 } },
  { id: "garlic", name: "Garlic", sw: "Kitunguu saumu", kes: 400, kcal: 149, p: 6.4, c: 33, f: 0.5, edible: 0.85, aisle: "mboga", count: { one: "clove", many: "cloves", g: 5, of: true } },
  { id: "ginger", name: "Fresh ginger", sw: "Tangawizi", kes: 300, kcal: 80, p: 1.8, c: 17.8, f: 0.8, edible: 0.9, aisle: "mboga", count: { one: "thumb-sized piece", many: "thumb-sized pieces", g: 15, of: true }, byWeight: true },
  { id: "dhania", name: "Fresh coriander", sw: "Dhania", kes: 400, kcal: 23, p: 2.1, c: 3.7, f: 0.5, aisle: "mboga", count: { one: "small bunch", many: "small bunches", g: 25, of: true }, fresh: true },
  { id: "chilli", name: "Green chilli", sw: "Pilipili", kes: 400, kcal: 40, p: 1.9, c: 8.8, f: 0.4, aisle: "mboga", count: { one: "chilli", many: "chillies", g: 8 } },
  { id: "green-pepper", name: "Green bell pepper", sw: "Pilipili hoho", kes: 130, kcal: 20, p: 0.9, c: 4.6, f: 0.2, edible: 0.85, aisle: "mboga", count: { one: "bell pepper", many: "bell peppers", g: 150 } },
  { id: "carrot", name: "Carrots", sw: "Karoti", kes: 100, kcal: 41, p: 0.9, c: 9.6, f: 0.2, edible: 0.9, aisle: "mboga", count: { one: "carrot", many: "carrots", g: 100 } },
  { id: "potato", name: "Potatoes", sw: "Viazi", kes: 80, kcal: 77, p: 2.0, c: 17.0, f: 0.1, edible: 0.85, aisle: "mboga", count: { one: "medium potato", many: "medium potatoes", g: 150 } },
  { id: "sweet-potato", name: "Sweet potatoes", sw: "Viazi vitamu / ngwaci", kes: 80, kcal: 86, p: 1.6, c: 20.1, f: 0.1, edible: 0.85, aisle: "mboga", count: { one: "medium sweet potato", many: "medium sweet potatoes", g: 250 } },
  { id: "arrowroot", name: "Arrowroots", sw: "Nduma", kes: 120, kcal: 112, p: 1.5, c: 26.5, f: 0.2, edible: 0.8, aisle: "mboga", count: { one: "medium arrowroot", many: "medium arrowroots", g: 200 } },
  { id: "matoke", name: "Green cooking bananas", sw: "Matoke / ndizi mbichi", kes: 60, kcal: 116, p: 1.2, c: 28, f: 0.3, edible: 0.6, aisle: "mboga", count: { one: "banana", many: "bananas", g: 125 } },
  { id: "peas", name: "Green peas, shelled", sw: "Njegere", kes: 250, kcal: 81, p: 5.4, c: 14.5, f: 0.4, aisle: "mboga", cup: 145 },
  { id: "maize-cob", name: "Fresh maize cobs", sw: "Mahindi mabichi", kes: 120, kcal: 86, p: 3.3, c: 19, f: 1.4, edible: 0.55, aisle: "mboga", count: { one: "cob", many: "cobs", g: 250 } },
  { id: "avocado", name: "Avocados", sw: "Parachichi", kes: 120, kcal: 160, p: 2.0, c: 8.5, f: 14.7, edible: 0.7, aisle: "mboga", count: { one: "avocado", many: "avocados", g: 250 } },
  { id: "lemon", name: "Lemons", sw: "Ndimu", kes: 110, kcal: 29, p: 1.1, c: 9.3, f: 0.3, edible: 0.4, aisle: "mboga", count: { one: "lemon", many: "lemons", g: 90 } },
  { id: "mango", name: "Ripe mangoes", sw: "Maembe", kes: 130, kcal: 60, p: 0.8, c: 15, f: 0.4, edible: 0.7, aisle: "mboga", count: { one: "mango", many: "mangoes", g: 300 } },
  { id: "banana", name: "Ripe bananas", sw: "Ndizi", kes: 85, kcal: 89, p: 1.1, c: 22.8, f: 0.3, edible: 0.65, aisle: "mboga", count: { one: "banana", many: "bananas", g: 120 } },

  // ── Not bought ────────────────────────────────────────────────────────────
  { id: "water", name: "Water", sw: "Maji", kes: 0, kcal: 0, p: 0, c: 0, f: 0, aisle: "none", density: 1 },
];

/** Short names for use inside method steps ("fry the onion in the oil"). */
const SHORT: Record<string, string> = {
  "maize-flour": "maize flour", "wheat-flour": "flour", "millet-flour": "millet flour", rice: "rice", bread: "bread",
  beans: "beans", "maize-dry": "dry maize", ndengu: "ndengu", mbaazi: "mbaazi", groundnuts: "groundnuts", sugar: "sugar",
  oil: "oil", "coconut-milk": "coconut milk", "tomato-paste": "tomato paste", "stock-cube": "stock", tea: "tea leaves",
  salt: "salt", "baking-powder": "baking powder", yeast: "yeast", cardamom: "cardamom", "pilau-masala": "pilau masala",
  cumin: "cumin", curry: "curry powder", turmeric: "turmeric", "black-pepper": "black pepper", "chilli-powder": "chilli powder",
  milk: "milk", mala: "mala", egg: "eggs", margarine: "margarine", beef: "beef", goat: "goat meat", chicken: "chicken",
  tilapia: "tilapia", "fish-fillet": "fish", omena: "omena", sukuma: "sukuma", managu: "managu", spinach: "greens",
  cabbage: "cabbage", onion: "onion", "spring-onion": "spring onions", tomato: "tomatoes", garlic: "garlic", ginger: "ginger",
  dhania: "dhania", chilli: "chilli", "green-pepper": "hoho", carrot: "carrot", potato: "potatoes", "sweet-potato": "sweet potatoes",
  arrowroot: "arrowroots", matoke: "matoke", peas: "peas", "maize-cob": "maize", avocado: "avocado", lemon: "lemon",
  mango: "mango", banana: "banana", water: "water",
};

export function shortName(id: string) {
  return SHORT[id] ?? INGREDIENTS[id]?.name.toLowerCase() ?? id;
}

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(list.map((i) => [i.id, i]));

export function ingredient(id: string): Ingredient {
  const i = INGREDIENTS[id];
  if (!i) throw new Error(`Unknown ingredient: ${id}`);
  return i;
}

export const AISLES: { id: Exclude<import("../types").Aisle, "none">; name: string; sw: string; hint: string }[] = [
  { id: "mboga", name: "Mama mboga", sw: "Fresh produce", hint: "Vegetables, fruit and herbs" },
  { id: "nyama", name: "Butchery", sw: "Bucha", hint: "Ask for it cut the way the recipe says" },
  { id: "samaki", name: "Fishmonger", sw: "Samaki", hint: "Buy the day you cook" },
  { id: "maziwa", name: "Dairy & eggs", sw: "Maziwa na mayai", hint: "" },
  { id: "duka", name: "Duka & supermarket", sw: "Dry goods", hint: "Flour, rice, pulses, tins" },
  { id: "viungo", name: "Spices", sw: "Viungo", hint: "" },
];
