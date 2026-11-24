"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { today, weekStart } from "./dates";
import { ensureWeek, useApp } from "./store";

/**
 * For screens that need a household and a plan: sends first-time visitors to
 * onboarding and makes sure the current week is planned.
 */
export function usePlan(week?: string) {
  const app = useApp();
  const router = useRouter();
  const hydrated = app !== null;
  const hasProfile = !!app?.profile;
  const target = week ?? (hydrated ? weekStart(today()) : "");

  useEffect(() => {
    if (!hydrated) return;
    if (!hasProfile) router.replace("/welcome");
    else if (target) ensureWeek(target);
  }, [hydrated, hasProfile, target, router]);

  return app && app.profile ? { app, profile: app.profile } : null;
}
