"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MEALS } from "@/lib/data/meals";
import { Mark } from "./logo";

export function MealPhoto({
  id,
  sizes,
  className = "",
  priority = false,
}: {
  id: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const meal = MEALS[id];
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <Image
        src={`/meals/${id}.jpg`}
        alt={meal ? `${meal.name}` : ""}
        fill
        sizes={sizes}
        priority={priority}
        className="photo object-cover"
        style={{ objectPosition: meal?.focus ?? "50% 50%" }}
      />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-8 pt-6 lg:pt-14">
      <div className="min-w-0 animate-rise">
        <div className="eyebrow text-clay">{eyebrow}</div>
        <h1 className="font-display mt-3 text-[40px] leading-[1.02] text-ink sm:text-[52px]">{title}</h1>
        {children && <div className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">{children}</div>}
      </div>
      {action}
    </header>
  );
}

export function MobileTopBar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-4 lg:hidden">
      <Link href="/" aria-label="Meza home" className="inline-flex items-center gap-2">
        <Mark size={28} />
        <span className="font-display text-[24px] leading-none text-forest">meza</span>
      </Link>
      {right}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "md" | "lg";
  label: string;
}) {
  const big = size === "lg";
  const btn = `grid place-items-center rounded-full border border-line-2 bg-card text-ink transition active:scale-95 disabled:opacity-35 ${
    big ? "size-14" : "size-9"
  } hover:border-ink-2`;
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
        <Minus className={big ? "size-5" : "size-4"} strokeWidth={1.8} />
      </button>
      <output className={`tnum text-center font-display ${big ? "w-20 text-[56px] leading-none" : "w-8 text-xl"}`} aria-live="polite">
        {value}
      </output>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
        <Plus className={big ? "size-5" : "size-4"} strokeWidth={1.8} />
      </button>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active ? "border-forest bg-forest text-paper" : "border-line-2 bg-card/70 text-ink-2 hover:border-ink-2"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-4">
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-7 w-12 rounded-full bg-line-2 transition-colors peer-checked:bg-forest peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-card shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Sheets only ever open from a user action, so the DOM is always there.
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88dvh] w-full animate-sheet flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-2xl outline-none sm:max-w-xl sm:animate-rise sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-2 sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-4 sm:pt-6">
          <div>
            {eyebrow && <div className="eyebrow text-clay">{eyebrow}</div>}
            <h2 className="font-display mt-1.5 text-[26px] leading-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-paper-2 ${className}`} />;
}

export function Kcal({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tnum ${className}`}>
      {Math.round(value).toLocaleString("en-KE")}
      <span className="ml-0.5 text-[0.78em] font-normal text-muted"> kcal</span>
    </span>
  );
}
