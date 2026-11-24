import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeView } from "@/components/recipe-view";
import { MEAL_LIST, MEALS } from "@/lib/data/meals";
import credits from "@/credits.json";

export function generateStaticParams() {
  return MEAL_LIST.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const meal = MEALS[id];
  if (!meal) return {};
  return { title: meal.name, description: meal.blurb };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meal = MEALS[id];
  if (!meal) notFound();
  const credit = (credits as Record<string, { author: string; license: string; source: string }>)[id];
  return <RecipeView id={id} credit={credit} />;
}
