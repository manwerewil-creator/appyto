"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, BellRing, Send, XCircle, Mail, Crown, Sparkles, User, LogIn,
  Briefcase, Activity as ActivityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ev { id: string; type: string; summary: string | null; created_at: string; }

// Event type → icon + colour. Falls back to a generic dot for unknown types,
// so new event kinds (e.g. logged by the scraper) render without a code change.
const META: Record<string, { Icon: typeof Send; tint: string }> = {
  application_sent:   { Icon: Send,      tint: "text-emerald-600 bg-emerald-50" },
  application_failed: { Icon: XCircle,   tint: "text-rose-600 bg-rose-50" },
  new_job:            { Icon: Briefcase, tint: "text-blue-600 bg-blue-50" },
  new_matches:        { Icon: Briefcase, tint: "text-blue-600 bg-blue-50" },
  email_connected:    { Icon: Mail,      tint: "text-amber-600 bg-amber-50" },
  plan_upgraded:      { Icon: Crown,     tint: "text-violet-600 bg-violet-50" },
  onboarded:          { Icon: Sparkles,  tint: "text-blue-600 bg-blue-50" },
  profile_updated:    { Icon: User,      tint: "text-slate-600 bg-slate-100" },
  signed_in:          { Icon: LogIn,     tint: "text-slate-600 bg-slate-100" },
};

const SEEN_KEY = "featers:notifsSeenAt";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Top-bar notification centre. Polls the user's activity feed, shows an unread
 * count, lists recent events, asks permission for native browser notifications,
 * and fires them when genuinely new events arrive (new jobs, failed/sent
 * applications, plan changes, …).
 */
export default function NotificationBell() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  // Newest event timestamp we've already fired a native notification for —
  // initialised to "now" so we never blast a backlog on first load.
  const notifiedAfter = useRef(0);

  useEffect(() => {
    const s = Number(localStorage.getItem(SEEN_KEY) ?? 0);
    setSeenAt(s);
    notifiedAfter.current = Date.now();
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/activity");
      const d = await r.json();
      const evs: Ev[] = d.events ?? [];
      setEvents(evs);

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const fresh = evs
          .filter((e) => new Date(e.created_at).getTime() > notifiedAfter.current)
          .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        for (const e of fresh.slice(-5)) {
          new Notification("Featers", { body: e.summary ?? e.type, icon: "/icon.svg", tag: e.id });
        }
        if (evs.length) {
          notifiedAfter.current = Math.max(
            notifiedAfter.current,
            ...evs.map((e) => new Date(e.created_at).getTime()),
          );
        }
      }
    } catch { /* offline / unauth — ignore */ }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [refresh]);

  const unread = events.filter((e) => new Date(e.created_at).getTime() > seenAt).length;

  const toggle = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        const now = Date.now();
        setSeenAt(now);
        localStorage.setItem(SEEN_KEY, String(now));
      }
      return !wasOpen;
    });
  };

  const enableNotifs = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      notifiedAfter.current = Date.now();
      new Notification("Featers", {
        body: "Notifications are on — we'll alert you about new jobs and application updates.",
        icon: "/icon.svg",
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications (${unread} new)` : "Notifications"}
        className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] origin-top-right animate-fade-in overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-semibold">Notifications</p>
              <Link href="/applications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>

            {perm !== "granted" && typeof Notification !== "undefined" && (
              <button
                type="button"
                onClick={enableNotifs}
                className="flex w-full items-center gap-2.5 border-b bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
              >
                <BellRing className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="text-sm font-medium">Turn on notifications</span>
                  <span className="block text-xs text-muted-foreground">Get alerts for new jobs &amp; application updates.</span>
                </span>
              </button>
            )}

            <div className="max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                events.map((e) => {
                  const m = META[e.type] ?? { Icon: ActivityIcon, tint: "text-slate-600 bg-slate-100" };
                  const Icon = m.Icon;
                  const isNew = new Date(e.created_at).getTime() > seenAt;
                  return (
                    <div key={e.id} className={cn("flex items-start gap-3 border-b px-4 py-3 last:border-0", isNew && "bg-primary/[0.04]")}>
                      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", m.tint)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{e.summary ?? e.type}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(e.created_at)}</p>
                      </div>
                      {isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
