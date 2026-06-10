"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import {
  Check, Upload, Loader2, FileText, Plus, Trash2, Link2, Paperclip, X,
  MapPin, Mail, Phone, UserRound, Target, PenLine,
} from "lucide-react";

const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Chitungwiza", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship", "Temporary"];

export default function ProfilePage() {
  const { name: authName, email: authEmail, avatar } = useUser();
  const [p, setP] = useState<Profile | null>(null);
  const [catSuggest, setCatSuggest] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  // "Add resource link" draft row.
  const [newLink, setNewLink] = useState<ResourceLink>({ label: "", url: "" });
  const [resUploading, setResUploading] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setP);
    fetch("/api/facets").then((r) => r.json())
      .then((d) => setCatSuggest((d.categories ?? []).slice(0, 12).map((c: any) => c.value)))
      .catch(() => {});
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setP((prev) => prev ? { ...prev, [k]: v } : prev); setSaved(false); };

  const save = async () => {
    if (!p) return;
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    });
    if (res.ok) {
      setSaved(true);
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
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const SaveButton = ({ className }: { className?: string } = {}) => (
    <Button onClick={save} variant={saved ? "success" : "default"} className={className}>
      {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
    </Button>
  );

  // Profile strength — count the fields that meaningfully improve matching.
  const checks = [
    !!p.full_name, !!p.phone, !!p.email,
    p.desired_titles.length > 0, p.desired_categories.length > 0,
    !!p.cv_filename, !!p.cover_letter_template,
    p.resources.length + p.resource_files.length > 0,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const headline = p.desired_titles.length
    ? p.desired_titles.slice(0, 3).join(" · ")
    : "Add your target roles to get matched";
  const locationLine = p.desired_locations.length ? p.desired_locations.join(", ") : "Open to anywhere";

  const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="rounded-xl border bg-background p-3 text-center">
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );

  const SectionIcon = ({ children }: { children: ReactNode }) => (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{children}</span>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Hero header (LinkedIn/Upwork style) ──────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 sm:h-32">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
        </div>
        <CardContent className="p-5 pt-0">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <UserAvatar
                src={avatar}
                name={p.full_name || authName}
                email={p.email || authEmail}
                className="h-24 w-24 border-4 border-background text-2xl shadow-xl sm:h-28 sm:w-28"
              />
              <div className="space-y-1.5 pb-1">
                <h1 className="text-2xl font-bold tracking-tight">{p.full_name || authName || "Your name"}</h1>
                <p className="text-sm font-semibold text-primary">{headline}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {locationLine}</span>
                  {p.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" strokeWidth={1.75} /> {p.email}</span>}
                  {p.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> {p.phone}</span>}
                </div>
              </div>
            </div>
            <SaveButton className="shrink-0" />
          </div>

          {/* Profile strength */}
          <div className="mt-5 rounded-xl border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold">Profile strength</span>
              <span className="font-bold text-primary">{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completeness < 100
                ? "Complete your profile for better matches and stronger applications."
                : "All set — your profile is complete. 🎉"}
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Target roles" value={p.desired_titles.length} />
            <Stat label="Locations" value={p.desired_locations.length || "Any"} />
            <Stat label="CV" value={p.cv_filename ? "Ready" : "—"} />
          </div>
        </CardContent>
      </Card>

      {/* ── About you ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <SectionIcon><UserRound className="h-4 w-4" strokeWidth={1.75} /></SectionIcon>
            About you
          </CardTitle>
          <CardDescription>How employers see you on applications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (shown as reply-to on applications)</Label>
            <Input id="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* ── What jobs you want ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <SectionIcon><Target className="h-4 w-4" strokeWidth={1.75} /></SectionIcon>
            What jobs you want
          </CardTitle>
          <CardDescription>Tune what we match and auto-apply to.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Desired roles / titles</Label>
            <ChipsInput values={p.desired_titles} onChange={(v) => set("desired_titles", v)}
              placeholder="e.g. Accountant, Driver, Sales Rep — Enter to add" />
          </div>
          <div className="space-y-1.5">
            <Label>Categories</Label>
            <ChipsInput values={p.desired_categories} onChange={(v) => set("desired_categories", v)}
              suggestions={catSuggest} placeholder="e.g. Finance, Logistics" />
          </div>
          <div className="space-y-1.5">
            <Label>Locations</Label>
            <ChipsInput values={p.desired_locations} onChange={(v) => set("desired_locations", v)}
              suggestions={LOCATIONS} placeholder="Leave empty for anywhere" />
          </div>
          <div className="space-y-1.5">
            <Label>Job types</Label>
            <ChipsInput values={p.desired_job_types} onChange={(v) => set("desired_job_types", v)}
              suggestions={TYPES} placeholder="e.g. Full Time" />
          </div>
          <div className="space-y-1.5">
            <Label>Extra keywords</Label>
            <ChipsInput values={p.keywords} onChange={(v) => set("keywords", v)}
              placeholder="skills, tools, anything to boost matches" />
          </div>
        </CardContent>
      </Card>

      {/* ── CV ───────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <SectionIcon><FileText className="h-4 w-4" strokeWidth={1.75} /></SectionIcon>
            CV
          </CardTitle>
          <CardDescription>Attached to every application you send. PDF or Word, under 8MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${p.cv_filename ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              <FileText className="h-4 w-4" strokeWidth={1.75} />
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
        </CardContent>
      </Card>

      {/* ── Extra application resources ──────────────────────────────────── */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2.5">
            <SectionIcon><Paperclip className="h-4 w-4" strokeWidth={1.75} /></SectionIcon>
            Extra resources for applications
          </CardTitle>
          <CardDescription>
            Add portfolio / LinkedIn / GitHub links and supporting documents (certificates,
            references, transcripts). These travel with your applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Links */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground" /> Links
            </Label>

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
              <Button type="button" variant="secondary" onClick={addLink}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {/* Files */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-sm">
              <Paperclip className="h-4 w-4 text-muted-foreground" /> Documents
            </Label>

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
                {resUploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  : <><Upload className="h-4 w-4" /> Add document</>}
                <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files?.[0] && uploadResourceFile(e.target.files[0])} />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Cover letter ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <SectionIcon><PenLine className="h-4 w-4" strokeWidth={1.75} /></SectionIcon>
            Cover letter
          </CardTitle>
          <CardDescription>Optional. Use {"{name}"}, {"{title}"}, {"{company}"} as placeholders. Leave blank to use a clean default.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea rows={7} value={p.cover_letter_template}
            onChange={(e) => set("cover_letter_template", e.target.value)}
            placeholder={"Optional. Use {name}, {title}, {company} as placeholders.\nLeave blank to use a clean default."} />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-[220px] space-y-1.5">
              <Label htmlFor="daily_cap">Daily auto-apply limit</Label>
              <Input id="daily_cap" type="number" min={0} max={500} value={p.daily_cap}
                onChange={(e) => set("daily_cap", Number(e.target.value))} />
            </div>
            <SaveButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
