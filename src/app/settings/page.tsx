"use client";

import { useEffect, useState } from "react";
import PageHeader from "../_components/PageHeader";

interface SettingsView {
  auth_method: "smtp" | "google";
  smtp_host: string; smtp_port: number; smtp_user: string; has_pass: boolean; smtp_verified: boolean;
  google_connected: boolean; google_email: string; google_configured: boolean;
}

const GOOGLE_MSG: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Gmail connected! Featers can now send applications from your inbox." },
  notconfigured: { ok: false, text: "Google isn't configured on this server yet — set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in your env." },
  denied: { ok: false, text: "You declined the Google permission. Connect again to enable sending." },
  norefresh: { ok: false, text: "Google didn't return a refresh token. Remove Featers from your Google account permissions and reconnect." },
  error: { ok: false, text: "Something went wrong connecting Gmail. Try again." },
};

export default function SettingsPage() {
  const [s, setS] = useState<SettingsView | null>(null);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => fetch("/api/settings").then((r) => r.json()).then(setS);
  useEffect(() => {
    load();
    const g = new URLSearchParams(window.location.search).get("google");
    if (g && GOOGLE_MSG[g]) { setMsg(GOOGLE_MSG[g]); window.history.replaceState({}, "", "/settings"); }
  }, []);

  const set = (patch: Partial<SettingsView>) => setS((p) => p ? { ...p, ...patch } : p);

  const saveSmtp = async () => {
    if (!s) return; setBusy("save"); setMsg(null);
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smtp_host: s.smtp_host, smtp_port: s.smtp_port, smtp_user: s.smtp_user, ...(pass ? { smtp_pass: pass } : {}) }) });
    setPass(""); await load(); setBusy(null); setMsg({ ok: true, text: "Saved. Now test the connection." });
  };
  const test = async () => {
    setBusy("test"); setMsg(null);
    const d = await (await fetch("/api/settings/test", { method: "POST" })).json();
    setBusy(null); setMsg(d.ok ? { ok: true, text: "Connected! Your email is ready to send applications." } : { ok: false, text: d.error ?? "Could not connect." });
    await load();
  };
  const disconnectGoogle = async () => { await fetch("/api/google/disconnect", { method: "POST" }); await load(); setMsg({ ok: true, text: "Gmail disconnected." }); };

  if (!s) return <><PageHeader title="Settings" /><div className="content"><div className="empty">Loading…</div></div></>;

  const ready = s.auth_method === "google" ? s.google_connected : s.smtp_verified;

  return (
    <>
      <PageHeader title="Settings" subtitle="Connect the inbox Featers sends applications from"
        right={ready ? <span className="badge sent">Email connected ✓</span> : <span className="badge skipped">Not connected</span>} />
      <div className="content grid" style={{ gap: 18, maxWidth: 680 }}>
        {msg && (
          <div className="card" style={{ background: msg.ok ? "var(--green-soft)" : "var(--red-soft)", borderColor: msg.ok ? "#cdebd6" : "#f3c9c9", color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.text}</div>
        )}

        {/* One-click Gmail */}
        <div className="card grid" style={{ gap: 12 }}>
          <div className="spread">
            <h3 style={{ margin: 0 }}>Connect Gmail (one-click)</h3>
            {s.auth_method === "google" && s.google_connected && <span className="badge sent">Active</span>}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            Sign in with Google and grant “send email”. No password stored — Featers sends via a secure token.
          </p>
          {s.google_connected ? (
            <div className="row" style={{ gap: 10 }}>
              <span className="muted">Connected as <b>{s.google_email}</b></span>
              <button className="btn ghost sm" onClick={disconnectGoogle}>Disconnect</button>
            </div>
          ) : (
            <div>
              <a className="btn" href="/api/google/start" style={{ background: "#fff", color: "#1f2937", border: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700, color: "#4285F4" }}>G</span>&nbsp; Continue with Google
              </a>
              {!s.google_configured && <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Server needs GOOGLE_CLIENT_ID / SECRET set first (see README).</p>}
            </div>
          )}
        </div>

        <div className="spread"><div style={{ height: 1, background: "var(--border)", flex: 1 }} /><span className="muted" style={{ fontSize: 12 }}>or use an app password</span><div style={{ height: 1, background: "var(--border)", flex: 1 }} /></div>

        {/* SMTP / App password */}
        <div className="card grid" style={{ gap: 14 }}>
          <div className="spread"><h3 style={{ margin: 0 }}>App password / SMTP</h3>
            {s.auth_method === "smtp" && s.smtp_verified && <span className="badge sent">Active</span>}</div>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>For Gmail, create an <b>App Password</b> (needs 2-Step Verification on).</p>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="col"><label className="label">SMTP host</label><input className="input" value={s.smtp_host} onChange={(e) => set({ smtp_host: e.target.value })} /></div>
            <div className="col"><label className="label">Port</label><input className="input" type="number" value={s.smtp_port} onChange={(e) => set({ smtp_port: Number(e.target.value) })} /></div>
          </div>
          <div className="col"><label className="label">Your email address</label><input className="input" placeholder="you@gmail.com" value={s.smtp_user} onChange={(e) => set({ smtp_user: e.target.value })} /></div>
          <div className="col"><label className="label">App password {s.has_pass && <span className="muted">(saved — leave blank to keep)</span>}</label>
            <input className="input" type="password" placeholder={s.has_pass ? "••••••••••••" : "16-character app password"} value={pass} onChange={(e) => setPass(e.target.value)} /></div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={saveSmtp} disabled={busy !== null}>{busy === "save" ? <span className="spinner" /> : "Save"}</button>
            <button className="btn green" onClick={test} disabled={busy !== null || (!s.has_pass && !pass)}>{busy === "test" ? <span className="spinner" /> : "Test connection"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
