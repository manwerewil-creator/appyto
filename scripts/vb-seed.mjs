import { createClient } from "@supabase/supabase-js";

const URL = "https://onmakjxredjsyevnyjlb.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubWFranhyZWRqc3lldm55amxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTAwMzYsImV4cCI6MjA5MzcyNjAzNn0.WmlveJGdEq46reGxnYiaDzBlmV5TZXdZx2lf48qIvnM";

const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signUp(email, password, data) {
  const c = mk();
  let { data: su, error } = await c.auth.signUp({ email, password, options: { data } });
  if (error && !/registered/i.test(error.message)) throw error;
  let user = su?.user;
  if (!user) {
    const { data: si, error: e2 } = await c.auth.signInWithPassword({ email, password });
    if (e2) throw e2;
    user = si.user;
  } else {
    await c.auth.signInWithPassword({ email, password });
  }
  return { c, id: user.id };
}

const PW = "Passw0rd!";

async function run() {
  // Admin
  await signUp("admin@vb.demo", PW, { role: "admin", full_name: "Platform Admin" });
  console.log("admin ok");

  // University
  await signUp("placement@msu.demo", PW, { role: "university", full_name: "MSU Placement Office", company_name: "Midlands State University" });
  console.log("university ok");

  // Companies + opportunities
  const companies = [
    { email: "hr@econet.demo", name: "Econet Wireless", sector: "Telecommunications",
      opps: [
        { title: "Software Engineering Attachment", field: "Information Technology", location: "Harare", duration: "12 months", positions: 3, requirements: "Studying CS/IT; Java or Python; team player.", description: "Join our core engineering team building telecom platforms used by millions." },
        { title: "Network Operations Intern", field: "Engineering", location: "Bulawayo", duration: "8 months", positions: 2, requirements: "Telecoms/Electronic Engineering student.", description: "Monitor and optimise our national network operations centre." },
      ] },
    { email: "careers@cbz.demo", name: "CBZ Bank", sector: "Banking & Finance",
      opps: [
        { title: "Finance & Accounting Attachment", field: "Accounting", location: "Harare", duration: "12 months", positions: 4, requirements: "Accounting/Finance student; Excel; attention to detail.", description: "Rotate across treasury, audit and reporting functions." },
        { title: "Data Analytics Intern", field: "Information Technology", location: "Remote", duration: "6 months", positions: 1, requirements: "SQL, statistics, curiosity.", description: "Build dashboards that drive lending decisions." },
      ] },
    { email: "talent@delta.demo", name: "Delta Corporation", sector: "Manufacturing",
      opps: [
        { title: "Marketing Attachment", field: "Marketing", location: "Harare", duration: "12 months", positions: 2, requirements: "Marketing student; creative; social media savvy.", description: "Support brand campaigns for leading beverage brands." },
      ] },
  ];

  const allOpps = [];
  for (const co of companies) {
    const { c, id } = await signUp(co.email, PW, { role: "company", full_name: co.name, company_name: co.name });
    await c.from("vb_profiles").update({ company_sector: co.sector, company_verified: true, company_website: "https://example.com", phone: "+263 77 000 0000" }).eq("id", id);
    for (const o of co.opps) {
      const { data, error } = await c.from("vb_opportunities").insert({ company_id: id, status: "open", deadline: "2026-08-30", ...o }).select("id,title").single();
      if (error) throw error;
      allOpps.push({ ...data, company_id: id });
    }
    console.log("company ok:", co.name);
  }

  // Students
  const students = [
    { email: "tanaka@students.msu.demo", name: "Tanaka Moyo", program: "BSc Computer Science", year: "3", skills: "Java, React, SQL" },
    { email: "rudo@students.msu.demo", name: "Rudo Chikwava", program: "BCom Accounting", year: "3", skills: "Excel, IFRS, Audit" },
    { email: "farai@students.msu.demo", name: "Farai Ncube", program: "BSc Marketing", year: "4", skills: "Social media, Copywriting, Canva" },
  ];

  let applied = 0;
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const { c, id } = await signUp(s.email, PW, { role: "student", full_name: s.name });
    const cvPath = `${id}/cv.txt`;
    await c.storage.from("vb-documents").upload(cvPath, new Blob([`CURRICULUM VITAE\n${s.name}\n${s.program} — Year ${s.year}\nMidlands State University\nSkills: ${s.skills}`], { type: "text/plain" }), { upsert: true });
    const cvUrl = c.storage.from("vb-documents").getPublicUrl(cvPath).data.publicUrl;
    await c.from("vb_profiles").update({
      paid: true, university: "Midlands State University", program: s.program,
      year_of_study: s.year, skills: s.skills, phone: "+263 71 234 567" + i,
      bio: `Motivated ${s.program} student seeking industrial attachment.`,
      cv_url: cvUrl,
    }).eq("id", id);
    await c.from("vb_payments").insert({ student_id: id, amount: 10, currency: "USD", method: "EcoCash", reference: "VB-SEED-" + i, status: "completed" });
    // apply to two opportunities
    const targets = [allOpps[i], allOpps[(i + 1) % allOpps.length]];
    for (const t of targets) {
      const { error } = await c.from("vb_applications").insert({
        opportunity_id: t.id, student_id: id, status: i === 0 ? "shortlisted" : "pending",
        cover_note: `I am very interested in the ${t.title} role and believe my skills (${s.skills}) are a strong fit.`,
        cv_url: cvUrl,
      });
      if (!error) applied++;
    }
    console.log("student ok:", s.name);
  }
  console.log(`DONE. opportunities=${allOpps.length} applications=${applied}`);
}

run().catch((e) => { console.error("SEED ERROR:", e.message || e); process.exit(1); });
