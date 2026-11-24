"use client";

import { CalendarDays, CookingPot, Settings2, ShoppingBasket, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { kcal } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Today", sw: "Leo", icon: Sun },
  { href: "/plan", label: "Week", sw: "Wiki", icon: CalendarDays },
  { href: "/shopping", label: "Market", sw: "Soko", icon: ShoppingBasket },
  { href: "/recipes", label: "Recipes", sw: "Mapishi", icon: CookingPot },
] as const;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const app = useApp();
  const bare = path.startsWith("/welcome");

  if (bare) return <>{children}</>;

  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-6 py-8 lg:flex">
        <Link href="/" aria-label="Meza home" className="mb-12 px-2">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, sw, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                  active ? "bg-card text-forest shadow-[0_1px_0_var(--color-line),0_8px_24px_-16px_rgba(29,69,50,.35)]" : "text-ink-2 hover:bg-paper-2"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.1 : 1.7} />
                <span className="flex-1 text-[15px] font-medium">{label}</span>
                <span className={`text-xs ${active ? "text-clay" : "text-muted/70"}`}>{sw}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          {app?.profile && (
            <Link
              href="/settings"
              className="block rounded-2xl border border-line bg-card/60 p-4 transition-colors hover:bg-card"
            >
              <div className="eyebrow text-muted">Your table</div>
              <div className="mt-2 font-display text-[22px] leading-tight text-ink">
                {app.profile.people} {app.profile.people === 1 ? "person" : "people"}
              </div>
              <div className="tnum mt-0.5 text-sm text-muted">{kcal(app.profile.target)} kcal each a day</div>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-forest">
                <Settings2 className="size-4" strokeWidth={1.8} /> Adjust
              </div>
            </Link>
          )}
          <Link href="/credits" className="mt-4 block px-2 text-xs text-muted hover:text-ink-2">
            Photo credits
          </Link>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/85 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 pb-2 pt-2.5">
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                    active ? "bg-forest text-paper" : "text-ink-2"
                  }`}
                >
                  <Icon className="size-[19px]" strokeWidth={active ? 2 : 1.7} />
                </span>
                <span className={`text-[11px] font-medium ${active ? "text-forest" : "text-muted"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
