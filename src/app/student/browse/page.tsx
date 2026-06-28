"use client";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/vb/use-profile";
import { Card, Badge, Button, Input, Select, PageLoader, Spinner, Empty, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Opportunity } from "@/lib/vb/types";

type OppWithCompany = Opportunity & { company_name: string | null };

export default function BrowsePage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "student" });
  const [opps, setOpps] = useState<OppWithCompany[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: oppsData } = await supabase
        .from("vb_opportunities")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      const rows = (oppsData || []) as Opportunity[];

      if (rows.length) {
        const companyIds = Array.from(new Set(rows.map((o) => o.company_id)));
        const { data: profs } = await supabase
          .from("vb_profiles")
          .select("id,company_name")
          .in("id", companyIds);
        const nameMap: Record<string, string | null> = {};
        (profs || []).forEach((p: any) => { nameMap[p.id] = p.company_name; });
        setOpps(rows.map((o) => ({ ...o, company_name: nameMap[o.company_id] ?? null })));
      }

      const { data: apps } = await supabase
        .from("vb_applications")
        .select("opportunity_id")
        .eq("student_id", profile.id);
      setAppliedIds(new Set((apps || []).map((a: any) => a.opportunity_id)));
      setFetching(false);
    })();
  }, [profile]);

  if (loading || !profile) return <PageLoader />;

  const fields = Array.from(new Set(opps.map((o) => o.field).filter(Boolean))) as string[];
  const filtered = opps.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.title.toLowerCase().includes(q) || (o.field || "").toLowerCase().includes(q) || (o.location || "").toLowerCase().includes(q);
    const matchField = !fieldFilter || o.field === fieldFilter;
    return matchSearch && matchField;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search by title, field, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
            <option value="">All fields</option>
            {fields.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
        </div>
      </div>

      {fetching ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Empty title="No opportunities found" sub="Try adjusting your search or filters." icon="search" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => {
            const applied = appliedIds.has(opp.id);
            return (
              <Card key={opp.id} className="flex flex-col justify-between gap-5 p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-dim">
                        <Icon name="building" className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-ink">{opp.title}</p>
                        <p className="mt-0.5 text-sm text-dim">{opp.company_name || "—"}</p>
                      </div>
                    </div>
                    {applied && <Badge tone="accepted" icon="check">Applied</Badge>}
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
                  <div className="grid grid-cols-2 gap-1 text-xs text-dim">
                    {opp.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />{opp.duration}
                      </span>
                    )}
                    {opp.positions != null && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="users" className="h-3.5 w-3.5 shrink-0" />{opp.positions} position{opp.positions !== 1 ? "s" : ""}
                      </span>
                    )}
                    {opp.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" />{opp.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  href={`/student/opportunity/${opp.id}`}
                  variant={applied ? "outline" : "primary"}
                  className="w-full"
                  arrow={!applied}
                >
                  {applied ? "View Details" : "View & Apply"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
