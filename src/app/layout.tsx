import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Young_Serif } from "next/font/google";
import { AppShell } from "@/components/shell";
import "./globals.css";

const display = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-young-serif" });
const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });

export const metadata: Metadata = {
  title: { default: "Meza · Kenyan meals, planned", template: "%s · Meza" },
  description:
    "A weekly meal plan of real Kenyan food, with portions matched to your calorie goal, a market list scaled to your household and step-by-step recipes.",
  applicationName: "Meza",
  appleWebApp: { capable: true, title: "Meza", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f5efe4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
