"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ChipsInput from "../_components/ChipsInput";
import type { Profile, ResourceLink, ResourceFile } from "@/lib/types";
import { useUser } from "@/lib/use-user";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Check, Upload, Loader2, FileText, Plus, Trash2, Link2, Paperclip, X,
  MapPin, Mail, Phone, UserRound, Target, PenLine, type LucideIcon,
} from "lucide-react";

const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Chitungwiza", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship", "Temporary"];

/* ── Inline-editable text (looks like text, becomes an underlined field on hover/focus) ── */
function InlineEdit({
  value, onChange, placeholder, ariaLabel, className, icon: Icon, autoWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  icon?: LucideIcon;
  autoWidth?: boolean;
}) {
  const ch = Math.max((value || placeholder).length, 6);
  return (
    <span className="group/edit relative inline-flex max-w-full items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={autoWidth ? { width: `${ch + 1}ch` } : undefined}
        className={cn(
          "min-w-0 max-w-full truncate rounded-sm border-b border-dashed border-transparent bg-transparent outline-none transition-colors",
          "placeholder:text-current placeholder:opacity-50 hover:border-current/30 focus:border-current/70 focus:placeholder:opacity-0",
          autoWidth ? "" : "w-full",
          className,
        )}
      />
      <PenLine className="pointer-events-none h-3 w-3 shrink-0 opacity-0 transition-opacity group-focus-within/edit:opacity-0 group-hover/edit:opacity-40" strokeWidth={2} />
    </span>
  );
}

export default function ProfilePage() {
  const { name: authName, email: authEmail, avatar } = useUser();
  const [p, setP] = useState<Profile | null>(null);
  const [catSuggest, setCatSuggest] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const reduce = useReducedMotion();

  // "Add resource link" draft row.
  const [newLink, setNewLink] = useState<ResourceLink>({ label: "", url: "" });
  const [resUploading, setResUploading] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setP).catch(() => {});
    fetch("/api/facets").then((r) => r.json())
      .then((d) => setCatSuggest((d.categories ?? []).slice(0, 12).map((c: any) => c?.value).filter(Boolean)))
      .catch(() => {});
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setP((prev) => prev ? { ...prev, [k]: v } : prev);
    setSaved(false); setDirty(true);
  };

  // Edit the primary (first) target role inline without losing the rest.
  const setPrimaryTitle = (v: string) => {
    if (!p) return;
    const rest = p.desired_titles.slice(1);
    const next = v.trim() ? [v, ...rest] : rest;
    set("desired_titles", next);
  };

  const save = async () => {
    if (!p) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true); setDirty(false);
      toast.success("Profile saved", { description: "Your changes are live." });
    } else {
      toast.error("Could not save profile", { description: "Please try again." });
    }
  };

  const uploadCv = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("cv", file);
    const r = await fetch("/api/profile/cv", { method: "POST", body: fd });
    const d = await r.json();
    if (d.ok) {
      set("cv_filename", d.cv_filename);
      toast.success("CV uploaded", { description: d.cv_filename });
    } else {
      toast.error("Upload failed", { description: d.error ?? "Please try again." });
    }
    setUploading(false);
  };

  // ── Resource links ─────────────────────────────────────────────────────
  const addLink = () => {
    if (!p) return;
    const url = newLink.url.trim();
    if (!url) { toast.error("Add a link first", { description: "The URL can't be empty." }); return; }
    const label = newLink.label.trim() || url.replace(/^https?:\/\//, "").split("/")[0];
    set("resources", [...p.resources, { label, url }]);
    setNewLink({ label: "", url: "" });
    toast.success("Link added", { description: "Remember to Save changes." });
  };
  const removeLink = (i: number) => {
    if (!p) return;
    set("resources", p.resources.filter((_, idx) => idx !== i));
  };

  // ── Resource files ─────────────────────────────────────────────────────
  const uploadResourceFile = async (file: File) => {
    setResUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/profile/resources", { method: "POST", body: fd });
    const d = await r.json();
    if (d.ok && p) {
      setP({ ...p, resource_files: [...p.resource_files, d.file as ResourceFile] });
      toast.success("Document added", { description: d.file.name });
    } else {
      toast.error("Upload failed", { description: d.error ?? "Please try again." });
    }
    setResUploading(false);
  };
  const removeResourceFile = async (path: string) => {
    const r = await fetch("/api/profile/resources", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }),
    });
    const d = await r.json();
    if (d.ok && p) {
      setP({ ...p, resource_files: (d.resource_files as ResourceFile[]) });
      toast.success("Document removed");
    } else {
      toast.error("Could not remove document");
    }
  };

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // Profile strength — count the fields that meaningfully improve matching.
  const checks = [
    !!p.full_name, !!p.phone, !!p.email,
    p.desired_titles.length > 0, p.desired_categories.length > 0,
    !!p.cv_filename, !!p.cover_letter_template,
    p.resources.length + p.resource_files.length > 0,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const extraTitles = p.desired_titles.slice(1);
  const locationLine = p.desired_locations.length ? p.desired_locations.join(", ") : "Open to anywhere";

  // ── Small presentational helpers ────────────────────────────────────────
  const Section = ({
    icon: Icon, title, desc, children, accent, index = 0,
  }: {
    icon: LucideIcon; title: string; desc: string; children: ReactNode; accent?: boolean; index?: number;
  }) => (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : 0.05 + index * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Card className={cn("overflow-hidden", accent && "border-primary/25")}>
        <CardHeader className={cn(accent && "bg-gradient-to-r from-primary/[0.06] to-transparent")}>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {title}
          </CardTitle>
          <CardDescription className="pl-[46px]">{desc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">{children}</CardContent>
      </Card>
    </motion.div>
  );

  const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );

  const Stat = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) => (
    <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight tracking-tight">{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 pb-28 sm:px-6 lg:px-8">
      {/* ── Hero header — identity is editable inline here ──────────────────── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            {/* Identity row — flat, no banner */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar wrapped in a completion ring with a % badge */}
                <div className="relative grid h-[88px] w-[88px] shrink-0 place-items-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                    <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--sb-muted))" strokeWidth="5" />
                    <motion.circle
                      cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--sb-primary))" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 46}
                      initial={{ strokeDashoffset: (reduce ? (1 - completeness / 100) : 1) * 2 * Math.PI * 46 }}
                      animate={{ strokeDashoffset: (1 - completeness / 100) * 2 * Math.PI * 46 }}
                      transition={{ duration: reduce ? 0 : 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                    />
                  </svg>
                  <UserAvatar
                    src={avatar}
                    name={p.full_name || authName}
                    email={p.email || authEmail}
                    className="h-[72px] w-[72px] text-xl shadow-sm"
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-[3px] text-[10px] font-bold leading-none text-primary-foreground shadow ring-2 ring-background">
                    {completeness}%
                  </span>
                </div>
                <div className="min-w-0 space-y-1">
                  <InlineEdit
                    value={p.full_name}
                    onChange={(v) => set("full_name", v)}
                    placeholder={authName || "Your name"}
                    ariaLabel="Full name"
                    className="text-xl font-bold tracking-tight sm:text-2xl"
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <InlineEdit
                      value={p.desired_titles[0] ?? ""}
                      onChange={setPrimaryTitle}
                      placeholder="Add your role"
                      ariaLabel="Primary role"
                      autoWidth
                      className="text-sm font-semibold text-primary"
                    />
                    {extraTitles.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{t}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} /> {locationLine}
                    </span>
                    <InlineEdit value={p.email} onChange={(v) => set("email", v)} placeholder="add email" ariaLabel="Email" icon={Mail} autoWidth className="text-sm" />
                    <InlineEdit value={p.phone} onChange={(v) => set("phone", v)} placeholder="add phone" ariaLabel="Phone" icon={Phone} autoWidth className="text-sm" />
                  </div>
                </div>
              </div>
              <Button onClick={save} variant={saved && !dirty ? "success" : "default"} disabled={saving} className="shrink-0">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : saved && !dirty ? <><Check className="h-4 w-4" /> Saved</>
                  : "Save changes"}
              </Button>
            </div>

            {/* Profile strength — the % lives on the avatar ring; here just the stats */}
            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                {completeness < 100
                  ? "Complete your profile for better matches and stronger applications."
                  : "All set — your profile is complete. 🎉"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Stat icon={Target} label="Target roles" value={p.desired_titles.length || "—"} />
                <Stat icon={MapPin} label="Locations" value={p.desired_locations.length || "Any"} />
                <Stat icon={FileText} label="CV" value={p.cv_filename ? "Ready" : "Missing"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── What jobs you want ───────────────────────────────────────────── */}
      <Section index={0} icon={Target} title="What jobs you want" desc="Tune what we match and auto-apply to.">
        <Field label="Desired roles / titles">
          <ChipsInput values={p.desired_titles} onChange={(v) => set("desired_titles", v)}
            placeholder="e.g. Accountant, Driver, Sales Rep — Enter to add" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categories">
            <ChipsInput values={p.desired_categories} onChange={(v) => set("desired_categories", v)}
              suggestions={catSuggest} placeholder="e.g. Finance, Logistics" />
          </Field>
          <Field label="Locations">
            <ChipsInput values={p.desired_locations} onChange={(v) => set("desired_locations", v)}
              suggestions={LOCATIONS} placeholder="Leave empty for anywhere" />
          </Field>
          <Field label="Job types">
            <ChipsInput values={p.desired_job_types} onChange={(v) => set("desired_job_types", v)}
              suggestions={TYPES} placeholder="e.g. Full Time" />
          </Field>
          <Field label="Extra keywords">
            <ChipsInput values={p.keywords} onChange={(v) => set("keywords", v)}
              placeholder="skills, tools, anything to boost matches" />
          </Field>
        </div>
      </Section>

      {/* ── Contact details (canonical, mirrors the hero) ─────────────────── */}
      <Section index={1} icon={UserRound} title="Contact details" desc="How employers see and reply to you on applications.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={p.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Phone">
            <Input value={p.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+263…" />
          </Field>
        </div>
        <Field label="Email (shown as reply-to on applications)">
          <Input type="email" value={p.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </Field>
      </Section>

      {/* ── CV ───────────────────────────────────────────────────────────── */}
      <Section index={2} icon={FileText} title="CV" desc="Attached to every application you send. PDF or Word, under 8MB.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              p.cv_filename ? "bg-success/10 text-success ring-1 ring-inset ring-success/20" : "bg-muted text-muted-foreground")}>
              <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {p.cv_filename
              ? <span className="text-muted-foreground">Current: <span className="font-medium text-foreground">{p.cv_filename}</span></span>
              : <span className="text-muted-foreground">No CV uploaded yet</span>}
          </div>
          <Button asChild variant="outline" disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> {p.cv_filename ? "Replace" : "Upload CV"}</>}
              <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
            </label>
          </Button>
        </div>
      </Section>

      {/* ── Extra application resources ──────────────────────────────────── */}
      <Section index={3} accent icon={Paperclip} title="Extra resources for applications"
        desc="Portfolio / LinkedIn / GitHub links and supporting documents (certificates, references, transcripts). These travel with your applications.">
        {/* Links */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5"><Link2 className="h-4 w-4 text-muted-foreground" /> Links</Label>
          {p.resources.length > 0 ? (
            <ul className="grid gap-2">
              {p.resources.map((r, i) => (
                <li key={`${r.url}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.label}</p>
                    <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-xs text-primary underline-offset-4 hover:underline">{r.url}</a>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeLink(i)} title="Remove link">
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
              No links yet — add your portfolio or LinkedIn below.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input placeholder="Label (e.g. Portfolio)" value={newLink.label}
              onChange={(e) => setNewLink((n) => ({ ...n, label: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} />
            <Input placeholder="https://…" value={newLink.url}
              onChange={(e) => setNewLink((n) => ({ ...n, url: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} />
            <Button type="button" variant="secondary" onClick={addLink}><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </div>

        {/* Files */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5"><Paperclip className="h-4 w-4 text-muted-foreground" /> Documents</Label>
          {p.resource_files.length > 0 && (
            <ul className="grid gap-2">
              {p.resource_files.map((f) => (
                <li key={f.path} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">{f.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeResourceFile(f.path)} title="Remove document">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" disabled={resUploading}>
            <label className="cursor-pointer">
              {resUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Add document</>}
              <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && uploadResourceFile(e.target.files[0])} />
            </label>
          </Button>
        </div>
      </Section>

      {/* ── Cover letter ─────────────────────────────────────────────────── */}
      <Section index={4} icon={PenLine} title="Cover letter"
        desc={`Optional. Use {name}, {title}, {company} as placeholders. Leave blank to use a clean default.`}>
        <Textarea rows={7} value={p.cover_letter_template}
          onChange={(e) => set("cover_letter_template", e.target.value)}
          placeholder={"Optional. Use {name}, {title}, {company} as placeholders.\nLeave blank to use a clean default."} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field label="Daily auto-apply limit">
            <Input className="max-w-[220px]" id="daily_cap" type="number" min={0} max={500} value={p.daily_cap}
              onChange={(e) => set("daily_cap", Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      {/* ── Sticky save bar — appears only when there are unsaved edits ────── */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:bottom-6"
          >
            <div className="flex items-center gap-3 rounded-full border bg-background/90 py-2 pl-4 pr-2 shadow-lg backdrop-blur">
              <span className="text-sm font-medium text-muted-foreground">You have unsaved changes</span>
              <Button size="sm" onClick={save} disabled={saving} className="rounded-full">
                {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
