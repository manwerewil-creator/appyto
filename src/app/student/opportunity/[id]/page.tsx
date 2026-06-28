"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProfile } from "@/lib/vb/use-profile";
import { Card, Badge, Button, Textarea, PageLoader, Spinner, Eyebrow, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Opportunity, Application } from "@/lib/vb/types";

type OppWithCompany = Opportunity & { company_name: string | null };

export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loading, supabase } = useProfile({ requiredRole: "student" });
  const [opp, setOpp] = useState<OppWithCompany | null>(null);
  const [existing, setExisting] = useState<Application | null>(null);
  const [fetching, setFetching] = useState(true);
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile || !id) return;
    (async () => {
      const { data: oppData } = await supabase
        .from("vb_opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (!oppData) { setFetching(false); return; }
      const o = oppData as Opportunity;
      const { data: companyProf } = await supabase
        .from("vb_profiles")
        .select("company_name")
        .eq("id", o.company_id)
        .single();
      setOpp({ ...o, company_name: (companyProf as any)?.company_name ?? null });

      const { data: app } = await supabase
        .from("vb_applications")
        .select("*")
        .eq("opportunity_id", id)
        .eq("student_id", profile.id)
        .maybeSingle();
      setExisting(app as Application | null);
      setFetching(false);
    })();
  }, [profile, id]);

  const handleApply = async () => {
    if (!profile || !opp) return;
    setSubmitting(true);
    setError("");
    const { error: insertErr } = await supabase.from("vb_applications").insert({
      opportunity_id: opp.id,
      student_id: profile.id,
      cover_note: coverNote,
      cv_url: profile.cv_url,
      status: "pending",
    });
    if (insertErr) {
      if (insertErr.code === "23505") {
        setError("You have already applied for this internship.");
      } else {
        setError(insertErr.message);
      }
      setSubmitting(false);
      return;
    }
    await supabase.from("vb_notifications").insert({
      user_id: opp.company_id,
      body: `New application for ${opp.title}`,
      link: `/company/applications`,
    });
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => router.push("/student/applications"), 1500);
  };

  if (loading || !profile) return <PageLoader />;
  if (fetching) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (!opp) return <p className="py-20 text-center text-dim">Opportunity not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-paper text-dim">
            <Icon name="building" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tightest text-ink">{opp.title}</h2>
            <p className="mt-0.5 text-dim">{opp.company_name || "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={opp.status}>{opp.status}</Badge>
          {opp.field && <Badge tone="open">{opp.field}</Badge>}
          {opp.location && (
            <span className="inline-flex items-center gap-1 text-sm text-dim">
              <Icon name="pin" className="h-4 w-4 shrink-0" />{opp.location}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-paper p-4 text-sm">
          {opp.duration && (
            <span className="flex items-center gap-2 text-dim">
              <Icon name="clock" className="h-4 w-4 shrink-0 text-faint" />
              <span><span className="text-ink">{opp.duration}</span> duration</span>
            </span>
          )}
          {opp.positions != null && (
            <span className="flex items-center gap-2 text-dim">
              <Icon name="users" className="h-4 w-4 shrink-0 text-faint" />
              <span><span className="text-ink">{opp.positions}</span> position{opp.positions !== 1 ? "s" : ""}</span>
            </span>
          )}
          {opp.deadline && (
            <span className="flex items-center gap-2 text-dim">
              <Icon name="calendar" className="h-4 w-4 shrink-0 text-faint" />
              <span>Deadline <span className="text-ink">{opp.deadline}</span></span>
            </span>
          )}
        </div>

        {opp.description && (
          <div className="space-y-1.5">
            <Eyebrow>Description</Eyebrow>
            <p className="text-sm text-dim whitespace-pre-line leading-relaxed">{opp.description}</p>
          </div>
        )}
        {opp.requirements && (
          <div className="space-y-1.5">
            <Eyebrow>Requirements</Eyebrow>
            <p className="text-sm text-dim whitespace-pre-line leading-relaxed">{opp.requirements}</p>
          </div>
        )}
      </Card>

      {existing ? (
        <Card className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-ink">Already applied</p>
            <div className="mt-1.5"><Badge tone={existing.status}>{existing.status}</Badge></div>
          </div>
          <Button href="/student/applications" variant="outline">View Applications</Button>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <h3 className="font-extrabold tracking-tightest text-ink">Apply for this internship</h3>

          <div className={cn(
            "flex items-center gap-3 rounded-xl border p-3 text-sm",
            profile.cv_url ? "border-line bg-paper" : "border-amber-200 bg-amber-50"
          )}>
            <Icon
              name={profile.cv_url ? "file" : "upload"}
              className={cn("h-4 w-4 shrink-0", profile.cv_url ? "text-dim" : "text-amber-600")}
            />
            {profile.cv_url ? (
              <span className="text-dim">
                CV attached —{" "}
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand underline underline-offset-2">
                  View
                  <Icon name="external" className="h-3.5 w-3.5" />
                </a>
              </span>
            ) : (
              <span className="text-amber-700">
                No CV uploaded.{" "}
                <a href="/student/profile" className="underline underline-offset-2">Upload one</a>{" "}
                before applying.
              </span>
            )}
          </div>

          <Textarea
            label="Cover note"
            rows={5}
            placeholder="Tell the company why you're a great fit…"
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-grass-600">
              <Icon name="check" className="h-4 w-4" />
              Application submitted — redirecting…
            </p>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            disabled={submitting || success}
            className="w-full"
            arrow
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        </Card>
      )}
    </div>
  );
}
