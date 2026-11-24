"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { kcal } from "@/lib/format";
import { useApp } from "@/lib/store";
import { joinHousehold, normalizeCode, peekHousehold } from "@/lib/sync";
import type { Profile } from "@/lib/types";
import { Logo } from "./logo";

type Peek = { state: "loading" } | { state: "missing" } | { state: "error" } | { state: "found"; profile: Profile | null; days: number };

export function JoinView({ code: raw }: { code: string }) {
  const code = normalizeCode(decodeURIComponent(raw));
  const app = useApp();
  const router = useRouter();
  const [peek, setPeek] = useState<Peek>({ state: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    peekHousehold(code)
      .then((d) => {
        if (!live) return;
        if (!d) setPeek({ state: "missing" });
        else setPeek({ state: "found", profile: (d.fields.profile as Profile) ?? null, days: Object.keys(d.fields).filter((f) => f.startsWith("d:")).length });
      })
      .catch(() => live && setPeek({ state: "error" }));
    return () => {
      live = false;
    };
  }, [code]);

  const already = app?.household?.code === code;
  const elsewhere = app?.household && !already;

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinHousehold(code);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-32 pt-10">
      <Link href="/" className="lg:hidden">
        <Logo />
      </Link>
      <div className="mt-14 animate-rise">
        <div className="eyebrow text-clay">Karibu mezani</div>
        <h1 className="font-display mt-3 text-[40px] leading-[1.04]">You&rsquo;re invited to share a table</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          Join this household to share one meal plan and one market list. When anyone swaps a meal or ticks something off at the market, everyone sees it.
        </p>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="kikoi h-1.5" />
          <div className="p-6">
            <div className="eyebrow text-muted">Household code</div>
            <div className="font-display mt-2 break-all text-[32px] leading-none tracking-wide text-forest">{code}</div>
            <div className="mt-4 text-sm text-ink-2">
              {peek.state === "loading" && "Checking the code…"}
              {peek.state === "missing" && <span className="text-clay">There&rsquo;s no household with this code. It may have been mistyped, or it hasn&rsquo;t been used for a long time.</span>}
              {peek.state === "error" && <span className="text-clay">Couldn&rsquo;t reach Meza just now. Check your connection and reload.</span>}
              {peek.state === "found" && peek.profile && (
                <span className="tnum">
                  A table of {peek.profile.people} · {kcal(peek.profile.target)} kcal each a day · {peek.days} days planned
                </span>
              )}
            </div>
          </div>
        </div>

        {already ? (
          <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-[15px] font-medium text-paper hover:bg-forest-2">
            You&rsquo;re already in this household <ArrowRight className="size-4" />
          </Link>
        ) : (
          peek.state === "found" && (
            <>
              {(app?.profile || elsewhere) && (
                <p className="mt-6 rounded-2xl bg-maize-soft px-4 py-3 text-sm text-[#5c3f0b]">
                  {elsewhere
                    ? `This phone is in household ${app!.household!.code}. Joining switches it to this one.`
                    : "Joining replaces the plan on this phone with the household's."}
                </p>
              )}
              <button
                type="button"
                onClick={join}
                disabled={busy}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-[15px] font-medium text-paper hover:bg-forest-2 disabled:opacity-60"
              >
                {busy ? "Joining…" : "Join this household"} <ArrowRight className="size-4" />
              </button>
            </>
          )
        )}
        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      </div>
    </main>
  );
}
