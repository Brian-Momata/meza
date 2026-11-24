import type { Metadata } from "next";
import { SettingsView } from "@/components/settings-view";

export const metadata: Metadata = { title: "Your table" };

export default function Page() {
  return <SettingsView />;
}
