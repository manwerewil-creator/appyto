"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ChipsInput from "../_components/ChipsInput";
import type { Profile, ResourceLink, ResourceFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Upload, Loader2, FileText, Plus, Trash2, Link2, Paperclip, X } from "lucide-react";

const LOCATIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Chitungwiza", "Remote"];
const TYPES = ["Full Time", "Contract", "Part Time", "Internship", "Temporary"];

export default function ProfilePage() {
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
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile &amp; CV</h1>
          <p className="text-sm text-muted-foreground">Used to match jobs and fill your applications</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const SaveButton = () => (
    <Button onClick={save} variant={saved ? "success" : "default"}>
      {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile &amp; CV</h1>
          <p className="text-sm text-muted-foreground">Used to match jobs and fill your applications</p>
        </div>
        <SaveButton />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>What jobs you want</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>CV</CardTitle>
            <CardDescription>Attached to every application you send. PDF or Word, under 8MB.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              {p.cv_filename ? <span>Current: <span className="font-medium text-foreground">{p.cv_filename}</span></span> : <span>No CV uploaded yet</span>}
            </div>
            <Button asChild variant="outline" disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> {p.cv_filename ? "Replace" : "Upload CV"}</>}
                <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
              </label>
            </Button>
          </CardContent>
        </Card>

        {/* ── Extra application resources ──────────────────────────────── */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Paperclip className="h-4 w-4" />
              </span>
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

              {p.resources.length > 0 && (
                <ul className="grid gap-2">
                  {p.resources.map((r, i) => (
                    <li
                      key={`${r.url}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.label}</p>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary underline-offset-4 hover:underline"
                        >
                          {r.url}
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLink(i)} title="Remove link">
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <Input
                  placeholder="Label (e.g. Portfolio)"
                  value={newLink.label}
                  onChange={(e) => setNewLink((n) => ({ ...n, label: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                />
                <Input
                  placeholder="https://…"
                  value={newLink.url}
                  onChange={(e) => setNewLink((n) => ({ ...n, url: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                />
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
                    <li
                      key={f.path}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium">{f.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeResourceFile(f.path)} title="Remove document">
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

        <Card>
          <CardHeader>
            <CardTitle>Cover letter</CardTitle>
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
    </div>
  );
}
