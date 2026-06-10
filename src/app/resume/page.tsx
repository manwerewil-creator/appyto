"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResumeSheet from "./Templates";
import { TEMPLATES, SAMPLE_RESUME, type Resume, type Experience, type Education, type Skill } from "@/lib/resume";
import b from "./builder.module.css";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Download,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
} from "lucide-react";

const STEPS = ["Personal", "Experience", "Education", "Skills", "Summary", "Review"];
const ACCENTS = ["#2563eb", "#0f766e", "#b45309", "#9333ea", "#dc2626", "#111827"];
const blankExp = (): Experience => ({ role: "", company: "", location: "", start: "", end: "", bullets: [] });
const blankEdu = (): Education => ({ degree: "", institution: "", location: "", start: "", end: "" });

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function ResumeBuilder() {
  const [r, setR] = useState<Resume | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(true);
  const [scale, setScale] = useState(0.53);   // A4 preview scale (fluid; set from measured width)
  const [builderW, setBuilderW] = useState(0); // measured width of the builder area
  const t = useRef<ReturnType<typeof setTimeout>>();
  const roRef = useRef<ResizeObserver>();
  const builderRoRef = useRef<ResizeObserver>();

  useEffect(() => { fetch("/api/resume").then((x) => x.json()).then(setR); }, []);

  // Measure the preview frame and scale the 793.7px (210mm) A4 sheet to fit it
  // exactly — so the preview adapts to any column/screen width with no overflow.
  const frameCb = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!node) return;
    const update = () => { if (node.clientWidth) setScale(node.clientWidth / 793.7); };
    update();
    roRef.current = new ResizeObserver(update);
    roRef.current.observe(node);
  }, []);

  // Measure the actual builder width and decide the layout in JS (not via a CSS
  // breakpoint or container query) — this can't be defeated by the sidebar,
  // zoom or any stray overflow, so the form is never squashed.
  const builderCb = useCallback((node: HTMLDivElement | null) => {
    builderRoRef.current?.disconnect();
    if (!node) return;
    const update = () => setBuilderW(node.clientWidth);
    update();
    builderRoRef.current = new ResizeObserver(update);
    builderRoRef.current.observe(node);
  }, []);
  useEffect(() => () => { roRef.current?.disconnect(); builderRoRef.current?.disconnect(); }, []);

  // Two columns only when there's genuinely room for a usable form + preview.
  const twoCol = builderW >= 900;

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

  if (!r) return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );

  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR({ ...r, [k]: v });
  const importProfile = async () => {
    const p = await (await fetch("/api/profile")).json();
    setR({ ...r, full_name: p.full_name || r.full_name, email: p.email || r.email, phone: p.phone || r.phone,
      headline: r.headline || p.desired_titles?.[0] || "", location: r.location || p.desired_locations?.[0] || "" });
  };
  const loadSample = () => setR({ ...SAMPLE_RESUME, template: r.template, accent: r.accent });
  const photo = (file: File) => { const fr = new FileReader(); fr.onload = () => set("photo", String(fr.result)); fr.readAsDataURL(file); };

  const field = (label: string, k: keyof Resume, ph?: string) => (
    <div className="space-y-1.5" key={k}>
      <Label>{label}</Label>
      <Input placeholder={ph} value={r[k] as string} onChange={(e) => set(k, e.target.value as any)} />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <p className="text-sm text-muted-foreground">Build a professional CV that employers take seriously.</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">{saved ? "Saved ✓" : "Saving…"}</span>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="no-print">
        {/* Step pills */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && !active && "border-primary/40 bg-primary/10 text-primary",
                  !active && !done && "border-input bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    active ? "bg-primary-foreground/20" : done ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <div
          ref={builderCb}
          className="mt-6 grid items-start gap-6"
          style={{ gridTemplateColumns: twoCol ? "minmax(0, 1fr) minmax(300px, 380px)" : "minmax(0, 1fr)" }}
        >
          {/* ── Form column ── */}
          <div className="min-w-0 space-y-4">
            {step === 0 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold">Personal info</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={importProfile}>Import from profile</Button>
                      <Button variant="outline" size="sm" onClick={loadSample}>Load sample</Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Up-to-date details employers use to contact you.</p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-4">
                      {field("Full name", "full_name", "e.g. Taylor Parker")}
                      {field("Professional headline", "headline", "e.g. Senior Accountant")}
                    </div>
                    <label className="flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/30 text-center text-xs text-muted-foreground hover:bg-muted/60">
                      {r.photo ? (
                        <img src={r.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex flex-col items-center gap-1">
                          <ImagePlus className="h-5 w-5" />
                          Photo<br />(optional)
                        </span>
                      )}
                      <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && photo(e.target.files[0])} />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">{field("Email", "email", "you@gmail.com")}{field("Phone", "phone", "+263…")}</div>
                  <div className="grid gap-4 sm:grid-cols-2">{field("Location", "location", "Harare, Zimbabwe")}{field("LinkedIn", "linkedin", "linkedin.com/in/…")}</div>
                  {field("Website / Portfolio", "website", "optional")}
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Experience</h2>
                    <Button variant="outline" size="sm" onClick={() => set("experience", [...r.experience, blankExp()])}>
                      <Plus className="h-4 w-4" /> Add role
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Start with your most recent role.</p>
                  <div className="space-y-4">
                    {r.experience.length === 0 && <p className="text-sm text-muted-foreground">No roles yet — add your first one.</p>}
                    {r.experience.map((e, i) => (
                      <div key={i} className="relative space-y-3 rounded-md border border-border p-4">
                        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => set("experience", r.experience.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="grid gap-3 pr-8 sm:grid-cols-2">
                          <Input placeholder="Job title" value={e.role} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, role: ev.target.value }; set("experience", x); }} />
                          <Input placeholder="Company" value={e.company} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, company: ev.target.value }; set("experience", x); }} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input placeholder="Location" value={e.location} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, location: ev.target.value }; set("experience", x); }} />
                          <Input placeholder="Start (Jan 2021)" value={e.start} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, start: ev.target.value }; set("experience", x); }} />
                          <Input placeholder="End (Present)" value={e.end} onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, end: ev.target.value }; set("experience", x); }} />
                        </div>
                        <Textarea rows={3} placeholder="Key achievements — one per line" value={e.bullets.join("\n")}
                          onChange={(ev) => { const x = [...r.experience]; x[i] = { ...e, bullets: ev.target.value.split("\n").filter(Boolean) }; set("experience", x); }} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Education</h2>
                    <Button variant="outline" size="sm" onClick={() => set("education", [...r.education, blankEdu()])}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {r.education.map((e, i) => (
                      <div key={i} className="relative space-y-3 rounded-md border border-border p-4">
                        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => set("education", r.education.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="grid gap-3 pr-8 sm:grid-cols-2">
                          <Input placeholder="Degree / qualification" value={e.degree} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, degree: ev.target.value }; set("education", x); }} />
                          <Input placeholder="Institution" value={e.institution} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, institution: ev.target.value }; set("education", x); }} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input placeholder="Location" value={e.location} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, location: ev.target.value }; set("education", x); }} />
                          <Input placeholder="Start" value={e.start} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, start: ev.target.value }; set("education", x); }} />
                          <Input placeholder="End" value={e.end} onChange={(ev) => { const x = [...r.education]; x[i] = { ...e, end: ev.target.value }; set("education", x); }} />
                        </div>
                      </div>
                    ))}
                    {r.education.length === 0 && <p className="text-sm text-muted-foreground">Add your highest qualification.</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Skills</h2>
                    <Button variant="outline" size="sm" onClick={() => set("skills", [...r.skills, { name: "", level: 3 } as Skill])}>
                      <Plus className="h-4 w-4" /> Add skill
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Level shows as rating bars on some templates.</p>
                  <div className="space-y-3">
                    {r.skills.map((k, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input placeholder="Skill" value={k.name} onChange={(ev) => { const x = [...r.skills]; x[i] = { ...k, name: ev.target.value }; set("skills", x); }} />
                        <select className={cn(selectClass, "w-40 shrink-0")} value={k.level} onChange={(ev) => { const x = [...r.skills]; x[i] = { ...k, level: Number(ev.target.value) as Skill["level"] }; set("skills", x); }}>
                          <option value={1}>Beginner</option><option value={2}>Basic</option><option value={3}>Proficient</option><option value={4}>Advanced</option><option value={5}>Expert</option>
                        </select>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => set("skills", r.skills.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {r.skills.length === 0 && <p className="text-sm text-muted-foreground">Add a few key skills.</p>}
                    <div className="space-y-1.5">
                      <Label>Languages (comma separated)</Label>
                      <Input value={r.languages.join(", ")} onChange={(e) => set("languages", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-lg font-semibold">Summary & extras</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Professional summary</Label>
                      <Textarea rows={5} value={r.summary} onChange={(e) => set("summary", e.target.value)} placeholder="2–4 sentences about who you are and the value you bring." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key achievements (one per line)</Label>
                      <Textarea rows={3} value={r.achievements.join("\n")} onChange={(e) => set("achievements", e.target.value.split("\n").filter(Boolean))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Certifications (one per line)</Label>
                      <Textarea rows={3} value={r.certifications.join("\n")} onChange={(e) => set("certifications", e.target.value.split("\n").filter(Boolean))} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-lg font-semibold">Choose your look</h2>
                  <p className="text-sm text-muted-foreground">Pick a template and accent, then Download PDF.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TEMPLATES.map((tp) => (
                      <button
                        key={tp.id}
                        onClick={() => set("template", tp.id)}
                        className={cn(
                          "rounded-md border p-3 text-left transition-colors hover:bg-accent",
                          r.template === tp.id ? "border-primary ring-1 ring-primary" : "border-input",
                        )}
                      >
                        <div className="text-sm font-medium">{tp.name}</div>
                        <div className="text-sm text-muted-foreground">{tp.blurb}</div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Accent colour</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENTS.map((c) => (
                        <button
                          key={c}
                          onClick={() => set("accent", c)}
                          className={cn(
                            "h-7 w-7 rounded-full border border-black/10 transition-transform hover:scale-110",
                            r.accent === c && "ring-2 ring-offset-2",
                          )}
                          style={{ background: c, ...(r.accent === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                          aria-label={`Accent ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => window.print()}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="success" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> Finish & Download
                </Button>
              )}
            </div>
          </div>

          {/* ── Live preview column — its own panel ── */}
          <aside
            className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm"
            style={twoCol ? { position: "sticky", top: 84 } : undefined}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Live preview</h3>
              <span className="text-xs text-muted-foreground">A4 · auto-saves</span>
            </div>
            <div className={b.previewBar}>
              {TEMPLATES.map((tp) => (
                <button key={tp.id} className={`${b.tmplBtn} ${r.template === tp.id ? b.tmplBtnActive : ""}`} onClick={() => set("template", tp.id)}>{tp.name}</button>
              ))}
            </div>
            <div className={b.frame} ref={frameCb}>
              <div className={b.scaler} style={{ transform: `scale(${scale})` }}><ResumeSheet resume={r} /></div>
            </div>
          </aside>
        </div>
      </div>

      {/* Full-size sheet for printing only */}
      <div className="print-only"><ResumeSheet resume={r} /></div>
    </div>
  );
}
