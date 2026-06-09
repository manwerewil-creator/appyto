// Email sending for either method: the user's Gmail via OAuth2 (token) or SMTP
// app password. Credentials come from the `send_credentials` row, decrypted.

import nodemailer from "nodemailer";
import type { Job } from "./types";
import type { CredsRow } from "./data";
import { decrypt } from "./crypto";

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
  const subject = `Application: ${job.title}${job.company ? ` — ${job.company}` : ""}`;
  const tpl = profile.cover_letter_template?.trim();
  const body = tpl
    ? tpl.replaceAll("{title}", job.title).replaceAll("{company}", job.company ?? "your company").replaceAll("{name}", name)
    : `Dear Hiring Manager,

I would like to apply for the ${job.title} position${job.company ? ` at ${job.company}` : ""}.
Please find my CV attached. I believe I am a strong fit and would welcome the
opportunity to discuss my application.

Kind regards,
${name}${profile.phone ? `\n${profile.phone}` : ""}${profile.email ? `\n${profile.email}` : ""}`;
  return { subject, body };
}

export interface SendArgs {
  config: SendConfig;
  job: Job;
  profile: ProfileLike;
  cv?: { filename: string; content: Buffer };
  override?: { subject?: string; body?: string };
}

export async function sendApplication({ config, job, profile, cv, override }: SendArgs) {
  if (!job.apply_email) throw new Error("job has no apply email");
  const built = buildEmail(job, profile);
  const subject = override?.subject?.trim() || built.subject;
  const body = override?.body?.trim() || built.body;
  await makeTransport(config).sendMail({
    from: profile.full_name ? `${profile.full_name} <${config.fromEmail}>` : config.fromEmail,
    replyTo: profile.email || undefined,
    to: job.apply_email,
    subject, text: body,
    attachments: cv ? [{ filename: cv.filename, content: cv.content }] : [],
  });
  return { subject, to: job.apply_email };
}
