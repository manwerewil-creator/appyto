// Generates 100 application emails with the live engine and writes them to
// data/email-samples.md for review. This is the SAME code path the app uses to
// send — proof the algorithm produces varied, human, job-adapted emails.
//
//   npm run emails:samples

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { composeApplicationEmail, type ComposeProfile } from "../src/lib/email/index";

type SampleJob = Parameters<typeof composeApplicationEmail>[0];

// A spread of realistic Zimbabwean postings across sectors, seniority levels,
// and requirement styles so the adaptivity is visible.
const JOBS: SampleJob[] = [
  {
    id: "sample:1", title: "Senior Accountant", company: "Delta Beverages",
    apply_method: "email", apply_email: "careers@delta.co.zw", apply_url: null,
    description: "We seek a qualified Senior Accountant. Send your CV and certified copies of your qualifications. Quote reference DB/FIN/204 in your application. Deadline 30 June 2026.",
  },
  {
    id: "sample:2", title: "Graphic Designer", company: "Pulse Media",
    apply_method: "email", apply_email: "jobs@pulsemedia.co.zw", apply_url: null,
    description: "Creative Graphic Designer wanted. Please share a link to your portfolio and samples of your work along with your CV.",
  },
  {
    id: "sample:3", title: "Sales Representative", company: "Econet",
    apply_method: "email", apply_email: "recruit@econet.co.zw", apply_url: null,
    description: "Driven Sales Representative to grow our retail base. Target driven, people person, ready to hit the ground running.",
  },
  {
    id: "sample:4", title: "Software Engineer", company: "Closinglock",
    apply_method: "email", apply_email: "hiring@closinglock.com", apply_url: null,
    description: "Software Engineer to build a secure platform. Strong fundamentals, ownership, ships quality code. Share your GitHub.",
  },
  {
    id: "sample:5", title: "Internship - Human Resources", company: "Old Mutual",
    apply_method: "email", apply_email: "hr@oldmutual.co.zw", apply_url: null,
    description: "HR intern / graduate trainee. Recent graduates welcome. Attach your CV and academic transcript.",
  },
  {
    id: "sample:6", title: "Registered Nurse", company: "Avenues Clinic",
    apply_method: "email", apply_email: "nursing@avenues.co.zw", apply_url: null,
    description: "Registered Nurse needed. Provide references and certified copies of your practising certificate.",
  },
  {
    id: "sample:7", title: "Legal Officer", company: "ZB Bank",
    apply_method: "email", apply_email: "legal.careers@zb.co.zw", apply_url: null,
    description: "Legal Officer (compliance). Application letter and CV required. Reference: ZB-LEG-11.",
  },
  {
    id: "sample:8", title: "Marketing Manager", company: "Nando's Zimbabwe",
    apply_method: "email", apply_email: "people@nandos.co.zw", apply_url: null,
    description: "Senior Marketing Manager to lead campaigns and grow the brand. Lead the team, own the numbers.",
  },
];

const PROFILE: ComposeProfile = {
  full_name: "Tatenda Moyo",
  email: "tatenda.moyo@gmail.com",
  phone: "+263 77 123 4567",
  hasResourceLinks: true,
  hasResourceFiles: true,
};

async function main() {
  const N = 100;
  const out: string[] = [
    "# 100 generated application emails",
    "",
    "_Produced by Featers' algorithmic email engine (seeded spintax, no LLM). Same code path used to send._",
    "",
  ];

  for (let i = 0; i < N; i++) {
    const job = JOBS[i % JOBS.length];
    const c = composeApplicationEmail(job, PROFILE, { seedSalt: String(i) });
    const flags = Object.entries(c.requirements)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
      .join(", ");
    out.push(
      `## ${i + 1}. ${job.title} — ${job.company}`,
      `**Tone:** ${c.tone}  |  **Detected:** ${flags || "none"}` +
        (c.requirements.referenceCode ? `  |  **Ref:** ${c.requirements.referenceCode}` : ""),
      "",
      `**Subject:** ${c.subject}`,
      "",
      "```",
      c.body,
      "```",
      "",
    );
  }

  const dir = path.resolve(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "email-samples.md");
  await writeFile(file, out.join("\n"), "utf8");
  console.log(`Wrote ${N} sample emails to ${file}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
