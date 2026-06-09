"use client";

import { useEffect, useState } from "react";
import {
  Send, XCircle, Mail, Crown, Sparkles, User, LogIn, Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Ev { id: string; type: string; summary: string | null; created_at: string; }

const META: Record<string, { Icon: typeof Send; tint: string }> = {
  application_sent:   { Icon: Send,     tint: "text-emerald-600 bg-emerald-50" },
  application_failed: { Icon: XCircle,  tint: "text-rose-600 bg-rose-50" },
  email_connected:    { Icon: Mail,     tint: "text-amber-600 bg-amber-50" },
  plan_upgraded:      { Icon: Crown,    tint: "text-violet-600 bg-violet-50" },
  onboarded:          { Icon: Sparkles, tint: "text-blue-600 bg-blue-50" },
  profile_updated:    { Icon: User,     tint: "text-slate-600 bg-slate-100" },
  signed_in:          { Icon: LogIn,    tint: "text-slate-600 bg-slate-100" },
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  useEffect(() => {
    fetch("/api/activity").then((r) => r.json()).then((d) => setEvents(d.events ?? [])).catch(() => setEvents([]));
  }, []);

  if (events === null) return <Skeleton className="h-40 w-full" />;
  if (events.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recent activity</h3>
        </div>
        <div className="divide-y">
          {events.map((e) => {
            const m = META[e.type] ?? { Icon: ActivityIcon, tint: "text-slate-600 bg-slate-100" };
            const Icon = m.Icon;
            return (
              <div key={e.id} className="flex items-center gap-3 py-2.5">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{e.summary ?? e.type}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.created_at)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
