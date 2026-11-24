"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync";

/** Mounted once in the root layout; keeps a joined household in sync. */
export function SyncAgent() {
  useEffect(() => startSync(), []);
  return null;
}
