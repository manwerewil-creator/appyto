"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Loader2, Mail, MailCheck, KeyRound, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function SettingsPage() {
  const [s, setS] = useState<SettingsView | null>(null);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);

  const load = () => fetch("/api/settings").then((r) => r.json()).then(setS);
  useEffect(() => {
    load();
    const g = new URLSearchParams(window.location.search).get("google");
    if (g && GOOGLE_MSG[g]) {
      const m = GOOGLE_MSG[g];
      (m.ok ? toast.success : toast.error)(m.text);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const set = (patch: Partial<SettingsView>) => setS((p) => p ? { ...p, ...patch } : p);

  // Persist the current form. Returns false (with an inline error) if the
  // required fields aren't there yet, so callers can bail before testing.
  const persistSmtp = async (): Promise<boolean> => {
    if (!s) return false;
    const email = s.smtp_user.trim();
    if (!email) { toast.error("Enter your email address first."); return false; }
    if (!pass && !s.has_pass) { toast.error("Enter your app password first."); return false; }
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smtp_host: s.smtp_host, smtp_port: s.smtp_port, smtp_user: email, ...(pass ? { smtp_pass: pass } : {}) }) });
    setPass(""); await load();
    return true;
  };
  const saveSmtp = async () => {
    setBusy("save");
    const ok = await persistSmtp();
    setBusy(null);
    if (ok) toast.success("Saved. Now test the connection.");
  };
  // Always save what's on screen first, then verify — so Test reflects the form,
  // not whatever happened to be saved before.
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

  if (!s) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const ready = s.auth_method === "google" ? s.google_connected : s.smtp_verified;
  const activeAddr = s.auth_method === "google" ? s.google_email : s.smtp_user;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-muted-foreground">Connect the inbox Feasters sends applications from.</p>
      </div>

      {/* ── Status hero ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className={cn("h-1.5 w-full", ready ? "bg-gradient-to-r from-success to-emerald-400" : "bg-gradient-to-r from-primary to-blue-400")} />
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", ready ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
            {ready ? <MailCheck className="h-7 w-7" strokeWidth={1.75} /> : <Mail className="h-7 w-7" strokeWidth={1.75} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight">{ready ? "Email connected" : "Connect your sending inbox"}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {ready
                ? <>Applications send via <span className="font-medium text-foreground">{activeAddr}</span> ({s.auth_method === "google" ? "Gmail" : "SMTP"}).</>
                : "Feasters sends each application from your own inbox — connect it below."}
            </p>
          </div>
          {ready
            ? <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Active</Badge>
            : <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" /> Not connected</Badge>}
        </CardContent>
      </Card>

      {/* ── One-click Gmail ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-4 w-4" strokeWidth={1.75} />
              </span>
              Connect Gmail
              <Badge variant="outline" className="font-normal">Recommended</Badge>
            </CardTitle>
            {s.auth_method === "google" && s.google_connected && <Badge variant="success">Active</Badge>}
          </div>
          <CardDescription>
            One click — sign in with Google and grant &ldquo;send email&rdquo;. No password stored; Feasters sends via a secure token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {s.google_connected ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-success" strokeWidth={1.75} />
              <span className="text-sm text-muted-foreground">Connected as <span className="font-medium text-foreground">{s.google_email}</span></span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={disconnectGoogle}>Disconnect</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild size="lg" variant="outline" className="w-full justify-center sm:w-auto">
                <a href="/api/google/start">
                  <span className="text-base font-bold text-[#4285F4]">G</span> Continue with Google
                </a>
              </Button>
              {!s.google_configured && (
                <p className="text-xs text-muted-foreground">Server needs GOOGLE_CLIENT_ID / SECRET set first (see README).</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground">or use an app password</span>
        <Separator className="flex-1" />
      </div>

      {/* ── SMTP / App password ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                <KeyRound className="h-4 w-4" strokeWidth={1.75} />
              </span>
              App password / SMTP
            </CardTitle>
            {s.auth_method === "smtp" && s.smtp_verified && <Badge variant="success">Active</Badge>}
          </div>
          <CardDescription>For Gmail, create an <span className="font-medium text-foreground">App Password</span> (needs 2-Step Verification on).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="smtp_host">SMTP host</Label>
              <Input id="smtp_host" value={s.smtp_host} onChange={(e) => set({ smtp_host: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp_port">Port</Label>
              <Input id="smtp_port" type="number" value={s.smtp_port} onChange={(e) => set({ smtp_port: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtp_user">Your email address</Label>
            <Input id="smtp_user" placeholder="you@gmail.com" value={s.smtp_user} onChange={(e) => set({ smtp_user: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtp_pass">
              App password {s.has_pass && <span className="font-normal text-muted-foreground">(saved — leave blank to keep)</span>}
            </Label>
            <Input id="smtp_pass" type="password" placeholder={s.has_pass ? "••••••••••••" : "16-character app password"} value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveSmtp} disabled={busy !== null}>
              {busy === "save" ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
            </Button>
            <Button variant="success" onClick={test} disabled={busy !== null || (!s.has_pass && !pass)}>
              {busy === "test" ? <><Loader2 className="h-4 w-4 animate-spin" /> Testing…</> : "Test connection"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
