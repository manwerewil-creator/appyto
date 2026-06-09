// Real email sending via your own Gmail/SMTP. This is what makes "apply"
// actually apply — it sends a genuine application email from you to the
// employer's address listed on the job.

import nodemailer from "nodemailer";
import type { Job, Profile, Settings } from "./types";

export function makeTransport(s: Settings) {
  // One-click Gmail: authenticate with an OAuth2 refresh token — no password.
  // nodemailer fetches a fresh access token from the refresh token per send.
  if (s.auth_method === "google" && s.google_refresh_token) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: s.google_email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: s.google_refresh_token,
      },
    });
  }
  return nodemailer.createTransport({
    host: s.smtp_host,
    port: s.smtp_port,
    secure: s.smtp_port === 465,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  });
}

/** The address mail is sent from, for whichever method is active. */
export function fromAddress(s: Settings): string {
  return s.auth_method === "google" ? s.google_email : s.smtp_user;
}

/** Whether sending is actually set up, for either method. */
export function emailReady(s: Settings): boolean {
  return s.auth_method === "google"
    ? s.google_connected && !!s.google_refresh_token
    : s.smtp_verified;
}

export async function verifyTransport(s: Settings): Promise<{ ok: boolean; error?: string }> {
  try {
    await makeTransport(s).verify();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

export function buildEmail(job: Job, profile: Profile) {
  const subject = `Application: ${job.title}${job.company ? ` — ${job.company}` : ""}`;
  const tpl = profile.cover_letter_template?.trim();
  const body = tpl
    ? tpl
        .replaceAll("{title}", job.title)
        .replaceAll("{company}", job.company ?? "your company")
        .replaceAll("{name}", profile.full_name || "Applicant")
    : `Dear Hiring Manager,

I would like to apply for the ${job.title} position${job.company ? ` at ${job.company}` : ""}.
Please find my CV attached. I believe I am a strong fit and would welcome the
opportunity to discuss my application.

Kind regards,
${profile.full_name || "Applicant"}${profile.phone ? `\n${profile.phone}` : ""}${profile.email ? `\n${profile.email}` : ""}`;
  return { subject, body };
}

export interface SendArgs {
  settings: Settings;
  job: Job;
  profile: Profile;
  cv?: { filename: string; content: Buffer };
  override?: { subject?: string; body?: string };  // user-written custom email
}

export async function sendApplication({ settings, job, profile, cv, override }: SendArgs) {
  if (!job.apply_email) throw new Error("job has no apply email");
  const built = buildEmail(job, profile);
  const subject = override?.subject?.trim() || built.subject;
  const body = override?.body?.trim() || built.body;
  const from = fromAddress(settings);
  await makeTransport(settings).sendMail({
    from: profile.full_name ? `${profile.full_name} <${from}>` : from,
    replyTo: profile.email || undefined,
    to: job.apply_email,
    subject,
    text: body,
    attachments: cv ? [{ filename: cv.filename, content: cv.content }] : [],
  });
  return { subject, to: job.apply_email };
}
