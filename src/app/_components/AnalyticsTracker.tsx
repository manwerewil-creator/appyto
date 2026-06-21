"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Fire-and-forget page-view beacon. Mounted once at the root so it covers every
// route (including the public /welcome + /login). Sends one event per pathname
// change; the server attaches the visitor cookie + signed-in user. Failures are
// swallowed — telemetry must never affect the user experience.
export default function AnalyticsTracker() {
  const path = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!path || last.current === path) return;
    last.current = path;

    const payload = JSON.stringify({ path, ref: document.referrer || "" });
    try {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    } catch { /* ignore */ }
  }, [path]);

  return null;
}
