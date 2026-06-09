"use client";

import { useEffect, useState } from "react";
import PageHeader from "../_components/PageHeader";
import ChipsInput from "../_components/ChipsInput";
import type { Profile } from "@/lib/types";

const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Chitungwiza", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship", "Temporary"];

export default function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [catSuggest, setCatSuggest] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setP);
    fetch("/api/facets").then((r) => r.json())
      .then((d) => setCatSuggest((d.categories ?? []).slice(0, 12).map((c: any) => c.value)))
      .catch(() => {});
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setP((prev) => prev ? { ...prev, [k]: v } : prev); setSaved(false); };

  const save = async () => {
    if (!p) return;
    await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    });
    setSaved(true);
  };

  const uploadCv = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("cv", file);
    const r = await fetch("/api/profile/cv", { method: "POST", body: fd });
    const d = await r.json();
    if (d.ok) set("cv_filename", d.cv_filename); else alert(d.error ?? "Upload failed");
    setUploading(false);
  };

  if (!p) return <><PageHeader title="Profile & CV" /><div className="content"><div className="empty">Loading…</div></div></>;

  return (
    <>
      <PageHeader title="Profile & CV" subtitle="Used to match jobs and fill your applications"
        right={<button className="btn" onClick={save}>{saved ? "Saved ✓" : "Save changes"}</button>} />
      <div className="content grid" style={{ gap: 18, maxWidth: 760 }}>
        <div className="card grid" style={{ gap: 14 }}>
          <h3 style={{ margin: 0 }}>About you</h3>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="col"><label className="label">Full name</label>
              <input className="input" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div className="col"><label className="label">Phone</label>
              <input className="input" value={p.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="col"><label className="label">Email (shown as reply-to on applications)</label>
            <input className="input" value={p.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>

        <div className="card grid" style={{ gap: 14 }}>
          <h3 style={{ margin: 0 }}>What jobs do you want?</h3>
          <div className="col"><label className="label">Desired roles / titles</label>
            <ChipsInput values={p.desired_titles} onChange={(v) => set("desired_titles", v)}
              placeholder="e.g. Accountant, Driver, Sales Rep — Enter to add" /></div>
          <div className="col"><label className="label">Categories</label>
            <ChipsInput values={p.desired_categories} onChange={(v) => set("desired_categories", v)}
              suggestions={catSuggest} placeholder="e.g. Finance, Logistics" /></div>
          <div className="col"><label className="label">Locations</label>
            <ChipsInput values={p.desired_locations} onChange={(v) => set("desired_locations", v)}
              suggestions={LOCATIONS} placeholder="Leave empty for anywhere" /></div>
          <div className="col"><label className="label">Job types</label>
            <ChipsInput values={p.desired_job_types} onChange={(v) => set("desired_job_types", v)}
              suggestions={TYPES} placeholder="e.g. Full Time" /></div>
          <div className="col"><label className="label">Extra keywords</label>
            <ChipsInput values={p.keywords} onChange={(v) => set("keywords", v)}
              placeholder="skills, tools, anything to boost matches" /></div>
        </div>

        <div className="card grid" style={{ gap: 14 }}>
          <h3 style={{ margin: 0 }}>CV</h3>
          <div className="spread">
            <div className="muted">{p.cv_filename ? <>Current: <b>{p.cv_filename}</b></> : "No CV uploaded yet"}</div>
            <label className="btn ghost sm" style={{ cursor: "pointer" }}>
              {uploading ? <span className="spinner" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /> : (p.cv_filename ? "Replace" : "Upload CV")}
              <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Attached to every application you send. PDF or Word, under 8MB.</p>
        </div>

        <div className="card grid" style={{ gap: 14 }}>
          <h3 style={{ margin: 0 }}>Cover letter template</h3>
          <textarea className="textarea" rows={7} value={p.cover_letter_template}
            onChange={(e) => set("cover_letter_template", e.target.value)}
            placeholder={"Optional. Use {name}, {title}, {company} as placeholders.\nLeave blank to use a clean default."} />
          <div className="spread">
            <div className="col" style={{ maxWidth: 220 }}>
              <label className="label">Daily auto-apply limit</label>
              <input className="input" type="number" min={0} max={500} value={p.daily_cap}
                onChange={(e) => set("daily_cap", Number(e.target.value))} />
            </div>
            <button className="btn" onClick={save}>{saved ? "Saved ✓" : "Save changes"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
