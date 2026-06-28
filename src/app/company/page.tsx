"use client";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/vb/use-profile";
import { Button, Card, Badge, Empty, Stat, PageLoader, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Opportunity } from "@/lib/vb/types";

type OppWithCount = Opportunity & { appCount: number };

export default function CompanyDashboard() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "company" });
  const [opps, setOpps] = useState<OppWithCount[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchData = async () => {
    if (!profile) return;
    const { data: oppData } = await supabase
      .from("vb_opportunities")
      .select("*")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false });
    const rows = (oppData as Opportunity[]) || [];
    if (!rows.length) { setOpps([]); setFetching(false); return; }

    const ids = rows.map((o) => o.id);
    const { data: appData } = await supabase
      .from("vb_applications")
      .select("id,opportunity_id,status")
      .in("opportunity_id", ids);
    const apps = (appData as { id: string; opportunity_id: string; status: string }[]) || [];
    const countMap: Record<string, number> = {};
    apps.forEach((a) => { countMap[a.opportunity_id] = (countMap[a.opportunity_id] || 0) + 1; });

    setOpps(rows.map((o) => ({ ...o, appCount: countMap[o.id] || 0 })));
    setFetching(false);
  };

  useEffect(() => { if (profile) fetchData(); }, [profile]);

  const toggleStatus = async (opp: OppWithCount) => {
    const next = opp.status === "open" ? "closed" : "open";
    await supabase.from("vb_opportunities").update({ status: next }).eq("id", opp.id);
    setOpps((prev) => prev.map((o) => (o.id === opp.id ? { ...o, status: next } : o)));
  };

  if (loading || !profile) return <PageLoader />;

  const totalApplicants = opps.reduce((s, o) => s + o.appCount, 0);
  const openRoles = opps.filter((o) => o.status === "open").length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon="briefcase" value={opps.length} label="Total postings" accent="brand" />
        <Stat icon="users" value={totalApplicants} label="Total applicants" accent="violet" />
        <Stat icon="target" value={openRoles} label="Open roles" accent="accent" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tightest text-ink">Your Vacancies</h2>
        <Button href="/company/post" variant="primary" arrow>
          <Icon name="plus" className="h-4 w-4" />
          Post a vacancy
        </Button>
      </div>

      {fetching ? (
        <div className="grid place-items-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        </div>
      ) : opps.length === 0 ? (
        <Empty title="No postings yet" sub="Post your first vacancy to start receiving applications." icon="briefcase" />
      ) : (
        <div className="space-y-3">
          {opps.map((opp) => (
            <Card key={opp.id} className="p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                  <Icon name="briefcase" className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3 className="font-semibold text-ink">{opp.title}</h3>
                  <p className="flex items-center gap-1.5 text-sm text-dim">
                    <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                    {[opp.field, opp.location].filter(Boolean).join(" · ") || "No location set"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge tone={opp.status}>{opp.status}</Badge>
                  <span className={cn("flex items-center gap-1 text-sm text-dim")}>
                    <Icon name="users" className="h-3.5 w-3.5" />
                    <span className="nums">{opp.appCount}</span>
                    <span>{opp.appCount !== 1 ? "applicants" : "applicant"}</span>
                  </span>
                  <Button variant="outline" onClick={() => toggleStatus(opp)}>
                    {opp.status === "open" ? "Close role" : "Reopen role"}
                  </Button>
                  <Button href={`/company/opportunity/${opp.id}`} arrow>
                    View applicants
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
