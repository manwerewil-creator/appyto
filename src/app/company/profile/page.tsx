"use client";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/vb/use-profile";
import { Button, Card, Input, Textarea, Badge, Eyebrow, PageLoader } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";

export default function CompanyProfilePage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "company" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    company_sector: "",
    company_website: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || "",
        company_sector: profile.company_sector || "",
        company_website: profile.company_website || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  if (loading || !profile) return <PageLoader />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const { error } = await supabase.from("vb_profiles").update({
      company_name: form.company_name || null,
      company_sector: form.company_sector || null,
      company_website: form.company_website || null,
      phone: form.phone || null,
      bio: form.bio || null,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Eyebrow>Account</Eyebrow>
          <h2 className="text-xl font-extrabold tracking-tightest text-ink">Company Profile</h2>
        </div>
        {profile.company_verified ? (
          <Badge tone="verified" icon="shield">Verified</Badge>
        ) : (
          <Badge tone="closed">Pending verification</Badge>
        )}
      </div>

      <Card className="p-6">
        <form onSubmit={save} className="space-y-5">
          <div className="flex items-center gap-3 pb-1">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-50 text-brand">
              <Icon name="building" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink">{profile.company_name || "Your company"}</p>
              <p className="text-sm text-dim">{profile.company_sector || "No sector set"}</p>
            </div>
          </div>

          <div className="border-t border-line pt-5 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Company details</p>
          </div>

          <Input label="Company Name" placeholder="Your company name" value={form.company_name} onChange={set("company_name")} />
          <Input label="Sector / Industry" placeholder="e.g. Technology, Finance" value={form.company_sector} onChange={set("company_sector")} />
          <Input label="Website" type="url" placeholder="https://yourcompany.com" value={form.company_website} onChange={set("company_website")} />
          <Input label="Phone" type="tel" placeholder="+254 700 000 000" value={form.phone} onChange={set("phone")} />
          <Textarea label="Bio / About" rows={4} placeholder="Tell students about your company, mission, and culture…" value={form.bio} onChange={set("bio")} />

          {err && (
            <p className="rounded-xl border border-danger/20 bg-red-50 px-4 py-2.5 text-sm text-danger">{err}</p>
          )}
          {saved && (
            <p className="flex items-center gap-2 text-sm text-grass-600">
              <Icon name="check" className="h-4 w-4" />
              Saved successfully
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" arrow disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
