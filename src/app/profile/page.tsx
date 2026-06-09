"use client";

import { useEffect, useState } from "react";
import ChipsInput from "../_components/ChipsInput";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Upload, Loader2, FileText } from "lucide-react";

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
