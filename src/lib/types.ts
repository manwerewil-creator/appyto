// Shared types for the local-first app.

export interface Job {
  id: string;                 // `${source}:${source_uid}`
  source: "jobszimbabwe" | "applynow" | "custom";
  source_uid: string;
  url: string;
  title: string;
  company: string | null;
  location: string | null;
  category: string | null;
  job_type: string | null;
  tags: string[];
  description: string;
  apply_email: string | null;
  apply_url: string | null;
  apply_method: "email" | "url" | "instructions" | "unknown";
  salary: string | null;
  posted_at: string | null;
  closes_at: string | null;
  is_open: boolean;
  logo_url?: string | null;   // company logo (derived from the employer's email domain)
}

export interface JobPreferences {
  desired_titles: string[];
  desired_categories: string[];
  desired_locations: string[];
  desired_job_types: string[];
  keywords: string[];
}

/** A labeled link the user wants available on applications (portfolio, LinkedIn, …). */
export interface ResourceLink {
  label: string;
  url: string;
}

/** An extra document the user uploaded (certificate, reference, transcript, …). */
export interface ResourceFile {
  name: string;   // display / original filename
  path: string;   // Supabase Storage path under the "cvs" bucket
}

export interface Profile extends JobPreferences {
  full_name: string;
  email: string;
  phone: string;
  qualifications: string;         // free text — education, certs, experience level
  work_modes: string[];           // On-site (Zimbabwe), Remote, Freelance, Hybrid
  cv_filename: string | null;     // stored under data/cv/
  cover_letter_template: string;  // the user's own custom email template
  daily_cap: number;              // safety limit on auto-applies per day
  onboarded: boolean;
  auto_send: boolean;             // true = send instantly on Apply; false = preview & edit first
  resources: ResourceLink[];      // extra links relevant to applications
  resource_files: ResourceFile[]; // extra uploaded documents
}

export interface Settings {
  // Which sending method is active.
  auth_method: "smtp" | "google";

  // App-password / generic SMTP
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;              // the From address (your Gmail)
  smtp_pass: string;              // Gmail App Password (local only)
  smtp_verified: boolean;

  // Google OAuth (one-click connect — no password). Tokens are local only;
  // encrypt them in a hosted/multi-user deployment.
  google_email: string;
  google_refresh_token: string;
  google_connected: boolean;
}

export type ApplicationStatus = "queued" | "sent" | "failed" | "skipped";

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string | null;
  to_email: string | null;
  status: ApplicationStatus;
  subject: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export const DEFAULT_PROFILE: Profile = {
  full_name: "",
  email: "",
  phone: "",
  qualifications: "",
  work_modes: [],
  cv_filename: null,
  cover_letter_template: "",
  daily_cap: 25,
  onboarded: false,
  auto_send: false,
  resources: [],
  resource_files: [],
  desired_titles: [],
  desired_categories: [],
  desired_locations: [],
  desired_job_types: [],
  keywords: [],
};

export const DEFAULT_SETTINGS: Settings = {
  auth_method: "smtp",
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_user: "",
  smtp_pass: "",
  smtp_verified: false,
  google_email: "",
  google_refresh_token: "",
  google_connected: false,
};
