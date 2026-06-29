"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/lib/vb/use-profile";
import { Button, Card, Badge, Select, Empty, PageLoader } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Opportunity, Application, Profile } from "@/lib/vb/types";

type AppStatus = Application["status"];
type StudentProfile = Pick<Profile, "id" | "full_name" | "university" | "program" | "year_of_study" | "skills" | "cv_url">;
type AppRow = Application & { student: StudentProfile | null };

export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, loading, supabase } = useProfile({ requiredRole: "company" });
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchAll = async () => {
    if (!profile) return;
    const { data: oppData } = await supabase
      .from("vb_opportunities")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.id)
      .single();
    if (!oppData) { router.replace("/company"); return; }
    setOpp(oppData as Opportunity);

    const { data: appData } = await supabase
      .from("vb_applications")
      .select("*")
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false });
    const appRows = (appData as Application[]) || [];

    if (appRows.length) {
      const studentIds = appRows.map((a) => a.student_id);
      const { data: profData } = await supabase
        .from("vb_profiles")
        .select("id,full_name,university,program,year_of_study,skills,cv_url")
        .in("id", studentIds);
      const profMap: Record<string, StudentProfile> = {};
      ((profData as StudentProfile[]) || []).forEach((p) => { profMap[p.id] = p; });
      setApps(appRows.map((a) => ({ ...a, student: profMap[a.student_id] || null })));
    } else {
      setApps([]);
    }
    setFetching(false);
  };

  useEffect(() => { if (profile) fetchAll(); }, [profile]);

  const toggleStatus = async () => {
    if (!opp) return;
    const next = opp.status === "open" ? "closed" : "open";
    await supabase.from("vb_opportunities").update({ status: next }).eq("id", opp.id);
    setOpp({ ...opp, status: next });
  };

  const updateAppStatus = async (app: AppRow, status: AppStatus) => {
    await supabase.from("vb_applications").update({ status }).eq("id", app.id);
    if (opp) {
      await supabase.from("vb_notifications").insert({
        user_id: app.student_id,
        body: `Your application for "${opp.title}" is now ${status}`,
        link: `/student/applications`,
      });
    }
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
  };

  if (loading || !profile || fetching) return <PageLoader />;
  if (!opp) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tightest text-ink">{opp.title}</h2>
          <p className="flex items-center gap-1.5 text-sm text-dim">
            <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
            {[opp.field, opp.location].filter(Boolean).join(" · ") || "No location set"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={opp.status}>{opp.status}</Badge>
          <Button variant="outline" onClick={toggleStatus}>
            {opp.status === "open" ? "Close role" : "Reopen role"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-ink">Applicants</h3>
        <span className="nums rounded-full bg-paper px-2.5 py-0.5 text-sm font-semibold text-dim">{apps.length}</span>
      </div>

      {apps.length === 0 ? (
        <Empty title="No applicants yet" sub="Applications will appear here once students apply." icon="users" />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-line">
            {apps.map((app) => {
              const s = app.student;
              const skills = s?.skills ? s.skills.split(",").map((sk: string) => sk.trim()).filter(Boolean) : [];
              return (
                <div key={app.id} className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-dim">
                      <Icon name="user" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{s?.full_name || app.applicant_name || "Applicant"}</p>
                        <Badge tone={app.status}>{app.status}</Badge>
                      </div>
                      <p className="flex items-center gap-1.5 text-sm text-dim">
                        <Icon name="cap" className="h-3.5 w-3.5 shrink-0" />
                        {[s?.university, s?.program, s?.year_of_study ? `Year ${s.year_of_study}` : null].filter(Boolean).join(" · ") || "No profile info"}
                      </p>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {skills.slice(0, 6).map((sk: string) => (
                            <span key={sk} className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs text-dim">{sk}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {app.cover_note && (
                    <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-ink">{app.cover_note}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {s?.cv_url && (
                      <a
                        href={s.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper"
                      >
                        <Icon name="file" className="h-4 w-4" />
                        View CV
                        <Icon name="external" className="h-3.5 w-3.5 text-faint" />
                      </a>
                    )}
                    <div className="w-44">
                      <Select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app, e.target.value as AppStatus)}
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </Select>
                    </div>
                    <Button variant="outline" href={`/company/messages?peer=${app.student_id}`}>
                      <Icon name="chat" className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
