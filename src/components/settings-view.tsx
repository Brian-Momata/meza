"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetEverything, saveProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { usePlan } from "@/lib/use-plan";
import { DietField, HabitsField, PeopleField, TargetField } from "./profile-fields";
import { MobileTopBar, PageHeader, Skeleton } from "./ui";

export function SettingsView() {
  const plan = usePlan();
  const router = useRouter();
  const [edits, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const draft = edits ?? plan?.profile ?? null;

  if (!plan || !draft) {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-24 sm:px-8 lg:px-12">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="mt-8 h-64" />
      </main>
    );
  }

  const set = (p: Partial<Profile>) => {
    setSaved(false);
    setDraft({ ...draft, ...p });
  };
  const before = plan.profile;
  const changed = JSON.stringify(before) !== JSON.stringify(draft);
  const needsReplan =
    before.target !== draft.target ||
    before.diet !== draft.diet ||
    before.snacks !== draft.snacks ||
    before.quickWeekdays !== draft.quickWeekdays ||
    before.avoid.join() !== draft.avoid.join();

  const save = () => {
    const clean = {
      ...draft,
      avoid: draft.diet === "vegetarian" ? [] : draft.diet === "pescatarian" ? draft.avoid.filter((a) => a === "fish") : draft.avoid,
    };
    saveProfile(clean, { replan: needsReplan });
    setDraft(clean);
    setSaved(true);
  };

  return (
    <main className="mx-auto max-w-4xl px-5 pb-40 sm:px-8 lg:px-12">
      <MobileTopBar />
      <PageHeader eyebrow="Mipangilio" title="Your table">
        Changes to goals and diet re-plan from today onward. Meals you&rsquo;ve locked or eaten stay put.
      </PageHeader>

      <Section n="01" title="People" hint="Recipes and the market list scale to this.">
        <PeopleField profile={draft} set={set} />
      </Section>
      <Section n="02" title="Daily energy" hint="Per person, per day.">
        <TargetField profile={draft} set={set} />
      </Section>
      <Section n="03" title="How you eat">
        <div className="space-y-8">
          <DietField profile={draft} set={set} />
          <HabitsField profile={draft} set={set} />
        </div>
      </Section>
      <Section n="04" title="Start over" hint="Clears your plan, ticks and favourites on this device.">
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear everything and start again?")) {
              resetEverything();
              router.replace("/welcome");
            }
          }}
          className="rounded-full border border-clay/40 px-5 py-2.5 text-sm font-medium text-clay hover:bg-clay-soft"
        >
          Reset Meza
        </button>
        <p className="mt-6 text-sm text-muted">
          Photos come from Wikimedia Commons contributors.{" "}
          <Link href="/credits" className="text-forest underline underline-offset-2">
            See credits
          </Link>
          .
        </p>
      </Section>

      {/* Save bar */}
      <div
        className={`fixed inset-x-0 bottom-[68px] z-30 px-4 transition-all duration-300 lg:bottom-6 lg:left-[248px] ${
          changed || saved ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full border border-line bg-card/95 py-2 pl-5 pr-2 shadow-[0_20px_50px_-20px_rgba(30,20,0,.4)] backdrop-blur">
          <span className="text-sm text-ink-2">
            {saved && !changed ? (
              <span className="inline-flex items-center gap-1.5 text-forest">
                <Check className="size-4" /> Saved{needsReplan ? "" : ""}
              </span>
            ) : needsReplan ? (
              "Saving will refresh the rest of this week."
            ) : (
              "Unsaved changes"
            )}
          </span>
          {changed ? (
            <button type="button" onClick={save} className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-2">
              Save
            </button>
          ) : (
            <Link href="/" className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-2">
              See today
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function Section({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-10 md:grid-cols-[220px_1fr]">
      <div>
        <div className="font-display tnum text-clay">{n}</div>
        <h2 className="font-display mt-1 text-2xl">{title}</h2>
        {hint && <p className="mt-2 text-sm leading-relaxed text-muted">{hint}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
