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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, ChevronRight, Check, Mail, Sparkles, Zap, KeyRound, ExternalLink, ShieldCheck } from "lucide-react";

// Official Google pages for setting up an app password.
const GMAIL_2SV = "https://myaccount.google.com/signinoptions/two-step-verification";
const GMAIL_APP_PW = "https://myaccount.google.com/apppasswords";

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
  const [guideOpen, setGuideOpen] = useState(false);   // "App password" how-to

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
              <CardDescription>Applications are sent from your own inbox, so employers reply straight to you. Connect it once — pick whichever is easier.</CardDescription>
            </CardHeader>
            <CardContent>
              {emailReady ? (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <Check className="h-4 w-4" /> Your email is connected
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option 1 — Gmail one-click */}
                  <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Zap className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          Connect Gmail in one click <Badge variant="success">Easiest</Badge>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Sign in with Google and allow &ldquo;send email&rdquo;. Nothing to copy or configure.
                        </p>
                        <Button asChild className="mt-3">
                          <a href="/api/google/start"><span className="text-base font-bold">G</span> Continue with Google</a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Option 2 — App password / SMTP (with how-to) */}
                  <div className="overflow-hidden rounded-xl border">
                    <button type="button" onClick={() => setGuideOpen((o) => !o)} aria-expanded={guideOpen}
                      className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                        <KeyRound className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Or use a Gmail App Password (SMTP)</p>
                        <p className="text-sm text-muted-foreground">Best if you&rsquo;d rather not sign in with Google. Takes ~2 minutes.</p>
                      </div>
                      <ChevronRight className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", guideOpen && "rotate-90")} />
                    </button>

                    {guideOpen && (
                      <div className="space-y-4 border-t bg-muted/20 p-4">
                        <ol className="space-y-3">
                          {[
                            <>Turn on <b>2-Step Verification</b> for your Google account (app passwords only appear once it&rsquo;s on).{" "}
                              <a href={GMAIL_2SV} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2">Open 2-Step Verification <ExternalLink className="h-3 w-3" /></a></>,
                            <>Go to <b>App passwords</b>.{" "}
                              <a href={GMAIL_APP_PW} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2">Open App passwords <ExternalLink className="h-3 w-3" /></a></>,
                            <>For app choose <b>Mail</b>, for device pick <b>Other (Custom name)</b>, type <b>Feasters</b>, then tap <b>Generate</b>.</>,
                            <>Google shows a <b>16-character password</b> — copy it. The spaces don&rsquo;t matter.</>,
                            <>Open <b>email settings</b> below and, under <b>App password / SMTP</b>, enter your Gmail address and paste the password, then tap <b>Test connection</b>.</>,
                          ].map((node, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                              <span className="text-sm leading-relaxed text-foreground">{node}</span>
                            </li>
                          ))}
                        </ol>

                        {/* Exact SMTP values */}
                        <div className="rounded-lg border bg-card p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-success" /> Gmail SMTP settings</p>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                            <dt className="text-muted-foreground">Host</dt><dd className="font-medium">smtp.gmail.com</dd>
                            <dt className="text-muted-foreground">Port</dt><dd className="font-medium">465 (SSL) — or 587 (TLS)</dd>
                            <dt className="text-muted-foreground">Username</dt><dd className="font-medium">your full Gmail address</dd>
                            <dt className="text-muted-foreground">Password</dt><dd className="font-medium">the 16-character app password</dd>
                          </dl>
                        </div>

                        <Button asChild variant="outline">
                          <a href="/settings?connect=email"><Mail className="h-4 w-4" /> Open email settings to finish <ArrowRight className="h-4 w-4" /></a>
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">You can skip this for now and connect later — auto-apply needs it before it can send.</p>
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
