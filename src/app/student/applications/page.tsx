"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/vb/use-profile";
import { Card, Badge, PageLoader, Spinner, Empty } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Application } from "@/lib/vb/types";

type AppWithDetails = Application & { opportunity_title: string | null; company_name: string | null };

export default function ApplicationsPage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "student" });
  const [apps, setApps] = useState<AppWithDetails[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("vb_applications")
        .select("*")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });
      const rows = (data || []) as Application[];

      if (rows.length) {
        const oppIds = Array.from(new Set(rows.map((a) => a.opportunity_id)));
        const { data: opps } = await supabase
          .from("vb_opportunities")
          .select("id,title,company_id")
          .in("id", oppIds);
        const oppMap: Record<string, { title: string; company_id: string }> = {};
        (opps || []).forEach((o: any) => { oppMap[o.id] = { title: o.title, company_id: o.company_id }; });

        const companyIds = Array.from(new Set(Object.values(oppMap).map((o) => o.company_id)));
        const { data: profs } = await supabase
          .from("vb_profiles")
          .select("id,company_name")
          .in("id", companyIds);
        const nameMap: Record<string, string | null> = {};
        (profs || []).forEach((p: any) => { nameMap[p.id] = p.company_name; });

        setApps(rows.map((a) => ({
          ...a,
          opportunity_title: oppMap[a.opportunity_id]?.title ?? null,
          company_name: oppMap[a.opportunity_id] ? nameMap[oppMap[a.opportunity_id].company_id] ?? null : null,
        })));
      } else {
        setApps([]);
      }
      setFetching(false);
    })();
  }, [profile]);

  if (loading || !profile) return <PageLoader />;
  if (fetching) return <div className="grid place-items-center py-20"><Spinner /></div>;

  if (apps.length === 0) {
    return (
      <Empty
        title="No applications yet"
        sub="Browse opportunities and submit your first application."
        icon="file"
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="divide-y divide-line">
        {apps.map((app) => (
          <div key={app.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0 space-y-0.5">
              <Link
                href={`/student/opportunity/${app.opportunity_id}`}
                className="block truncate font-semibold text-ink hover:text-brand transition-colors"
              >
                {app.opportunity_title || "Opportunity"}
              </Link>
              <p className="text-sm text-dim">{app.company_name || "—"}</p>
              <span className="inline-flex items-center gap-1 text-xs text-faint">
                <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" />
                {new Date(app.created_at).toLocaleDateString()}
              </span>
            </div>
            <Badge tone={app.status}>{app.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
