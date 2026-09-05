"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Send, Paperclip, FileText, FileArchive, Image as ImageIcon, Link2, Eye, Pencil } from "lucide-react";

export interface ComposeJob { id: string; title: string; apply_email: string | null; }

interface Attachment { name: string; kind: string }
interface LinkItem { label: string; url: string }

// Pick an icon + colour for an attachment by file kind.
function fileIcon(kind: string) {
  if (kind === "zip" || kind === "rar" || kind === "7z") return { Icon: FileArchive, color: "text-emerald-600 bg-emerald-50" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(kind)) return { Icon: ImageIcon, color: "text-sky-600 bg-sky-50" };
  return { Icon: FileText, color: "text-rose-600 bg-rose-50" };
}

// Email composer + preview. Defaults to a clean, modern preview of exactly what
// gets sent; flip to Edit to rewrite the subject/body (their words, their call).
export default function ComposeModal({
  job, onClose, onSent,
}: {
  job: ComposeJob;
  onClose: () => void;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
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
          setAttachments(d.attachments ?? []);
          setLinks(d.links ?? []);
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
        } else {
          setError(d.error ?? "Couldn't prepare this email. You can still write it below.");
        }
        setLoading(false);
      })
      .catch(() => { setError("Couldn't prepare this email. Check your connection and try again."); setLoading(false); });
  }, [job.id]);

  const send = async () => {
    setSending(true); setError(null);
    // Always release the spinner, and never wait forever — a slow send or a
    // non-JSON error (e.g. a function timeout) must surface, not hang.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const r = await fetch("/api/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, custom_subject: subject, custom_body: body }),
        signal: ctrl.signal,
      });
      const d = await r.json().catch(() => ({ ok: false, reason: `Send failed (${r.status}). Please try again.` }));
      if (d.ok) onSent();
      else setError(d.reason ?? "Could not send.");
    } catch (e) {
      setError(
        (e as Error)?.name === "AbortError"
          ? "Sending took too long. Please check your connection and try again."
          : "Could not send. Please check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
      setSending(false);
    }
  };

  const paragraphs = body.split(/\n{2,}/).filter((p) => p.trim());

  // Staggered reveal for the preview, so the email "assembles" on screen.
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: 0.05 } },
  };
  const block: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your application</p>
            <p className="truncate text-sm text-muted-foreground">
              To <span className="font-medium text-foreground">{job.apply_email ?? "—"}</span>
            </p>
          </div>
          {/* Preview / Edit segmented control */}
          <div className="flex shrink-0 rounded-lg border bg-muted/40 p-0.5 text-sm">
            <button
              onClick={() => setMode("preview")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors",
                mode === "preview" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              onClick={() => setMode("edit")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors",
                mode === "edit" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing your email…
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 space-y-5 px-5 py-5">
              {mode === "preview" ? (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
                  {/* Headline = the job role, front and centre */}
                  <motion.div variants={block}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
                        Apply for {job.title}
                      </h2>
                      <span className="shrink-0 pt-1 text-xs text-muted-foreground">Just now</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/70">Subject:</span> {subject}
                    </p>
                  </motion.div>

                  {reqs.length > 0 && (
                    <motion.div variants={block} className="flex flex-wrap gap-1.5">
                      {reqs.map((r) => (
                        <span key={r} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {r}
                        </span>
                      ))}
                    </motion.div>
                  )}

                  {/* Body */}
                  <motion.div variants={block} className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
                    {paragraphs.map((p, i) => (
                      <p key={i} className="whitespace-pre-line">{p}</p>
                    ))}
                  </motion.div>

                  {/* Links that ride along */}
                  {links.length > 0 && (
                    <motion.div variants={block} className="space-y-2">
                      <p className="text-sm font-semibold">Links included</p>
                      <div className="space-y-1.5">
                        {links.map((l) => (
                          <div key={l.url} className="flex items-center gap-2 text-sm">
                            <Link2 className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-medium">{l.label}:</span>
                            <span className="truncate text-muted-foreground">{l.url}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Attachments, as file cards */}
                  {attachments.length > 0 && (
                    <motion.div variants={block} className="space-y-2 border-t pt-4">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Paperclip className="h-4 w-4" /> {attachments.length} {attachments.length === 1 ? "Attachment" : "Attachments"}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {attachments.map((a) => {
                          const { Icon, color } = fileIcon(a.kind);
                          return (
                            <div key={a.name} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", color)}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{a.name}</p>
                                <p className="text-xs uppercase text-muted-foreground">{a.kind}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="compose-to">To</Label>
                    <Input id="compose-to" value={job.apply_email ?? ""} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="compose-subject">Subject</Label>
                    <Input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="compose-body">Message (this is exactly what gets sent)</Label>
                    <Textarea id="compose-body" rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your CV and saved documents are attached automatically; saved links are added at the end.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t bg-background/95 px-5 py-3 backdrop-blur">
              {error ? (
                <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button variant="success" size="lg" className="min-w-[180px]" onClick={send} disabled={sending || !job.apply_email}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send application
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
