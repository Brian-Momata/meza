# Meza: Kenyan meals, planned

*Leo tunakula nini?* Meza answers it for the whole week. It plans real Kenyan meals around a daily calorie goal, sizes every portion to match, scales recipes to the number of people eating and builds one market list.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Everything is stored in the browser (`localStorage`, key `meza:v1`). There is no backend or account.

## What's inside

| Screen | Route | What it does |
| --- | --- | --- |
| Welcome | `/welcome` | Three questions: people, daily kcal, diet and habits. Then it plans the week. |
| Today (*Leo*) | `/` | The next meal, the day's table, energy vs. goal, "tonight, for tomorrow" prep, and what's left to buy |
| Week (*Wiki*) | `/plan` | Seven days. Swap or lock any meal, shuffle the rest, look up to three weeks ahead. |
| Market (*Soko*) | `/shopping` | Combined list for any days you pick, grouped by mama mboga / butchery / fishmonger / dairy / duka / spices, rounded up to what you can buy. Tick items off, copy the list or send it on WhatsApp. |
| Recipes (*Mapishi*) | `/recipes`, `/recipes/[id]` | Search by dish or ingredient, with filters. Each recipe shows one person's plate (grams + kcal per part), ingredients scaled to any number of people, and a method whose amounts scale too. |
| Your table | `/settings` | Change people, goal or diet. Changes re-plan from today onward and keep locked or eaten meals. |

## How the numbers work

- `src/lib/data/ingredients.ts`: 60 ingredients with kcal, protein, carbs and fat per 100 g. Values come from the Kenya Food Composition Tables (2018) or USDA, rounded. Each has an edible fraction for bone, peel and stalks, plus household units (bunch, medium tomato, cup, tsp) and how it's sold (2 kg packet, 400 ml tin).
- `src/lib/data/recipes.ts`: 35 component recipes (ugali, sukuma, beef stew, chapati…). Weights are as bought, with a cooked portion weight and a visual guide ("a wedge the size of your palm"). Frying oil records what you buy separately from what is absorbed.
- `src/lib/data/meals.ts`: 30 meals built from components, e.g. *Ugali, Sukuma & Beef Stew* = 1 ugali + 1 sukuma + 1 stew. `qty` lets a meal use a smaller portion (¾ ugali next to a heavy chicken stew).
- `src/lib/nutrition.ts` calculates every calorie from those weights, so the plate, the recipe and the plan always agree.
- `src/lib/planner.ts` scores every breakfast × lunch × supper (× snack) combination for each day. It looks for the total closest to the goal and penalises repeats from recent days, and the same staple or protein at lunch and supper. The plan for a 2,000 kcal goal usually lands within ±5%.

## Photos

All meal photos are real Kenyan food from Wikimedia Commons, under CC0 / CC BY / CC BY-SA licences, resized. The author, licence and source of each are in `src/credits.json` and shown on each recipe and at `/credits`.

## Adding a meal

1. Add any new ingredients to `ingredients.ts`.
2. Add component recipes to `recipes.ts`. Steps can use `{ingredient-id}`, `{n}` and `{portion}` placeholders, which are replaced with scaled amounts.
3. Add the meal to `meals.ts`, and put a photo at `public/meals/<meal-id>.jpg` with its credit in `src/credits.json`.
