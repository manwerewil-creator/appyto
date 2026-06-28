"use client";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/lib/vb/use-profile";
import { Card, Button, Input, Textarea, Select, PageLoader, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";

export default function ProfilePage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "student" });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setUniversity(profile.university || "");
    setProgram(profile.program || "");
    setYearOfStudy(profile.year_of_study || "");
    setSkills(profile.skills || "");
    setBio(profile.bio || "");
    setCvUrl(profile.cv_url);
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase
      .from("vb_profiles")
      .update({
        full_name: fullName,
        phone,
        university,
        program,
        year_of_study: yearOfStudy,
        skills,
        bio,
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaveMsg(error ? `Error: ${error.message}` : "Profile saved successfully.");
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${profile.id}/cv-${Date.now()}.${ext}`;
    setUploading(true);
    setUploadMsg("");
    const { error: upErr } = await supabase.storage.from("vb-documents").upload(path, file, { upsert: true });
    if (upErr) { setUploadMsg(`Upload failed: ${upErr.message}`); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("vb-documents").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const { error: dbErr } = await supabase.from("vb_profiles").update({ cv_url: publicUrl }).eq("id", profile.id);
    if (dbErr) { setUploadMsg(`Saved but DB update failed: ${dbErr.message}`); } else {
      setCvUrl(publicUrl);
      setUploadMsg("CV uploaded successfully.");
    }
    setUploading(false);
  };

  if (loading || !profile) return <PageLoader />;

  const saveMsgIsError = saveMsg.startsWith("Error");
  const uploadMsgIsError = uploadMsg.startsWith("Upload failed") || uploadMsg.startsWith("Saved but");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-6 space-y-5">
        <h2 className="font-extrabold tracking-tightest text-ink text-lg">Personal Details</h2>
        <div className="space-y-4">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="University" value={university} onChange={(e) => setUniversity(e.target.value)} />
          <Input label="Program / Major" value={program} onChange={(e) => setProgram(e.target.value)} />
          <Select label="Year of study" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)}>
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year+</option>
            <option value="postgrad">Postgraduate</option>
          </Select>
          <Input
            label="Skills (comma separated)"
            placeholder="e.g. Python, Data Analysis, Communication"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <Textarea
            label="Bio"
            rows={4}
            placeholder="A short introduction about yourself…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        {saveMsg && (
          <p className={cn("text-sm font-medium", saveMsgIsError ? "text-danger" : "text-grass-600")}>
            {saveMsg}
          </p>
        )}
        <Button type="button" variant="primary" onClick={handleSave} disabled={saving} className="w-full" arrow>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-extrabold tracking-tightest text-ink text-lg">CV / Resume</h2>

        {cvUrl ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand hover:underline underline-offset-2 truncate min-w-0"
            >
              <Icon name="file" className="h-4 w-4 shrink-0" />
              <span className="truncate">View current CV</span>
              <Icon name="external" className="h-3.5 w-3.5 shrink-0" />
            </a>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              Replace
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-dim">
            <Icon name="upload" className="h-5 w-5 shrink-0 text-faint" />
            No CV uploaded yet.
          </div>
        )}

        <Button
          type="button"
          variant={cvUrl ? "ghost" : "accent"}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          arrow={!cvUrl}
        >
          <Icon name="upload" className="h-4 w-4" />
          {uploading ? "Uploading…" : cvUrl ? "Upload new CV" : "Upload CV"}
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleCvUpload}
        />

        {uploadMsg && (
          <p className={cn("text-sm font-medium", uploadMsgIsError ? "text-danger" : "text-grass-600")}>
            {uploadMsg}
          </p>
        )}
      </Card>
    </div>
  );
}
