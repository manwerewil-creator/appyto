"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Spinner, Empty, Stat, Icon } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";
import type { Profile, Application, Opportunity } from "@/lib/vb/types";

type RecentPlacement = {
  studentName: string;
  opportunityTitle: string;
  companyName: string;
  date: string;
};

export default function UniversityPage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "university" });

  const [students, setStudents] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [placements, setPlacements] = useState<RecentPlacement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [stuRes, appRes, oppRes] = await Promise.all([
        supabase.from("vb_profiles").select("*").eq("role", "student"),
        supabase.from("vb_applications").select("*"),
        supabase.from("vb_opportunities").select("*"),
      ]);

      const studs: Profile[] = stuRes.data || [];
      const apps: Application[] = appRes.data || [];
      const opps: Opportunity[] = oppRes.data || [];

      setStudents(studs);
      setApplications(apps);
      setOpportunities(opps);

      const acceptedApps = apps.filter((a) => a.status === "accepted").slice(0, 10);
      const studentMap = new Map(studs.map((s) => [s.id, s]));
      const oppMap = new Map(opps.map((o) => [o.id, o]));

      const companyIds = [...new Set(opps.map((o) => o.company_id))];
      let companyMap = new Map<string, Profile>();
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("vb_profiles")
          .select("*")
          .in("id", companyIds);
        companyMap = new Map((companies || []).map((c: Profile) => [c.id, c]));
      }

      const recentPlacements: RecentPlacement[] = acceptedApps.map((a) => {
        const student = studentMap.get(a.student_id);
        const opp = oppMap.get(a.opportunity_id);
        const company = opp ? companyMap.get(opp.company_id) : undefined;
        return {
          studentName: student?.full_name || "Unknown",
          opportunityTitle: opp?.title || "Unknown Role",
          companyName: company?.company_name || "Unknown Company",
          date: a.created_at,
        };
      });

      setPlacements(recentPlacements);
      setDataLoading(false);
    })();
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.paid).length;

  const studentAppMap = new Map<string, Application[]>();
  applications.forEach((a) => {
    const arr = studentAppMap.get(a.student_id) || [];
    arr.push(a);
    studentAppMap.set(a.student_id, arr);
  });

  const placed = students.filter((s) => {
    const apps = studentAppMap.get(s.id) || [];
    return apps.some((a) => a.status === "accepted");
  }).length;

  const inProgress = students.filter((s) => {
    const apps = studentAppMap.get(s.id) || [];
    return apps.length > 0 && !apps.some((a) => a.status === "accepted");
  }).length;

  const placementRate = totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-xl font-extrabold tracking-tightest text-ink">Monitoring Dashboard</h2>
        <p className="text-sm text-dim">Track student placement progress across your institution.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon="cap" value={totalStudents} label="Total Students" accent="brand" />
        <Stat icon="card" value={paidStudents} label="Paid Students" accent="accent" />
        <Stat icon="check" value={placed} label="Placed" accent="accent" />
        <Stat icon="clock" value={inProgress} label="In Progress" accent="amber" />
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-ink">Placement Rate</h3>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-dim">Overall</span>
          <span className="nums font-bold text-ink">{placementRate}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-grass transition-all"
            style={{ width: `${placementRate}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-dim">
          <span>
            <span className="nums font-semibold text-grass-600">{placed}</span> placed
          </span>
          <span>
            <span className="nums font-semibold text-amber-600">{inProgress}</span> in progress
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-ink">Recent Placements</h3>
        {placements.length === 0 ? (
          <Empty title="No placements yet" sub="Accepted applications will appear here." />
        ) : (
          <div className="divide-y divide-line">
            {placements.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-ink">{p.studentName}</p>
                  <Icon name="arrowRight" className="h-4 w-4 text-faint" />
                  <p className="text-sm text-dim">
                    {p.opportunityTitle} &middot; {p.companyName}
                  </p>
                </div>
                <Badge tone="accepted">Accepted</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
