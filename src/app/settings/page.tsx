"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import type { Profile } from "@/lib/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronRight, UserRound, Mail, MailCheck, KeyRound, ShieldCheck, Zap,
  SlidersHorizontal, Crown, LogOut, Check, X, Loader2, ExternalLink,
} from "lucide-react";

// Official Google pages for setting up an app password.
const GMAIL_2SV = "https://myaccount.google.com/signinoptions/two-step-verification";
const GMAIL_APP_PW = "https://myaccount.google.com/apppasswords";

interface SettingsView {
  auth_method: "smtp" | "google";
  smtp_host: string; smtp_port: number; smtp_user: string; has_pass: boolean; smtp_verified: boolean;
  google_connected: boolean; google_email: string; google_configured: boolean;
}

const GOOGLE_MSG: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Gmail connected! Feasters can now send applications from your inbox." },
  notconfigured: { ok: false, text: "Google isn't configured on this server yet — set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in your env." },
  denied: { ok: false, text: "You declined the Google permission. Connect again to enable sending." },
  norefresh: { ok: false, text: "Google didn't return a refresh token. Remove Feasters from your Google account permissions and reconnect." },
  error: { ok: false, text: "Something went wrong connecting Gmail. Try again." },
};

type Expandable = "email" | "apply" | null;

export default function SettingsPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { name, email, avatar } = useUser();
  const [s, setS] = useState<SettingsView | null>(null);
  const [prof, setProf] = useState<Profile | null>(null);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "cap" | null>(null);
  const [open, setOpen] = useState<Expandable>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = () => fetch("/api/settings").then((r) => r.json()).then(setS);
  useEffect(() => {
    load();
    fetch("/api/profile").then((r) => r.json()).then(setProf).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (g && GOOGLE_MSG[g]) {
      const m = GOOGLE_MSG[g];
      (m.ok ? toast.success : toast.error)(m.text);
      window.history.replaceState({}, "", "/settings");
      setOpen("email");
    }
    // Deep-link from onboarding: open the Email connect section straight away.
    if (params.get("connect") === "email") {
      setOpen("email");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const set = (patch: Partial<SettingsView>) => setS((p) => p ? { ...p, ...patch } : p);

  const persistSmtp = async (): Promise<boolean> => {
    if (!s) return false;
    const addr = s.smtp_user.trim();
    if (!addr) { toast.error("Enter your email address first."); return false; }
    if (!pass && !s.has_pass) { toast.error("Enter your app password first."); return false; }
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smtp_host: s.smtp_host, smtp_port: s.smtp_port, smtp_user: addr, ...(pass ? { smtp_pass: pass } : {}) }) });
    setPass(""); await load();
    return true;
  };
  const saveSmtp = async () => { setBusy("save"); const ok = await persistSmtp(); setBusy(null); if (ok) toast.success("Saved. Now test the connection."); };
  const test = async () => {
    setBusy("test");
    if (!(await persistSmtp())) { setBusy(null); return; }
    const d = await (await fetch("/api/settings/test", { method: "POST" })).json();
    setBusy(null);
    if (d.ok) toast.success("Connected! Your email is ready to send applications.");
    else toast.error(d.error ?? "Could not connect.");
    await load();
  };
  const disconnectGoogle = async () => { await fetch("/api/google/disconnect", { method: "POST" }); await load(); toast.success("Gmail disconnected."); };

  const saveCap = async () => {
    if (!prof) return;
    setBusy("cap");
    const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prof) });
    setBusy(null);
    if (res.ok) toast.success("Apply settings saved", { description: `Up to ${prof.daily_cap} applications per day.` });
    else toast.error("Could not save", { description: "Please try again." });
  };

  const logout = async () => {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/welcome");
  };

  if (!s || !prof) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  const ready = s.auth_method === "google" ? s.google_connected : s.smtp_verified;
  const activeAddr = s.auth_method === "google" ? s.google_email : s.smtp_user;

  // ── Row primitives (iOS grouped-list style) ─────────────────────────────
  const Group = ({ label, children }: { label: string; children: ReactNode }) => (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">{children}</div>
    </section>
  );

  const RowShell = ({ icon, tint, title, sub, trailing }: {
    icon: ReactNode; tint: string; title: ReactNode; sub?: ReactNode; trailing?: ReactNode;
  }) => (
    <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tint)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{title}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {trailing}
    </div>
  );

  const Divider = () => <div className="ml-16 h-px bg-border" />;
  const Chevron = () => <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60" />;

  const expandTransition = { duration: reduce ? 0 : 0.25, ease: [0.2, 0.7, 0.2, 1] as const };
  const ExpandIcon = ({ on }: { on: boolean }) => (
    <ChevronRight className={cn("h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform", on && "rotate-90")} />
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 pt-1 text-center">
        <UserAvatar src={avatar} name={name} email={email} className="h-20 w-20 text-xl shadow-md ring-4 ring-background" />
        <div>
          <p className="text-lg font-bold tracking-tight">{name ?? "Your account"}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>

      {/* ── Account ────────────────────────────────────────────────────────── */}
      <Group label="Account">
        <Link href="/profile" className="block transition-colors hover:bg-muted/50">
          <RowShell
            icon={<UserRound className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            tint="bg-primary/10 text-primary"
            title="Manage Profile"
            sub="Name, roles, CV and resources"
            trailing={<Chevron />}
          />
        </Link>
        <Divider />

        {/* Email connect — expandable */}
        <button type="button" onClick={() => setOpen((o) => (o === "email" ? null : "email"))} className="block w-full transition-colors hover:bg-muted/50" aria-expanded={open === "email"}>
          <RowShell
            icon={ready ? <MailCheck className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            tint={ready ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}
            title="Email connect"
            sub={ready ? <>Sending via {activeAddr} ({s.auth_method === "google" ? "Gmail" : "SMTP"})</> : "Connect the inbox we apply from"}
            trailing={
              <div className="flex items-center gap-2">
                {ready
                  ? <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Active</Badge>
                  : <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" /> Off</Badge>}
                <ExpandIcon on={open === "email"} />
              </div>
            }
          />
        </button>
        <AnimatePresence initial={false}>
          {open === "email" && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={expandTransition}
              className="overflow-hidden border-t bg-muted/20"
            >
              <div className="space-y-4 p-4">
                {/* Gmail one-click */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-semibold">Connect Gmail</span>
                    <Badge variant="outline" className="font-normal">Recommended</Badge>
                  </div>
                  {s.google_connected ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
                      <ShieldCheck className="h-5 w-5 text-success" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">Connected as <span className="font-medium text-foreground">{s.google_email}</span></span>
                      <Button variant="outline" size="sm" onClick={disconnectGoogle}>Disconnect</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="h-11 w-full justify-center">
                        <a href="/api/google/start"><span className="text-base font-bold text-[#4285F4]">G</span> Continue with Google</a>
                      </Button>
                      {!s.google_configured && <p className="text-xs text-muted-foreground">Server needs GOOGLE_CLIENT_ID / SECRET set first.</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">or app password</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* SMTP / App password */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    <span className="text-sm font-semibold">App password / SMTP</span>
                    {s.auth_method === "smtp" && s.smtp_verified && <Badge variant="success">Active</Badge>}
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">How to get a Gmail app password:</span>{" "}
                    1) turn on{" "}
                    <a href={GMAIL_2SV} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2">2-Step Verification <ExternalLink className="h-3 w-3" /></a>,{" "}
                    2) open{" "}
                    <a href={GMAIL_APP_PW} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2">App passwords <ExternalLink className="h-3 w-3" /></a>,{" "}
                    3) choose <span className="font-medium text-foreground">Mail → Other</span>, name it <span className="font-medium text-foreground">Feasters</span>, tap Generate, and paste the 16-character code below.
                    <span className="mt-1.5 block">Host <span className="font-medium text-foreground">smtp.gmail.com</span> · Port <span className="font-medium text-foreground">465</span> (or 587).</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="smtp_host" className="text-xs">SMTP host</Label>
                      <Input id="smtp_host" value={s.smtp_host} onChange={(e) => set({ smtp_host: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="smtp_port" className="text-xs">Port</Label>
                      <Input id="smtp_port" type="number" value={s.smtp_port} onChange={(e) => set({ smtp_port: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_user" className="text-xs">Your email address</Label>
                    <Input id="smtp_user" placeholder="you@gmail.com" value={s.smtp_user} onChange={(e) => set({ smtp_user: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_pass" className="text-xs">App password {s.has_pass && <span className="font-normal text-muted-foreground">(saved — blank keeps it)</span>}</Label>
                    <Input id="smtp_pass" type="password" placeholder={s.has_pass ? "••••••••••••" : "16-character app password"} value={pass} onChange={(e) => setPass(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={saveSmtp} disabled={busy !== null}>
                      {busy === "save" ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
                    </Button>
                    <Button variant="success" onClick={test} disabled={busy !== null || (!s.has_pass && !pass)}>
                      {busy === "test" ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing…</> : "Test connection"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Group>

      {/* ── Applications ───────────────────────────────────────────────────── */}
      <Group label="Applications">
        {/* Apply settings — expandable */}
        <button type="button" onClick={() => setOpen((o) => (o === "apply" ? null : "apply"))} className="block w-full transition-colors hover:bg-muted/50" aria-expanded={open === "apply"}>
          <RowShell
            icon={<SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            tint="bg-indigo-500/10 text-indigo-600"
            title="Apply settings"
            sub={`Auto-apply up to ${prof.daily_cap} jobs/day`}
            trailing={<ExpandIcon on={open === "apply"} />}
          />
        </button>
        <AnimatePresence initial={false}>
          {open === "apply" && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={expandTransition}
              className="overflow-hidden border-t bg-muted/20"
            >
              <div className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="daily_cap" className="text-xs">Daily auto-apply limit</Label>
                  <Input id="daily_cap" type="number" min={0} max={500} value={prof.daily_cap}
                    onChange={(e) => setProf({ ...prof, daily_cap: Number(e.target.value) })} className="max-w-[180px]" />
                  <p className="text-xs text-muted-foreground">The most applications we&apos;ll send for you automatically each day. Set 0 to pause auto-apply.</p>
                </div>
                <Button onClick={saveCap} disabled={busy !== null}>
                  {busy === "cap" ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save apply settings"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Divider />

        <Link href="/billing" className="block transition-colors hover:bg-muted/50">
          <RowShell
            icon={<Crown className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            tint="bg-amber-500/10 text-amber-600"
            title="Plan & billing"
            sub="Upgrade for a higher daily cap"
            trailing={<Chevron />}
          />
        </Link>
      </Group>

      {/* ── Logout ─────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <button type="button" onClick={logout} disabled={signingOut} className="block w-full transition-colors hover:bg-destructive/5 disabled:opacity-60">
          <RowShell
            icon={signingOut ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            tint="bg-destructive/10 text-destructive"
            title={<span className="text-destructive">{signingOut ? "Signing out…" : "Log out"}</span>}
          />
        </button>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">Feasters · apply faster</p>
    </div>
  );
}
