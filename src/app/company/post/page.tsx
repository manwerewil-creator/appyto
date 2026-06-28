"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/vb/use-profile";
import { Button, Card, Input, Textarea, Select, Eyebrow, PageLoader } from "@/components/vb/ui";

export default function PostPage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "company" });
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    title: "",
    field: "",
    location: "",
    duration: "",
    positions: "1",
    deadline: "",
    description: "",
    requirements: "",
  });

  if (loading || !profile) return <PageLoader />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.description.trim()) { setErr("Description is required."); return; }
    setErr("");
    setSaving(true);
    const { error } = await supabase.from("vb_opportunities").insert({
      company_id: profile.id,
      title: form.title.trim(),
      field: form.field || null,
      location: form.location || null,
      duration: form.duration || null,
      positions: parseInt(form.positions) || 1,
      deadline: form.deadline || null,
      description: form.description.trim(),
      requirements: form.requirements || null,
      status: "open",
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    router.push("/company");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Eyebrow>New listing</Eyebrow>
        <h2 className="text-xl font-extrabold tracking-tightest text-ink">Post a Vacancy</h2>
        <p className="text-sm text-dim">Fill in the details below to publish a new internship or job listing.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Role details</p>
          </div>
          <Input label="Job Title" placeholder="e.g. Software Engineering Intern" value={form.title} onChange={set("title")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Field / Industry" placeholder="e.g. Technology" value={form.field} onChange={set("field")} />
            <Input label="Location" placeholder="e.g. Nairobi or Remote" value={form.location} onChange={set("location")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Duration" placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} />
            <Input label="Positions" type="number" min="1" value={form.positions} onChange={set("positions")} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={set("deadline")} />
          </div>

          <div className="border-t border-line pt-5 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Description</p>
          </div>
          <Textarea label="Description" rows={5} placeholder="Describe the role, responsibilities, and what the intern will learn…" value={form.description} onChange={set("description")} required />
          <Textarea label="Requirements" rows={3} placeholder="Skills, qualifications, or experience needed…" value={form.requirements} onChange={set("requirements")} />

          {err && <p className="rounded-xl border border-danger/20 bg-red-50 px-4 py-2.5 text-sm text-danger">{err}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="primary" arrow disabled={saving}>
              {saving ? "Posting…" : "Post Vacancy"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
