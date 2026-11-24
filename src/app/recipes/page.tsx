import type { Metadata } from "next";
import { RecipeBrowser } from "@/components/recipe-browser";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Thirty everyday Kenyan meals, from ugali and sukuma to coastal pilau, with weighed portions and calories.",
};

export default function Page() {
  return <RecipeBrowser />;
}
