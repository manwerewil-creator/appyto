"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "../_components/PageHeader";
import ResumeSheet from "./Templates";
import { TEMPLATES, SAMPLE_RESUME, type Resume, type Experience, type Education, type Skill } from "@/lib/resume";
import b from "./builder.module.css";

const STEPS = ["Personal", "Experience", "Education", "Skills", "Summary", "Review"];
const ACCENTS = ["#2563eb", "#0f766e", "#b45309", "#9333ea", "#dc2626", "#111827"];
const blankExp = (): Experience => ({ role: "", company: "", location: "", start: "", end: "", bullets: [] });
const blankEdu = (): Education => ({ degree: "", institution: "", location: "", start: "", end: "" });

export default function ResumeBuilder() {
  const [r, setR] = useState<Resume | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { fetch("/api/resume").then((x) => x.json()).then(setR); }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!r) return;
    setSaved(false);
    clearTimeout(t.current);
    t.current = setTimeout(async () => {
      await fetch("/api/resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
      setSaved(true);
    }, 600);
    return () => clearTimeout(t.current);
  }, [r]);

  if (!r) return <><PageHeader title="CV Builder" /><div className="content"><div className="empty">Loading…</div></div></>;

  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR({ ...r, [k]: v });
  const importProfile = async () => {
    const p = await (await fetch("/api/profile")).json();
    setR({ ...r, full_name: p.full_name || r.full_name, email: p.email || r.email, phone: p.phone || r.phone,
      headline: r.headline || p.desired_titles?.[0] || "", location: r.location || p.desired_locations?.[0] || "" });
  };
  const loadSample = () => setR({ ...SAMPLE_RESUME, template: r.template, accent: r.accent });
  const photo = (file: File) => { const fr = new FileReader(); fr.onload = () => set("photo", String(fr.result)); fr.readAsDataURL(file); };

  const field = (label: string, k: keyof Resume, ph?: string) => (
    <div className="col" key={k}><label className="label">{label}</label>
      <input className="input" placeholder={ph} value={r[k] as string} onChange={(e) => set(k, e.target.value as any)} /></div>
  );

  return (
    <>
      <PageHeader title="CV Builder" subtitle="Build a professional CV from code — no templates to buy"
        right={<>
          <span className="muted no-print" style={{ fontSize: 13 }}>{saved ? "Saved ✓" : "Saving…"}</span>
          <button className="btn" onClick={() => window.print()}>⬇ Download PDF</button>
        </>} />

      <div className="content no-print">
        <div className={b.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} className={`${b.step} ${i === step ? b.stepActive : ""} ${i < step ? b.stepDone : ""}`} onClick={() => setStep(i)}>
              <span className={b.stepNum}>{i < step ? "✓" : i + 1}</span>{label}
            </div>
          ))}
        </div>

        <div className={b.layout}>
          {/* ── Form column ── */}
          <div className={b.form}>
            {step === 0 && (
              <div className="card">
                <div className={b.formCard}>
                  <div className="spread"><h2 className={b.h}>Personal info</h2>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn ghost sm" onClick={importProfile}>Import from profile</button>
                      <button className="btn ghost sm" onClick={loadSample}>Load sample</button>
                    </div>
                  </div>
                  <p className={b.sub}>Up-to-date details employers use to contact you.</p>
                  <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }} className={b.formCard}>
                      {field("Full name", "full_name", "e.g. Taylor Parker")}
                      {field("Professional headline", "headline", "e.g. Senior Accountant")}
                    </div>
                    <label className={b.photoBox}>
                      {r.photo ? <img src={r.photo} alt="" /> : <span>Photo<br />(optional)</span>}
                      <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && photo(e.target.files[0])} />
                    </label>
                  </div>
                  <div className={b.two}>{field("Email", "email", "you@gmail.com")}{field("Phone", "phone", "+263…")}</div>
                  <div className={b.two}>{field("Location", "location", "Harare, Zimbabwe")}{field("LinkedIn", "linkedin", "linkedin.com/in/…")}</div>
                  {field("Website / Portfolio", "website", "optional")}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="card">
                <div className="spread"><h2 className={b.h}>Experience</h2>
                  <button className="btn ghost sm" onClick={() => set("experience", [...r.experience, blankExp()])}>+ Add role</button></div>
                <p className={b.sub}>Start with your most recent role.</p>
                <div className={b.formCard}>
                  {r.experience.length === 0 && <p className="muted">No roles yet — add your first one.</p>}
                  {r.experience.map((e, i) => (
                    <div key={i} className={b.entry}>
                      <button className={b.removeBtn} onClick={() => set("experience", r.experience.filter((_, j) => j !== i))}>×</button>
                      <div className={b.two}>
                        <input className="input" placeholder="Job title" value={e.role} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, role: ev.target.value }; set("experience", x); }} />
                        <input className="input" placeholder="Company" value={e.company} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, company: ev.target.value }; set("experience", x); }} />
                      </div>
                      <div className={b.three}>
                        <input className="input" placeholder="Location" value={e.location} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, location: ev.target.value }; set("experience", x); }} />
                        <input className="input" placeholder="Start (Jan 2021)" value={e.start} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, start: ev.target.value }; set("experience", x); }} />
                        <input className="input" placeholder="End (Present)" value={e.end} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, end: ev.target.value }; set("experience", x); }} />
                      </div>
                      <textarea className="textarea" rows={3} placeholder="Key achievements — one per line" value={e.bullets.join("\n")}
                        onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, bullets: ev.target.value.split("\n").filter(Boolean) }; set("experience", x); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <div className="spread"><h2 className={b.h}>Education</h2>
                  <button className="btn ghost sm" onClick={() => set("education", [...r.education, blankEdu()])}>+ Add</button></div>
                <div className={b.formCard}>
                  {r.education.map((e, i) => (
                    <div key={i} className={b.entry}>
                      <button className={b.removeBtn} onClick={() => set("education", r.education.filter((_, j) => j !== i))}>×</button>
                      <div className={b.two}>
                        <input className="input" placeholder="Degree / qualification" value={e.degree} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, degree: ev.target.value }; set("education", x); }} />
                        <input className="input" placeholder="Institution" value={e.institution} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, institution: ev.target.value }; set("education", x); }} />
                      </div>
                      <div className={b.three}>
                        <input className="input" placeholder="Location" value={e.location} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, location: ev.target.value }; set("education", x); }} />
                        <input className="input" placeholder="Start" value={e.start} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, start: ev.target.value }; set("education", x); }} />
                        <input className="input" placeholder="End" value={e.end} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, end: ev.target.value }; set("education", x); }} />
                      </div>
                    </div>
                  ))}
                  {r.education.length === 0 && <p className="muted">Add your highest qualification.</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card">
                <div className="spread"><h2 className={b.h}>Skills</h2>
                  <button className="btn ghost sm" onClick={() => set("skills", [...r.skills, { name: "", level: 3 } as Skill])}>+ Add skill</button></div>
                <p className={b.sub}>Level shows as rating bars on some templates.</p>
                <div className={b.formCard}>
                  {r.skills.map((k, i) => (
                    <div key={i} className="row" style={{ gap: 10 }}>
                      <input className="input" placeholder="Skill" value={k.name} onChange={(ev) => { const x = [...r.skills]; x[i] = { ...k, name: ev.target.value }; set("skills", x); }} />
                      <select className="select" style={{ width: 150 }} value={k.level} onChange={(ev) => { const x = [...r.skills]; x[i] = { ...k, level: Number(ev.target.value) as Skill["level"] }; set("skills", x); }}>
                        <option value={1}>Beginner</option><option value={2}>Basic</option><option value={3}>Proficient</option><option value={4}>Advanced</option><option value={5}>Expert</option>
                      </select>
                      <button className={b.removeBtn} style={{ position: "static" }} onClick={() => set("skills", r.skills.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                  {r.skills.length === 0 && <p className="muted">Add a few key skills.</p>}
                  <div className="col"><label className="label">Languages (comma separated)</label>
                    <input className="input" value={r.languages.join(", ")} onChange={(e) => set("languages", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="card">
                <h2 className={b.h}>Summary & extras</h2>
                <div className={b.formCard}>
                  <div className="col"><label className="label">Professional summary</label>
                    <textarea className="textarea" rows={5} value={r.summary} onChange={(e) => set("summary", e.target.value)} placeholder="2–4 sentences about who you are and the value you bring." /></div>
                  <div className="col"><label className="label">Key achievements (one per line)</label>
                    <textarea className="textarea" rows={3} value={r.achievements.join("\n")} onChange={(e) => set("achievements", e.target.value.split("\n").filter(Boolean))} /></div>
                  <div className="col"><label className="label">Certifications (one per line)</label>
                    <textarea className="textarea" rows={3} value={r.certifications.join("\n")} onChange={(e) => set("certifications", e.target.value.split("\n").filter(Boolean))} /></div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="card">
                <h2 className={b.h}>Choose your look</h2>
                <p className={b.sub}>Pick a template and accent, then Download PDF.</p>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {TEMPLATES.map((tp) => (
                    <button key={tp.id} className={`${b.tmplBtn} ${r.template === tp.id ? b.tmplBtnActive : ""}`} style={{ textAlign: "left", padding: 12 }} onClick={() => set("template", tp.id)}>
                      <div style={{ fontSize: 14 }}>{tp.name}</div><div className="muted" style={{ fontWeight: 400 }}>{tp.blurb}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}><label className="label">Accent colour</label>
                  <div className="row" style={{ gap: 8, marginTop: 6 }}>
                    {ACCENTS.map((c) => <div key={c} className={b.swatch} style={{ background: c, outline: r.accent === c ? `2px solid ${c}` : "none" }} onClick={() => set("accent", c)} />)}
                  </div>
                </div>
                <button className="btn" style={{ marginTop: 18 }} onClick={() => window.print()}>⬇ Download PDF</button>
              </div>
            )}

            <div className={b.nav}>
              <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
              {step < STEPS.length - 1
                ? <button className="btn" onClick={() => setStep(step + 1)}>Next →</button>
                : <button className="btn green" onClick={() => window.print()}>Finish & Download</button>}
            </div>
          </div>

          {/* ── Live preview column ── */}
          <aside className={b.preview}>
            <div className={b.previewBar}>
              {TEMPLATES.map((tp) => (
                <button key={tp.id} className={`${b.tmplBtn} ${r.template === tp.id ? b.tmplBtnActive : ""}`} onClick={() => set("template", tp.id)}>{tp.name}</button>
              ))}
            </div>
            <div className={b.frame}>
              <div className={b.scaler}><ResumeSheet resume={r} /></div>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Live preview · A4 · scaled to 50%</p>
          </aside>
        </div>
      </div>

      {/* Full-size sheet for printing only */}
      <div className="print-only"><ResumeSheet resume={r} /></div>
    </>
  );
}
