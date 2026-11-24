import type { Metadata } from "next";
import { JoinView } from "@/components/join-view";

export const metadata: Metadata = {
  title: "Join a household",
  description: "You've been invited to share a Meza meal plan and market list.",
};

export function generateStaticParams() {
  // One placeholder keeps Cache Components happy; real codes render at request time.
  return [{ code: "MEZA-222222" }];
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinView code={code} />;
}
