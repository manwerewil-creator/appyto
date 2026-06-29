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
  // Personalisation: concrete facts about the applicant, drawn from their CV /
  // onboarding. When present they make the pitch specific instead of generic.
  headline?: string | null;     // e.g. "Senior Accountant" (CV headline / current role / desired title)
  skills?: string[] | null;     // a few real skill names from the CV builder
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
  // A bare, low-detail posting reads better with a short, to-the-point reply —
  // except for executive roles, where substance is still expected.
  if (req.terse && req.seniority !== "exec") return "concise";
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
 * A concrete, personalised "what I bring" line built from the applicant's real
 * details (CV headline + a couple of real skills). Returned as a spintax template
 * with [headline]/[skillA]/[skillB] tokens for the caller to spin + fill. When we
 * have something specific to say it replaces the generic pitch, so the email reads
 * like this person wrote it. Returns "" when we have nothing concrete.
 */
function personaTemplate(profile: ComposeProfile): string {
  const hasHeadline = !!(profile.headline ?? "").trim();
  const skillCount = (profile.skills ?? []).map((s) => (s ?? "").trim()).filter(Boolean).slice(0, 2).length;
  const skillPhrase = skillCount === 2 ? "[skillA] and [skillB]" : skillCount === 1 ? "[skillA]" : "";

  if (hasHeadline && skillPhrase) {
    return `{As a [headline],|With my background as a [headline],|Coming in as a [headline],} I bring {hands-on|strong|practical|solid} ${skillPhrase} to {this role|the role|your team}.`;
  }
  if (hasHeadline) {
    return `{As a [headline], I know what a role like this needs.|My experience as a [headline] lines up closely with what you are looking for.|I have built my career as a [headline], and this role fits where I want to go next.}`;
  }
  if (skillPhrase) {
    return `I bring {hands-on|strong|practical|solid} ${skillPhrase}, which is {exactly what this role calls for|a close match for what you described|directly relevant here}.`;
  }
  return "";
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
  const skills = (profile.skills ?? []).map((s) => (s ?? "").trim()).filter(Boolean).slice(0, 2);
  const vars: Record<string, string> = {
    name,
    title: job.title || "the role",
    company: job.company || "your team",
    phone: profile.phone || "",
    email: profile.email || "",
    ref: requirements.referenceCode || "",
    headline: (profile.headline ?? "").trim(),
    skillA: skills[0] ?? "",
    skillB: skills[1] ?? "",
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
  // When we know real facts about the applicant, lead "what I bring" with them;
  // otherwise fall back to the tone's generic pitch.
  const personaTpl = personaTemplate(profile);
  const pitch = personaTpl
    ? fill(spin(personaTpl, rng), vars)
    : fill(spin(pick(bank.pitch, rng), rng), vars);
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
