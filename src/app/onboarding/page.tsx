"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../_components/PageHeader";
import ChipsInput from "../_components/ChipsInput";
import type { Profile } from "@/lib/types";
import o from "./onboarding.module.css";

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

  if (!p) return <><PageHeader title="Get started" /><div className="content"><div className="empty">Loading…</div></div></>;

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

  const Pill = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button type="button" className={`${o.pill} ${active ? o.pillOn : ""}`} onClick={onClick}>{children}</button>
  );

  return (
    <>
      <PageHeader title="Get started" subtitle="A few questions so we can find and apply to the right jobs" />
      <div className="content">
        <div className={o.wrap}>
          <div className={o.steps}>{STEPS.map((_, i) => <div key={i} className={`${o.bar} ${i <= step ? o.barOn : ""}`} />)}</div>

          <div className="card">
            {step === 0 && (
              <>
                <h2 className={o.h}>About you</h2>
                <p className={o.sub}>How employers will see and contact you.</p>
                <div className="grid" style={{ gap: 12 }}>
                  <div className="col"><label className="label">Full name</label><input className="input" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="col"><label className="label">Email</label><input className="input" value={p.email} onChange={(e) => set("email", e.target.value)} /></div>
                    <div className="col"><label className="label">Phone</label><input className="input" value={p.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className={o.h}>What you do</h2>
                <p className={o.sub}>Your qualifications and the roles you want.</p>
                <div className="grid" style={{ gap: 14 }}>
                  <div className="col"><label className="label">Qualifications & experience</label>
                    <textarea className="textarea" rows={3} placeholder="e.g. BAcc, ACCA part-qualified, 5 years in audit" value={p.qualifications} onChange={(e) => set("qualifications", e.target.value)} /></div>
                  <div className="col"><label className="label">Roles / titles you want</label>
                    <ChipsInput values={p.desired_titles} onChange={(v) => set("desired_titles", v)} placeholder="e.g. Accountant, Auditor" /></div>
                  <div className="col"><label className="label">Industries / categories</label>
                    <ChipsInput values={p.desired_categories} onChange={(v) => set("desired_categories", v)} placeholder="e.g. Finance, NGO" /></div>
                  <div className="col"><label className="label">Keywords (skills, tools)</label>
                    <ChipsInput values={p.keywords} onChange={(v) => set("keywords", v)} placeholder="e.g. Pastel, SAP, payroll" /></div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className={o.h}>Where & how</h2>
                <p className={o.sub}>What kind of work setup are you after?</p>
                <div className="grid" style={{ gap: 16 }}>
                  <div><label className="label">Work mode</label>
                    <div className={o.pills} style={{ marginTop: 8 }}>{WORK_MODES.map((m) => <Pill key={m} active={p.work_modes.includes(m)} onClick={() => toggle("work_modes", m)}>{m}</Pill>)}</div></div>
                  <div><label className="label">Job type</label>
                    <div className={o.pills} style={{ marginTop: 8 }}>{TYPES.map((m) => <Pill key={m} active={p.desired_job_types.includes(m)} onClick={() => toggle("desired_job_types", m)}>{m}</Pill>)}</div></div>
                  <div className="col"><label className="label">Preferred locations (leave empty for anywhere)</label>
                    <ChipsInput values={p.desired_locations} onChange={(v) => set("desired_locations", v)} suggestions={LOCATIONS} placeholder="e.g. Harare" /></div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className={o.h}>Sending email</h2>
                <p className={o.sub}>Applications send from your own inbox. Connect it once.</p>
                {emailReady
                  ? <div className="card" style={{ background: "var(--green-soft)", borderColor: "#cdebd6", color: "var(--green)" }}>Your email is connected ✓</div>
                  : <div className="grid" style={{ gap: 12 }}>
                      <div className="card" style={{ background: "var(--bg-soft)" }}>Not connected yet. You can do this now or later — auto-apply needs it.</div>
                      <a className="btn" href="/settings">Connect my email →</a>
                    </div>}
              </>
            )}

            {step === 4 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 46 }}>🎉</div>
                <h2 className={o.h}>You’re all set, {p.full_name || "there"}!</h2>
                <p className={o.sub}>{matchCount !== null
                  ? <>We found <b style={{ color: "var(--brand)" }}>{matchCount.toLocaleString()}</b> jobs in Zimbabwe that match you.</>
                  : "Your profile is ready."}</p>
                <div className="row" style={{ justifyContent: "center", gap: 10 }}>
                  <button className="btn" onClick={() => router.push("/matches")}>View my matches →</button>
                  <button className="btn ghost" onClick={() => router.push("/resume")}>Build my CV</button>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className={o.nav}>
                <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
                <button className="btn" onClick={next}>{step === 3 ? "Finish" : "Next →"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
