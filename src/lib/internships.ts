// Internships / attachments are not a separate product — they're just a slice of
// the same scraped job catalogue. This detector flags the early-career postings
// (internships, industrial attachments, graduate-trainee / apprenticeship roles)
// so we can surface them in their own section. Pure code, no external calls.
//
// "Attachment" / "industrial attachment" is the dominant Zimbabwean term for a
// student internship, so it carries the most weight here.
import type { Job } from "./types";

// Strong, unambiguous terms — safe to match anywhere, including the free-text
// description, without dragging in unrelated roles.
const STRONG =
  /\b(internship|internships|attachment|attachments|industrial\s+attachment|graduate\s+trainee|graduate\s+traineeship|apprenticeship|vacation\s+work|student\s+placement|attach[eé]e)\b/i;

// Shorter terms ("intern", "trainee", "apprentice") are only trusted in the
// structured fields (title / category / type / tags), where they're high-signal.
// Word boundaries keep "internal" / "international" / "internet" out.
const SHORT =
  /\b(intern|interns|internship|internships|trainee|trainees|apprentice|apprenticeship|attachment|attachments|industrial\s+attachment|graduate\s+trainee|vacation\s+work|student\s+placement)\b/i;

type JobLike = Pick<Job, "title" | "category" | "job_type" | "tags" | "description">;

export function isInternshipJob(job: JobLike): boolean {
  const meta = [job.title, job.category, job.job_type, (job.tags ?? []).join(" ")]
    .filter(Boolean)
    .join("  ");
  if (SHORT.test(meta)) return true;
  if (job.description && STRONG.test(job.description)) return true;
  return false;
}
