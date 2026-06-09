// The adaptive composer. This is the "AI": pure, deterministic, algorithmic.
//
// It detects what the job needs, chooses a tone from the sector + seniority,
// then assembles a coherent email out of the corpus using a seeded spintax draw.
// Same job + same applicant => same email; different jobs => genuinely different
// emails, with the requirement-driven lines adapting to each posting.

import type { Job } from "../types";
import { hashSeed, mulberry32, spin, pick, type RNG } from "./spintax";
import { TONES, REQUIREMENT_LINES, type Tone } from "./corpus";
import { detectRequirements, type Requirements } from "./detect";

export interface ComposeProfile {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  hasResourceLinks?: boolean;   // does the user have portfolio/links saved?
  hasResourceFiles?: boolean;   // does the user have extra documents saved?
}

export interface ComposedEmail {
  subject: string;
  body: string;
  tone: Tone;
  requirements: Requirements;
}

/** Replace [token] placeholders after spinning (spintax uses {} so [] is safe). */
function fill(s: string, vars: Record<string, string>): string {
  return s.replace(/\[(\w+)\]/g, (_m, k: string) => vars[k] ?? "").replace(/[ \t]{2,}/g, " ").trim();
}

/** Map sector + seniority to a tone. Deterministic, with sensible overrides. */
export function chooseTone(req: Requirements): Tone {
  if (req.sector === "finance" || req.sector === "legal" || req.sector === "government" || req.sector === "ngo") {
    return req.seniority === "intern" || req.seniority === "junior" ? "warm" : "formal";
  }
  if (req.sector === "sales") return "enthusiastic";
  if (req.sector === "creative" || req.sector === "tech") return req.seniority === "intern" ? "warm" : "confident";
  if (req.sector === "health" || req.sector === "education") return "warm";
  if (req.seniority === "senior" || req.seniority === "exec") return "confident";
  if (req.seniority === "intern" || req.seniority === "junior") return "warm";
  return "confident";
}

/** Build the requirement-driven lines, adapting to the posting + the applicant. */
function requirementLines(req: Requirements, profile: ComposeProfile, rng: RNG): string[] {
  const lines: string[] = [];

  // Always acknowledge the CV when we apply by email (it gets attached).
  if (req.wantsCv) lines.push(pick(REQUIREMENT_LINES.cv, rng));
  if (req.wantsCoverLetter) lines.push(pick(REQUIREMENT_LINES.coverLetter, rng));

  // Only promise what the applicant actually has.
  if (req.wantsPortfolio && profile.hasResourceLinks) lines.push(pick(REQUIREMENT_LINES.portfolio, rng));
  if (req.wantsCertificates && profile.hasResourceFiles) lines.push(pick(REQUIREMENT_LINES.certificates, rng));
  if (req.wantsReferences) lines.push(pick(REQUIREMENT_LINES.references, rng));
  if (req.applyVia === "url") lines.push(pick(REQUIREMENT_LINES.applyUrl, rng));

  return lines;
}

/**
 * Compose one application email for a job. `seedSalt` lets callers fan out many
 * distinct variants (e.g. the 100-sample preview) from the same job.
 */
export function composeApplicationEmail(
  job: Pick<Job, "id" | "title" | "company" | "description" | "apply_method" | "apply_url" | "apply_email">,
  profile: ComposeProfile,
  opts: { seedSalt?: string } = {},
): ComposedEmail {
  const requirements = detectRequirements(job);
  const tone = chooseTone(requirements);
  const bank = TONES[tone];

  const seed = hashSeed(`${job.id}|${profile.email ?? ""}|${opts.seedSalt ?? ""}`);
  const rng = mulberry32(seed);

  const name = profile.full_name?.trim() || "Applicant";
  const vars: Record<string, string> = {
    name,
    title: job.title || "the role",
    company: job.company || "your team",
    phone: profile.phone || "",
    email: profile.email || "",
    ref: requirements.referenceCode || "",
  };

  // Subject. If the employer dictates a subject and gave a reference code, honour it.
  let subject = fill(spin(pick(bank.subjects, rng), rng), vars);
  if (requirements.subjectInBody && requirements.referenceCode) {
    subject = fill(`Application for [title] (Ref: [ref])`, vars);
  }
  subject = subject.replace(/\s{2,}/g, " ").trim();

  // Body assembly: greeting, hook, pitch, fit, requirement lines, ask, sign-off.
  const greeting = fill(spin(pick(bank.greetings, rng), rng), vars);
  const opener = fill(spin(pick(bank.openers, rng), rng), vars);
  const pitch = fill(spin(pick(bank.pitch, rng), rng), vars);
  const fitLine = fill(spin(pick(bank.fit, rng), rng), vars);
  const reqs = requirementLines(requirements, profile, rng).map((l) => fill(spin(l, rng), vars));
  const cta = fill(spin(pick(bank.cta, rng), rng), vars);
  const signoff = fill(spin(pick(bank.signoffs, rng), rng), vars);

  // A reference code, when present, leads the body so it is impossible to miss.
  const refLead = requirements.referenceCode && !requirements.subjectInBody
    ? `Reference: ${requirements.referenceCode}`
    : "";

  // Signature block (name, then any contact details the applicant provided).
  const sigLines = [name, vars.phone, vars.email].filter(Boolean);

  const paragraphs = [
    refLead,
    greeting,
    opener,
    pitch,
    fitLine,
    reqs.join(" "),
    cta,
    `${signoff}\n${sigLines.join("\n")}`,
  ].filter((p) => p && p.trim());

  const body = paragraphs.join("\n\n");

  return { subject, body, tone, requirements };
}

/** Fan out N distinct variants for a single job (used by the sample preview). */
export function generateVariants(
  job: Parameters<typeof composeApplicationEmail>[0],
  profile: ComposeProfile,
  n: number,
): ComposedEmail[] {
  return Array.from({ length: n }, (_, i) =>
    composeApplicationEmail(job, profile, { seedSalt: String(i) }),
  );
}
