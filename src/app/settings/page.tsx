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
  ChevronRight, UserRound, Mail, MailCheck, RefreshCw,
  SlidersHorizontal, Crown, LogOut, Check, X, Loader2, Eye, Zap,
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

interface SettingsView {
  google_connected: boolean; google_email: string; google_configured: boolean;
}

type Expandable = "email" | "apply" | null;

export default function SettingsPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { name, email, avatar } = useUser();
  const [s, setS] = useState<SettingsView | null>(null);
  const [prof, setProf] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<"cap" | "disc" | null>(null);
  const [open, setOpen] = useState<Expandable>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = () => fetch("/api/settings").then((r) => r.json()).then(setS);
  useEffect(() => {
    load();
    fetch("/api/profile").then((r) => r.json()).then(setProf).catch(() => {});
    const sp = new URLSearchParams(window.location.search);
    // Deep-link from onboarding, or a return from the Google OAuth flow.
    if (sp.get("connect") === "email") setOpen("email");
    const g = sp.get("google");
    if (g === "connected") { setOpen("email"); toast.success("Gmail connected — you're ready to send applications."); }
    else if (g === "notconfigured") { setOpen("email"); toast.error("Email sending isn't set up yet. Please try again later."); }
    else if (g) { setOpen("email"); toast.error("Couldn't connect Gmail. Please try again."); }
    if (sp.get("connect") || g) window.history.replaceState({}, "", "/settings");
  }, []);

  // Sending = the user's own Gmail over OAuth. One tap to connect; no passwords.
  const connectGoogle = () => { window.location.href = "/api/google/start?next=/settings"; };
  const disconnectGoogle = async () => {
    setBusy("disc");
    await fetch("/api/google/disconnect", { method: "POST" });
    await load();
    setBusy(null);
    toast("Gmail disconnected.");
  };

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

  const ready = s.google_connected;
  const activeAddr = s.google_email;

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
            sub={ready ? <>Connected · {activeAddr || "Gmail"}</> : "Connect your Gmail in one tap"}
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
                {ready ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                      <MailCheck className="h-5 w-5 shrink-0 text-success" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Gmail connected</p>
                        <p className="truncate text-xs text-muted-foreground">Applications send from {activeAddr || "your Gmail"}, so replies come straight to you.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={connectGoogle} disabled={busy !== null}>
                        <RefreshCw className="h-4 w-4" /> Reconnect
                      </Button>
                      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={disconnectGoogle} disabled={busy !== null}>
                        {busy === "disc" ? <><Loader2 className="h-4 w-4 animate-spin" /> Disconnecting…</> : "Disconnect"}
                      </Button>
                    </div>
                  </div>
                ) : s.google_configured ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your Gmail and we&rsquo;ll send each application from your own inbox, so replies come straight to you. No password to set up — Google handles it securely.
                    </p>
                    <Button onClick={connectGoogle} className="gap-2.5">
                      <GoogleIcon className="h-[18px] w-[18px]" /> Connect with Google
                    </Button>
                    <p className="text-xs text-muted-foreground">We only ask for permission to send email on your behalf. You can disconnect anytime.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Email sending isn&rsquo;t available just yet. Please check back soon.
                  </div>
                )}
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
                {/* Send mode: review & edit each email (default) vs send instantly. */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    {prof.auto_send ? <Zap className="h-4 w-4 shrink-0 text-primary" /> : <Eye className="h-4 w-4 shrink-0 text-primary" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{prof.auto_send ? "Send automatically" : "Review before sending"}</p>
                      <p className="text-xs text-muted-foreground">
                        {prof.auto_send
                          ? "Tapping Apply sends the email straight away."
                          : "Tapping Apply opens the email so you can check and edit it first."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prof.auto_send}
                    aria-label="Send automatically without preview"
                    onClick={() => setProf({ ...prof, auto_send: !prof.auto_send })}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      prof.auto_send ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  >
                    <span className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                      prof.auto_send ? "translate-x-5" : "translate-x-0.5",
                    )} />
                  </button>
                </div>
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
