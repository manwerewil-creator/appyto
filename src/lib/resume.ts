// Pure-code résumé model. No AI, no external template files — the templates are
// React + CSS that render this data onto an A4 sheet.

export type TemplateId = "classic" | "modern" | "sidebar" | "minimal";

export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;       // free text e.g. "Jan 2020"
  end: string;         // "Present" or "Dec 2023"
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  start: string;
  end: string;
}

export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5;   // for templates that draw rating bars
}

export interface Resume {
  // Identity
  full_name: string;
  headline: string;            // e.g. "Senior Accountant"
  photo: string;               // optional data URL (used by sidebar template)
  // Contact
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  // Body
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  achievements: string[];
  certifications: string[];
  languages: string[];
  // Presentation
  template: TemplateId;
  accent: string;              // hex accent colour
}

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: "classic",  name: "Classic",  blurb: "Serif, centered, ATS-friendly" },
  { id: "modern",   name: "Modern",   blurb: "Colour header, two columns" },
  { id: "sidebar",  name: "Sidebar",  blurb: "Photo + skill ratings" },
  { id: "minimal",  name: "Minimal",  blurb: "Clean, lots of whitespace" },
];

export const DEFAULT_RESUME: Resume = {
  full_name: "",
  headline: "",
  photo: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  achievements: [],
  certifications: [],
  languages: [],
  template: "modern",
  accent: "#2563eb",
};

// Shown as placeholder/sample so the live preview is never empty.
export const SAMPLE_RESUME: Resume = {
  full_name: "Taylor Parker",
  headline: "Senior Accountant",
  photo: "",
  email: "taylor.parker@gmail.com",
  phone: "+263 77 123 4567",
  location: "Harare, Zimbabwe",
  linkedin: "linkedin.com/in/tparker",
  website: "",
  summary:
    "Detail-oriented accountant with 8+ years across audit, payroll and financial reporting. Proven record of closing books faster and cutting reporting errors. Comfortable owning the full cycle for SMEs and large firms alike.",
  experience: [
    {
      role: "Senior Accountant", company: "Headhunters International", location: "Harare",
      start: "Jan 2021", end: "Present",
      bullets: [
        "Led monthly close for a 200-staff group, cutting close time from 12 to 5 days.",
        "Managed payroll and statutory returns (PAYE, NSSA, VAT) with zero penalties.",
        "Built cash-flow forecasts that improved working-capital decisions.",
      ],
    },
    {
      role: "Accountant", company: "Afi Investments", location: "Harare",
      start: "Mar 2017", end: "Dec 2020",
      bullets: [
        "Owned accounts payable/receivable for a portfolio of 40+ clients.",
        "Reconciled ledgers and prepared audit-ready financial statements.",
      ],
    },
  ],
  education: [
    { degree: "B.Acc (Hons) Accounting", institution: "University of Zimbabwe", location: "Harare", start: "2013", end: "2016" },
  ],
  skills: [
    { name: "Financial Reporting", level: 5 },
    { name: "Payroll & Tax", level: 5 },
    { name: "Auditing", level: 4 },
    { name: "Excel / Pastel / SAP", level: 4 },
    { name: "Cash-flow Forecasting", level: 3 },
  ],
  achievements: [
    "Cut group month-end close time by 58%.",
    "Recovered $40k in mis-posted supplier balances.",
  ],
  certifications: ["ACCA (Part-qualified)", "Certified Pastel Practitioner"],
  languages: ["English", "Shona"],
  template: "modern",
  accent: "#2563eb",
};
