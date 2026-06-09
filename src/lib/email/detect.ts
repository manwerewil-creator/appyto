// Application-requirement detection.
//
// Cold-outreach tooling reads each prospect and adapts the message. We do the
// equivalent for job adverts: scan the title + description and "feel out" what
// the employer is actually asking for, so the composed email and its attachments
// match the posting instead of being one-size-fits-all.

import type { Job } from "../types";

export type Seniority = "intern" | "junior" | "mid" | "senior" | "exec";
export type Sector =
  | "finance" | "legal" | "government" | "ngo"
  | "tech" | "creative" | "sales" | "health" | "education" | "general";

export interface Requirements {
  wantsCv: boolean;
  wantsCoverLetter: boolean;
  wantsPortfolio: boolean;
  wantsCertificates: boolean;
  wantsReferences: boolean;
  wantsId: boolean;
  applyVia: "email" | "url" | "instructions" | "unknown";
  referenceCode: string | null;   // a vacancy / reference code to quote
  subjectInBody: boolean;          // employer dictates an exact subject line
  deadline: string | null;         // raw deadline phrase, if found
  seniority: Seniority;
  sector: Sector;
}

function test(re: RegExp, ...s: string[]): boolean {
  return s.some((x) => re.test(x));
}

function detectSeniority(t: string): Seniority {
  if (/\b(intern(ship)?|attachment|graduate trainee|student)\b/.test(t)) return "intern";
  if (/\b(chief|head of|director|c[efo]o|executive|vp|general manager)\b/.test(t)) return "exec";
  if (/\b(senior|lead|principal|manager|supervisor)\b/.test(t)) return "senior";
  if (/\b(junior|entry[- ]level|assistant|trainee|graduate)\b/.test(t)) return "junior";
  return "mid";
}

function detectSector(t: string): Sector {
  if (/\b(account(ant|ing)|finance|financial|audit|tax|bank|teller|bookkeep|treasur)\b/.test(t)) return "finance";
  if (/\b(legal|lawyer|attorney|paralegal|advocate|compliance)\b/.test(t)) return "legal";
  if (/\b(government|ministry|council|public service|parastatal)\b/.test(t)) return "government";
  if (/\b(ngo|non[- ]?profit|humanitarian|donor|grant|relief)\b/.test(t)) return "ngo";
  if (/\b(developer|software|engineer|programmer|it |data|devops|qa|technician|network|system)\b/.test(t)) return "tech";
  if (/\b(design(er)?|creative|content|brand|video|photograph|writer|copywriter|ux|ui)\b/.test(t)) return "creative";
  if (/\b(sales|marketing|business development|account manager|retail|agent|promoter|merchandis)\b/.test(t)) return "sales";
  if (/\b(nurse|clinic|medical|health|doctor|pharmac|caregiver|patient)\b/.test(t)) return "health";
  if (/\b(teacher|lecturer|tutor|education|school|trainer)\b/.test(t)) return "education";
  return "general";
}

function findReferenceCode(t: string): string | null {
  // "quote reference XYZ", "ref: ABC/123", "vacancy no. 45", "position code HR-2"
  const m =
    t.match(/\b(?:ref(?:erence)?|vacancy|position|advert)\s*(?:code|no\.?|number|#|:)?\s*[:#]?\s*([A-Z][A-Z0-9][A-Z0-9/_.-]{1,16})\b/i) ||
    t.match(/\bquote\s+(?:the\s+)?(?:ref(?:erence)?|code)\s*[:#]?\s*([A-Z0-9][A-Z0-9/_.-]{1,16})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function findDeadline(t: string): string | null {
  const m =
    t.match(/\b(?:deadline|closing date|apply by|not later than|due)\s*[:\-]?\s*([^.\n]{3,40})/i) ||
    t.match(/\bby\s+(\d{1,2}\s+\w+\s+\d{4})/i);
  return m ? m[1].trim() : null;
}

/** Inspect a job and return the structured requirement profile. */
export function detectRequirements(job: Pick<Job, "title" | "description" | "apply_method" | "apply_url" | "apply_email">): Requirements {
  const title = (job.title ?? "").toLowerCase();
  const desc = (job.description ?? "").toLowerCase();
  const all = `${title} ${desc}`;

  const applyVia: Requirements["applyVia"] =
    job.apply_method === "email" || job.apply_email ? "email"
    : job.apply_method === "url" || job.apply_url ? "url"
    : job.apply_method === "instructions" ? "instructions"
    : "unknown";

  return {
    wantsCv: test(/\b(cv|résumé|resume|curriculum vitae)\b/, all) || applyVia === "email",
    wantsCoverLetter: test(/\b(cover(?:ing)? letter|motivation letter|letter of motivation|application letter)\b/, all),
    wantsPortfolio: test(/\b(portfolio|samples? of (?:your )?work|github|behance|dribbble|link to (?:your )?work|show(?:case)? your work|personal website)\b/, all),
    wantsCertificates: test(/\b(certificate|certified cop|academic (?:record|transcript|qualification)|proof of qualification|o[- ]?level|a[- ]?level|degree certificate)\b/, all),
    wantsReferences: test(/\b(referee|references?|recommendation letter)\b/, all),
    wantsId: test(/\b(national id|identity document|id copy|proof of identity)\b/, all),
    applyVia,
    referenceCode: findReferenceCode(`${job.title ?? ""} ${job.description ?? ""}`),
    subjectInBody: test(/\b(?:subject line|in the subject|email subject|subject should|use .{0,20} as the subject)\b/, all),
    deadline: findDeadline(`${job.title ?? ""} ${job.description ?? ""}`),
    seniority: detectSeniority(all),
    sector: detectSector(all),
  };
}
