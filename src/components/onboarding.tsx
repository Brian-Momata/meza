"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveProfile, useApp } from "@/lib/store";
import { joinHousehold } from "@/lib/sync";
import type { Profile } from "@/lib/types";
import { Logo } from "./logo";
import { DEFAULT_PROFILE, DietField, HabitsField, MealsField, PeopleField, TargetField } from "./profile-fields";

const STEPS = [
  {
    eyebrow: "Your table",
    title: "How many people are eating?",
    body: "Count everyone you cook for on a normal day.",
  },
  {
    eyebrow: "Your goal",
    title: "How much energy does each person need?",
    body: "We pick meals that land close to this every day, and size every portion to match.",
  },
  {
    eyebrow: "Your day",
    title: "How many meals do you eat a day?",
    body: "Skip breakfast, skip lunch, or eat once a day. We'll still hit your goal.",
  },
  {
    eyebrow: "Your kitchen",
    title: "How does your household eat?",
    body: "You can change all of this later.",
  },
] as const;

export function Onboarding() {
  const app = useApp();
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Returning visitors skip straight to today.
  useEffect(() => {
    if (app?.profile && !busy) router.replace("/");
  }, [app?.profile, busy, router]);

  const set = (p: Partial<Profile>) => setProfile((cur) => ({ ...cur, ...p }));

  const finish = () => {
    setBusy(true);
    const clean = {
      ...profile,
      avoid:
        profile.diet === "vegetarian" ? [] : profile.diet === "pescatarian" ? profile.avoid.filter((a) => a === "fish") : profile.avoid,
    };
    saveProfile(clean);
    router.replace("/");
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Photo panel */}
      <div className="relative h-[42dvh] min-h-[320px] overflow-hidden bg-forest lg:sticky lg:top-0 lg:h-dvh">
        <Image src="/meals/hero-spread.jpg" alt="An East African table: ugali of white, millet and sorghum flour, fish stew and beans" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="photo object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/80" />
        <div className="absolute inset-x-0 top-0 p-6 sm:p-10">
          <Logo tone="light" size={34} />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 pb-8 sm:p-10">
          <p className="font-display max-w-md text-[34px] leading-[1.02] text-paper sm:text-[52px]">Kenyan meals, planned.</p>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-paper/80">
            From ugali to pilau. Every portion counted, every market trip sorted.
          </p>
        </div>
        <div className="kikoi absolute inset-x-0 bottom-0 h-1.5" />
      </div>

      {/* Form */}
      <div className="flex min-h-[58dvh] flex-col px-6 pb-10 pt-8 sm:px-12 lg:min-h-dvh lg:justify-center lg:px-16 xl:px-24">
        {step === -1 ? (
          <div key="intro" className="max-w-lg animate-rise">
            <div className="eyebrow text-clay">Karibu</div>
            <h1 className="font-display mt-3 text-[40px] leading-[1.02] sm:text-[54px]">Leo tunakula nini?</h1>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              The question every Kenyan kitchen asks, every single day. Meza answers it for the whole week, so you can stop deciding and start cooking.
            </p>
            <ol className="mt-8 space-y-5">
              {[
                ["A week of real Kenyan food", "Githeri on Tuesday, tilapia on Thursday, pilau on Saturday. Balanced, varied, and never the same thing twice in a row."],
                ["Portions that match your calories", "Every recipe is weighed, so each plate tells you exactly how much ugali, stew and sukuma makes your number."],
                ["One market list", "Scaled to your household, grouped by mama mboga, butchery and duka, and ready to send on WhatsApp."],
              ].map(([h, b], i) => (
                <li key={h} className="flex gap-4">
                  <span className="font-display tnum mt-0.5 text-lg text-clay">0{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-semibold">{h}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-[15px] font-medium text-paper transition hover:bg-forest-2"
              >
                Set up my table <ArrowRight className="size-4" />
              </button>
              <button type="button" onClick={() => setJoining((j) => !j)} className="text-[15px] font-medium text-forest underline-offset-4 hover:underline">
                I have a household code
              </button>
            </div>
            {joining && (
              <form
                className="mt-5 flex max-w-md animate-rise flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setJoinError(null);
                  try {
                    await joinHousehold(joinCode);
                    router.replace("/");
                  } catch (err) {
                    setJoinError(err instanceof Error ? err.message : "Could not join");
                    setBusy(false);
                  }
                }}
              >
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="PILAU-7KQ4M2"
                  aria-label="Household code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-full border border-line-2 bg-card px-5 py-3 font-medium uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-forest"
                />
                <button type="submit" disabled={busy || !joinCode.trim()} className="rounded-full border border-forest px-5 py-3 text-sm font-medium text-forest hover:bg-forest hover:text-paper disabled:opacity-50">
                  {busy ? "Joining…" : "Join"}
                </button>
                {joinError && <p className="w-full text-sm text-clay">{joinError}</p>}
              </form>
            )}
          </div>
        ) : (
          <div key={step} className="w-full max-w-xl animate-rise">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1 rounded-full transition-all ${i <= step ? "w-8 bg-forest" : "w-4 bg-line-2"}`} />
                ))}
              </div>
              <span className="tnum text-xs text-muted">
                {step + 1} of {STEPS.length}
              </span>
            </div>
            <div className="eyebrow mt-8 text-clay">{STEPS[step].eyebrow}</div>
            <h1 className="font-display mt-3 text-[34px] leading-[1.06] sm:text-[44px]">{STEPS[step].title}</h1>
            <p className="mt-3 text-[15px] text-ink-2">{STEPS[step].body}</p>

            <div className="mt-8">
              {step === 0 && <PeopleField profile={profile} set={set} />}
              {step === 1 && <TargetField profile={profile} set={set} />}
              {step === 2 && <MealsField profile={profile} set={set} />}
              {step === 3 && (
                <div className="space-y-8">
                  <DietField profile={profile} set={set} />
                  <HabitsField profile={profile} set={set} />
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-2 rounded-full px-2 py-3 text-[15px] font-medium text-ink-2 hover:text-ink"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-[15px] font-medium text-paper transition hover:bg-forest-2"
                >
                  Continue <ArrowRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3.5 text-[15px] font-medium text-paper transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Planning your week…" : "Plan my week"} <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
