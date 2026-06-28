"use client";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/vb/use-profile";
import { Card, Badge, Button, Stat, Empty, PageLoader, Spinner, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Opportunity } from "@/lib/vb/types";

type AppCounts = { total: number; shortlisted: number; interview: number; accepted: number };
type OppWithCompany = Opportunity & { company_name: string | null };

export default function StudentDashboard() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "student" });
  const [counts, setCounts] = useState<AppCounts>({ total: 0, shortlisted: 0, interview: 0, accepted: 0 });
  const [latest, setLatest] = useState<OppWithCompany[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: apps } = await supabase
        .from("vb_applications")
        .select("status")
        .eq("student_id", profile.id);
      const rows = apps || [];
      setCounts({
        total: rows.length,
        shortlisted: rows.filter((a) => a.status === "shortlisted").length,
        interview: rows.filter((a) => a.status === "interview").length,
        accepted: rows.filter((a) => a.status === "accepted").length,
      });

      const { data: opps } = await supabase
        .from("vb_opportunities")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(3);
      const rows2 = (opps || []) as Opportunity[];
      if (rows2.length) {
        const companyIds = Array.from(new Set(rows2.map((o) => o.company_id)));
        const { data: profs } = await supabase
          .from("vb_profiles")
          .select("id,company_name")
          .in("id", companyIds);
        const nameMap: Record<string, string | null> = {};
        (profs || []).forEach((p: any) => { nameMap[p.id] = p.company_name; });
        setLatest(rows2.map((o) => ({ ...o, company_name: nameMap[o.company_id] ?? null })));
      }
      setFetching(false);
    })();
  }, [profile]);

  if (loading || !profile) return <PageLoader />;

  return (
    <div className="space-y-8">
      {!profile.cv_url && (
        <Card className="flex flex-col gap-4 border-brand/20 bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
              <Icon name="upload" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-brand">Complete your profile</p>
              <p className="mt-0.5 text-sm text-brand/70">Upload your CV to start applying for internships.</p>
            </div>
          </div>
          <Button href="/student/profile" variant="primary" arrow className="shrink-0">
            Go to Profile
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon="file" value={counts.total} label="Total applications" accent="brand" />
        <Stat icon="star" value={counts.shortlisted} label="Shortlisted" accent="violet" />
        <Stat icon="calendar" value={counts.interview} label="Interviews" accent="amber" />
        <Stat icon="check" value={counts.accepted} label="Accepted" accent="accent" />
      </div>

      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tightest text-ink">Latest Opportunities</h2>
          <Button href="/student/browse" variant="outline">Browse all</Button>
        </div>
        {fetching ? (
          <div className="grid place-items-center py-12"><Spinner /></div>
        ) : latest.length === 0 ? (
          <Empty title="No open opportunities yet" sub="Check back soon — new listings are added regularly." icon="search" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {latest.map((opp) => (
              <Card key={opp.id} className="flex flex-col justify-between gap-5 p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-dim">
                    <Icon name="building" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-ink">{opp.title}</p>
                    <p className="mt-0.5 text-sm text-dim">{opp.company_name || "—"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {opp.field && <Badge tone="open">{opp.field}</Badge>}
                  {opp.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-dim">
                      <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                      {opp.location}
                    </span>
                  )}
                </div>
                <Button href={`/student/opportunity/${opp.id}`} variant="outline" className="w-full" arrow>
                  View &amp; Apply
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
