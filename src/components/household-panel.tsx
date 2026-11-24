"use client";

import { Check, Copy, MessageCircle, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { createHousehold, joinHousehold, leaveHousehold, normalizeCode, pull } from "@/lib/sync";

function ago(t?: number) {
  if (!t) return "not yet";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : "a while ago";
}

export function joinUrl(code: string) {
  return `${window.location.origin}/join/${code}`;
}

export function HouseholdPanel() {
  const app = useApp();
  const link = app?.household;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!app) return null;

  if (link) {
    const message = `Join our Meza household so we share one meal plan and market list: ${joinUrl(link.code)} (code ${link.code})`;
    return (
      <div>
        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="kikoi h-1.5" />
          <div className="p-6">
            <div className="eyebrow text-muted">Household code</div>
            <div className="font-display mt-2 break-all text-[34px] leading-none tracking-wide text-forest sm:text-[40px]">{link.code}</div>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Everyone who joins with this code shares the plan, the market list ticks and the table settings. Saved recipes stay personal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-paper hover:bg-forest-2"
              >
                <MessageCircle className="size-4" strokeWidth={1.8} /> Invite on WhatsApp
              </a>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(joinUrl(link.code)).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2.5 text-sm font-medium hover:border-ink-2"
              >
                {copied ? <Check className="size-4 text-forest" /> : <Copy className="size-4" strokeWidth={1.8} />}
                {copied ? "Link copied" : "Copy invite link"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5 text-sm">
            {link.status === "gone" ? (
              <span className="text-clay">This household no longer exists. Leave it to keep planning on this phone.</span>
            ) : (
              <span className="flex items-center gap-2 text-muted">
                <span className={`size-2 rounded-full ${link.status === "offline" ? "bg-clay" : "bg-forest"}`} />
                {link.status === "offline" ? "Offline. Changes will send when you're back online." : `Synced ${ago(link.syncedAt)}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              {link.status !== "gone" && (
                <button type="button" onClick={() => run(() => pull(true))} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">
                  <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} /> Sync now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm("Leave this household? This phone keeps a copy of the plan as it is now.")) leaveHousehold();
                }}
                className="rounded-full px-3 py-1.5 text-clay hover:bg-clay-soft"
              >
                Leave
              </button>
            </span>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-clay">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-line bg-card p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
            <Users className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <div className="text-[15px] font-medium">Plan together</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Get a code to share this plan with the people you cook with. When anyone swaps a meal or ticks something at the market, everyone sees it.
            </p>
            <button
              type="button"
              disabled={busy || !app.profile}
              onClick={() => run(createHousehold)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-paper hover:bg-forest-2 disabled:opacity-60"
            >
              {busy ? "Creating…" : "Create a household code"}
            </button>
          </div>
        </div>
      </div>

      <form
        className="rounded-[24px] border border-dashed border-line-2 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim()) return;
          if (app.profile && !confirm("Joining replaces the plan on this phone with the household's. Continue?")) return;
          void run(() => joinHousehold(code));
        }}
      >
        <label htmlFor="join-code" className="text-[15px] font-medium">
          Have a code?
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => code && setCode(normalizeCode(code))}
            placeholder="PILAU-7KQ4M2"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border border-line-2 bg-card px-5 py-2.5 font-medium uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-forest"
          />
          <button type="submit" disabled={busy} className="rounded-full border border-forest px-5 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-paper disabled:opacity-60">
            Join
          </button>
        </div>
      </form>
      {error && <p className="text-sm text-clay">{error}</p>}
    </div>
  );
}
