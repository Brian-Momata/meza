import type { Metadata } from "next";
import Link from "next/link";
import { MobileTopBar, PageHeader } from "@/components/ui";
import credits from "@/credits.json";
import { MEALS } from "@/lib/data/meals";

export const metadata: Metadata = { title: "Photo credits" };

type Credit = { title: string; author: string; license: string; licenseUrl: string | null; source: string };

export default function Page() {
  const entries = Object.entries(credits as Record<string, Credit>);
  return (
    <main className="mx-auto max-w-4xl px-5 pb-32 sm:px-8 lg:px-12">
      <MobileTopBar />
      <PageHeader eyebrow="Asante" title="Photo credits">
        Every photo in Meza is real Kenyan food, shared by its photographer on Wikimedia Commons under an open licence. Thank you.
      </PageHeader>
      <ul className="divide-y divide-line border-y border-line">
        {entries.map(([id, c]) => (
          <li key={id} className="grid gap-1 py-4 sm:grid-cols-[1fr_1.2fr] sm:gap-6">
            <div className="text-[15px] font-medium">
              {MEALS[id] ? (
                <Link href={`/recipes/${id}`} className="hover:text-forest">
                  {MEALS[id].name}
                </Link>
              ) : (
                "Welcome screen"
              )}
            </div>
            <div className="text-sm text-ink-2">
              <a href={c.source} target="_blank" rel="noreferrer" className="underline decoration-line-2 underline-offset-2 hover:text-ink">
                {c.title}
              </a>{" "}
              by {c.author} ·{" "}
              {c.licenseUrl ? (
                <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-line-2 underline-offset-2 hover:text-ink">
                  {c.license}
                </a>
              ) : (
                c.license
              )}
              <span className="text-muted"> · resized</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
