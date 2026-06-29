"use client";

import { useEffect, useState, Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ChipsInput from "../_components/ChipsInput";
import type { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ChevronLeft, Check, Mail, Sparkles,
  ShieldCheck, UserRound, Briefcase, MapPin, PartyPopper, Eye, Zap, Send, type LucideIcon,
} from "lucide-react";

// The Google "G" mark, so "Connect with Google" reads as the real thing.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

const STEP_META: { short: string; title: string; desc: string; Icon: LucideIcon }[] = [
  { short: "You", title: "About you", desc: "How employers will see and contact you.", Icon: UserRound },
  { short: "Roles", title: "What you do", desc: "Your qualifications and the roles you want.", Icon: Briefcase },
  { short: "Setup", title: "Where & how", desc: "What kind of work setup are you after?", Icon: MapPin },
  { short: "Email", title: "Sending email", desc: "Applications send from your own inbox, so replies come straight to you.", Icon: Mail },
  { short: "Send", title: "How to apply", desc: "Choose how your applications go out.", Icon: Send },
  { short: "Done", title: "All set", desc: "", Icon: PartyPopper },
];
const TOTAL = STEP_META.length;

const WORK_MODES = ["On-site (Zimbabwe)", "Remote", "Freelance", "Hybrid"];
const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship"];

export default function Onboarding() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [p, setP] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);
  const [emailReady, setEmailReady] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setP).catch(() => setP(null));
    fetch("/api/settings").then((r) => r.json()).then((s) => setEmailReady(!!s.google_connected)).catch(() => {});
    // Restore position + show the result when returning from the Google OAuth flow.
    const sp = new URLSearchParams(window.location.search);
    const st = sp.get("step");
    if (st !== null) setStep(Number(st) || 0);
    const g = sp.get("google");
    if (g === "connected") { setEmailReady(true); toast.success("Gmail connected — you're ready to apply."); }
    else if (g) toast.error("Couldn't connect Gmail. You can try again, or skip and do it later.");
    if (st !== null || g) window.history.replaceState({}, "", "/onboarding");
  }, []);

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-72 w-full rounded-2xl" />
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
    setBusy(true);
    await save();
    if (step === TOTAL - 2) {
      // entering Done: persist onboarded + fetch match count, then celebrate.
      await save({ onboarded: true });
      const m = await (await fetch("/api/matches")).json();
      setMatchCount(m.count ?? null);
      toast.success(`You're all set${p.full_name ? `, ${p.full_name.split(" ")[0]}` : ""}! 🎉`, {
        description: typeof m.count === "number"
          ? `We found ${m.count.toLocaleString()} jobs in Zimbabwe that match you.`
          : "Your profile is ready — let's find you a job.",
      });
    }
    setBusy(false);
    setStep((s) => s + 1);
  };

  const Toggle = ({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) => (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );

  // Icon-headed card wrapper for the input steps.
  const StepCard = ({ children }: { children: ReactNode }) => {
    const m = STEP_META[step];
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <m.Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {m.title}
          </CardTitle>
          {m.desc && <CardDescription className="pl-[46px]">{m.desc}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  };

  const stepVariants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -28 } };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Welcome to Feasters</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Let&rsquo;s set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">A few quick questions so we can find and apply to the right jobs for you.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-start">
        {STEP_META.map((m, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <Fragment key={m.short}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={reduce ? {} : { scale: state === "current" ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border-2 transition-colors",
                    state === "done" ? "border-primary bg-primary text-primary-foreground"
                      : state === "current" ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <m.Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />}
                </motion.div>
                <span className={cn("text-[10px] font-semibold", state === "todo" ? "text-muted-foreground" : "text-foreground")}>{m.short}</span>
              </div>
              {i < TOTAL - 1 && (
                <div className="mt-[18px] h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: reduce ? 0 : 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Animated step content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {step === 0 && (
            <StepCard>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard>
              <div className="space-y-4">
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
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard>
              <div className="space-y-5">
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
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard>
              {emailReady ? (
                <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <ShieldCheck className="h-4 w-4" /> Your Gmail is connected — you&rsquo;re ready to auto-apply.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold">Connect your Gmail</p>
                      <p className="text-sm text-muted-foreground">One tap. We send each application from your own inbox, so employers reply straight to you. No password to set up — Google handles it securely.</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => { window.location.href = "/api/google/start?next=" + encodeURIComponent("/onboarding?step=3"); }}
                    className="gap-2.5"
                  >
                    <GoogleIcon className="h-[18px] w-[18px]" /> Connect with Google
                  </Button>

                  <p className="text-xs text-muted-foreground">You can skip this for now and connect later in Settings — auto-apply needs it before it can send.</p>
                </div>
              )}
            </StepCard>
          )}

          {step === 4 && (
            <StepCard>
              <div className="space-y-3">
                {[
                  { val: false as const, Icon: Eye, title: "Review before sending", desc: "We draft each application — you preview it, tweak the wording if you like, then send. Best if you want full control." },
                  { val: true as const, Icon: Zap, title: "Send automatically", desc: "We send the tailored application the moment you tap Apply. The fastest way to apply to lots of jobs." },
                ].map((opt) => {
                  const active = !!p.auto_send === opt.val;
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => set("auto_send", opt.val)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <opt.Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{opt.title}</p>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </div>
                      <span className={cn("mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")}>
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground">You can change this anytime in Settings.</p>
              </div>
            </StepCard>
          )}

          {step === 5 && (
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <motion.div
                  initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 18, delay: reduce ? 0 : 0.05 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success ring-8 ring-success/5"
                >
                  <Check className="h-10 w-10" strokeWidth={2.5} />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">You&rsquo;re all set, {p.full_name?.split(" ")[0] || "there"}!</h2>
                  <p className="text-sm text-muted-foreground">
                    {matchCount !== null
                      ? <>We found <b className="text-primary">{matchCount.toLocaleString()}</b> jobs in Zimbabwe that match you.</>
                      : "Your profile is ready."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Button onClick={() => router.push("/matches")}>
                    <Sparkles className="h-4 w-4" /> View my matches <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/resume")}>Build my CV</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      {step < TOTAL - 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={next} disabled={busy}>
            {step === TOTAL - 2 ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
