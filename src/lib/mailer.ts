// Email sending for either method: the user's Gmail via OAuth2 (token) or SMTP
// app password. Credentials come from the `send_credentials` row, decrypted.

import nodemailer from "nodemailer";
import type { Job, ResourceLink, ResourceFile } from "./types";
import type { CredsRow } from "./data";
import type { Resume } from "./resume";
import { decrypt } from "./crypto";
import { composeApplicationEmail } from "./email";

export interface SendConfig {
  method: "smtp" | "google";
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpPass?: string;
  googleRefresh?: string;
}

export interface ProfileLike {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  cover_letter_template?: string | null;
  resources?: ResourceLink[] | null;       // extra links appended to every application
  resource_files?: ResourceFile[] | null;  // extra documents attached to applications
  resume?: Resume | null;                   // CV builder doc — source of headline + real skills
  desired_titles?: string[] | null;         // onboarding fallback for a headline
}

/** Pull concrete personalisation (headline + a few real skills) from the profile. */
function derivePersona(profile: ProfileLike): { headline: string; skills: string[] } {
  const r = profile.resume;
  const headline =
    r?.headline?.trim() ||
    r?.experience?.[0]?.role?.trim() ||
    profile.desired_titles?.find((t) => t?.trim())?.trim() ||
    "";
  const skills = (r?.skills ?? [])
    .map((s) => s?.name?.trim())
    .filter((x): x is string => !!x)
    .slice(0, 3);
  return { headline, skills };
}

/** Render the user's extra links as a plain-text block, or "" if none. */
function linksBlock(resources?: ResourceLink[] | null): string {
  const links = (resources ?? []).filter((r) => r?.url);
  if (!links.length) return "";
  return "\n\nLinks:\n" + links.map((r) => `${r.label || "Link"}: ${r.url}`).join("\n");
}

/** Build a usable (decrypted) send config from a credentials row. */
export function credsToConfig(c: CredsRow): SendConfig {
  return {
    method: c.method,
    fromEmail: c.from_email ?? "",
    smtpHost: c.smtp_host,
    smtpPort: c.smtp_port,
    smtpPass: c.secret_enc ? decrypt(c.secret_enc) : undefined,
    googleRefresh: c.google_refresh_enc ? decrypt(c.google_refresh_enc) : undefined,
  };
}

/** Is sending actually set up for this credentials row? */
export function emailReady(c: CredsRow | null): boolean {
  if (!c) return false;
  return c.method === "google" ? !!c.google_refresh_enc : c.verified && !!c.secret_enc;
}

export function makeTransport(c: SendConfig) {
  if (c.method === "google" && c.googleRefresh) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2", user: c.fromEmail,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: c.googleRefresh,
      },
    });
  }
  return nodemailer.createTransport({
    host: c.smtpHost, port: c.smtpPort, secure: c.smtpPort === 465,
    auth: { user: c.fromEmail, pass: c.smtpPass },
  });
}

export async function verifyConfig(c: SendConfig): Promise<{ ok: boolean; error?: string }> {
  try { await makeTransport(c).verify(); return { ok: true }; }
  catch (err: any) { return { ok: false, error: String(err?.message ?? err) }; }
}

export function buildEmail(job: Job, profile: ProfileLike) {
  const name = profile.full_name || "Applicant";

  // If the user wrote their own template, honour it verbatim (their words win).
  const tpl = profile.cover_letter_template?.trim();
  if (tpl) {
    const subject = `Application for ${job.title}${job.company ? ` at ${job.company}` : ""}`;
    const body = tpl
      .replaceAll("{title}", job.title)
      .replaceAll("{company}", job.company ?? "your company")
      .replaceAll("{name}", name);
    return { subject, body };
  }

  // Otherwise use the algorithmic engine: tone + spintax, adapted to the job.
  const persona = derivePersona(profile);
  const composed = composeApplicationEmail(job, {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    hasResourceLinks: !!(profile.resources && profile.resources.length),
    hasResourceFiles: !!(profile.resource_files && profile.resource_files.length),
    headline: persona.headline,
    skills: persona.skills,
  });
  return { subject: composed.subject, body: composed.body };
}

export interface Attachment { filename: string; content: Buffer; }

export interface SendArgs {
  config: SendConfig;
  job: Job;
  profile: ProfileLike;
  cv?: Attachment;
  attachments?: Attachment[];   // extra resource documents
  override?: { subject?: string; body?: string };
}

export async function sendApplication({ config, job, profile, cv, attachments, override }: SendArgs) {
  if (!job.apply_email) throw new Error("job has no apply email");
  const built = buildEmail(job, profile);
  const subject = override?.subject?.trim() || built.subject;
  // Always append the user's extra links (portfolio, LinkedIn, …) to the body.
  const body = (override?.body?.trim() || built.body) + linksBlock(profile.resources);
  const files: Attachment[] = [
    ...(cv ? [cv] : []),
    ...(attachments ?? []),
  ];
  await makeTransport(config).sendMail({
    from: profile.full_name ? `${profile.full_name} <${config.fromEmail}>` : config.fromEmail,
    replyTo: profile.email || undefined,
    to: job.apply_email,
    subject, text: body,
    attachments: files.map((f) => ({ filename: f.filename, content: f.content })),
  });
  return { subject, to: job.apply_email };
}
