"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChipsInput from "../_components/ChipsInput";
import type { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, Check, Mail, Sparkles } from "lucide-react";

const STEPS = ["About you", "What you do", "Where & how", "Sending email", "Done"];
const WORK_MODES = ["On-site (Zimbabwe)", "Remote", "Freelance", "Hybrid"];
const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship"];

export default function Onboarding() {
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);
  const [emailReady, setEmailReady] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setP);
    fetch("/api/settings").then((r) => r.json()).then((s) =>
      setEmailReady(s.auth_method === "google" ? s.google_connected : s.smtp_verified));
  }, []);

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Get started</h1>
          <p className="text-sm text-muted-foreground">A few questions so we can find and apply to the right jobs</p>
        </div>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <Card>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP({ ...p, [k]: v });
  const toggle = (key: "work_modes" | "desired_job_types", val: string) => {
    const cur = p[key]; set(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  };
  const save = (extra: Partial<Profile> = {}) =>
    fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, ...extra }) });

  const next = async () => {
    await save();
    if (step === STEPS.length - 2) {
      // entering Done: persist onboarded + fetch match count
      await save({ onboarded: true });
      const m = await (await fetch("/api/matches")).json();
      setMatchCount(m.count);
    }
    setStep(step + 1);
  };

  const Toggle = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Get started</h1>
        <p className="text-sm text-muted-foreground">A few questions so we can find and apply to the right jobs</p>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{STEPS[step]}</span>
            <span>Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>About you</CardTitle>
              <CardDescription>How employers will see and contact you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What you do</CardTitle>
              <CardDescription>Your qualifications and the roles you want.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="qualifications">Qualifications &amp; experience</Label>
                <Textarea id="qualifications" rows={3} placeholder="e.g. BAcc, ACCA part-qualified, 5 years in audit" value={p.qualifications} onChange={(e) => set("qualifications", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Roles / titles you want</Label>
                <ChipsInput values={p.desired_titles} onChange={(v) => set("desired_titles", v)} placeholder="e.g. Accountant, Auditor" />
              </div>
              <div className="space-y-1.5">
                <Label>Industries / categories</Label>
                <ChipsInput values={p.desired_categories} onChange={(v) => set("desired_categories", v)} placeholder="e.g. Finance, NGO" />
              </div>
              <div className="space-y-1.5">
                <Label>Keywords (skills, tools)</Label>
                <ChipsInput values={p.keywords} onChange={(v) => set("keywords", v)} placeholder="e.g. Pastel, SAP, payroll" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Where &amp; how</CardTitle>
              <CardDescription>What kind of work setup are you after?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Work mode</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((m) => <Toggle key={m} active={p.work_modes.includes(m)} onClick={() => toggle("work_modes", m)}>{m}</Toggle>)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job type</Label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((m) => <Toggle key={m} active={p.desired_job_types.includes(m)} onClick={() => toggle("desired_job_types", m)}>{m}</Toggle>)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred locations (leave empty for anywhere)</Label>
                <ChipsInput values={p.desired_locations} onChange={(v) => set("desired_locations", v)} suggestions={LOCATIONS} placeholder="e.g. Harare" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Sending email</CardTitle>
              <CardDescription>Applications send from your own inbox. Connect it once.</CardDescription>
            </CardHeader>
            <CardContent>
              {emailReady ? (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <Check className="h-4 w-4" /> Your email is connected
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    Not connected yet. You can do this now or later — auto-apply needs it.
                  </div>
                  <Button asChild variant="outline">
                    <a href="/settings"><Mail className="h-4 w-4" /> Connect my email <ArrowRight className="h-4 w-4" /></a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="space-y-4 py-8 text-center">
              <div className="text-5xl">🎉</div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">You&rsquo;re all set, {p.full_name || "there"}!</h2>
                <p className="text-sm text-muted-foreground">
                  {matchCount !== null
                    ? <>We found <b className="text-primary">{matchCount.toLocaleString()}</b> jobs in Zimbabwe that match you.</>
                    : "Your profile is ready."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button onClick={() => router.push("/matches")}>
                  <Sparkles className="h-4 w-4" /> View my matches <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => router.push("/resume")}>Build my CV</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step < 4 && (
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next}>
              {step === 3 ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
