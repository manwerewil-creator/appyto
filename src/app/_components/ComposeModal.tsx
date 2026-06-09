"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

export interface ComposeJob { id: string; title: string; apply_email: string | null; }

// A custom-email composer. Prefills the code-generated draft, but the user can
// rewrite it completely before sending — their words, their call.
export default function ComposeModal({
  job, onClose, onSent,
}: {
  job: ComposeJob;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/draft?job_id=${encodeURIComponent(job.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSubject(d.subject);
          setBody(d.body);
          const r = d.requirements ?? {};
          const labels: string[] = [];
          if (r.wantsCv) labels.push("CV");
          if (r.wantsCoverLetter) labels.push("Cover letter");
          if (r.wantsPortfolio) labels.push("Portfolio / links");
          if (r.wantsCertificates) labels.push("Certificates");
          if (r.wantsReferences) labels.push("References");
          if (r.wantsId) labels.push("ID copy");
          if (r.referenceCode) labels.push(`Ref: ${r.referenceCode}`);
          setReqs(labels);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [job.id]);

  const send = async () => {
    setSending(true); setError(null);
    const r = await fetch("/api/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id, custom_subject: subject, custom_body: body }),
    });
    const d = await r.json();
    setSending(false);
    if (d.ok) onSent(); else setError(d.reason ?? "Could not send.");
  };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-xl"
      >
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">Write your email</h3>
          <p className="text-sm text-muted-foreground">
            Applying to <span className="font-medium text-foreground">{job.title}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing draft…
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="compose-to">To</Label>
              <Input id="compose-to" value={job.apply_email ?? ""} disabled />
            </div>
            {reqs.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                <p className="mb-1.5 text-xs font-semibold text-foreground">This employer asked for:</p>
                <div className="flex flex-wrap gap-1.5">
                  {reqs.map((r) => (
                    <span key={r} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compose-body">
                Message (edit freely — this is exactly what gets sent)
              </Label>
              <Textarea
                id="compose-body"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your CV is attached automatically if you’ve uploaded one.
            </p>
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="success" onClick={send} disabled={sending || !job.apply_email}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send application
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
