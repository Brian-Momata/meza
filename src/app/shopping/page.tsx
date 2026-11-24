import type { Metadata } from "next";
import { ShoppingView } from "@/components/shopping-view";

export const metadata: Metadata = { title: "Market list" };

export default function Page() {
  return <ShoppingView />;
}
