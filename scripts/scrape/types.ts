// Normalized shape that both source adapters emit and the store layer persists.
// Mirrors the `public.jobs` columns in supabase/schema.sql.

export type ApplyMethod = "email" | "url" | "instructions" | "unknown";

export interface NormalizedJob {
  source: "jobszimbabwe" | "applynow";
  source_uid: string;
  url: string;
  title: string;
  company: string | null;
  location: string | null;
  category: string | null;
  job_type: string | null;
  tags: string[];
  description: string;        // cleaned plain text
  description_html: string;   // original rendered HTML
  apply_email: string | null;
  apply_url: string | null;
  apply_method: ApplyMethod;
  salary: string | null;
  posted_at: string | null;   // ISO
  closes_at: string | null;   // ISO
  is_open: boolean;
  raw: unknown;
}

// Subset of a WordPress REST post/CPT object we rely on.
export interface WpPost {
  id: number;
  date_gmt?: string;
  modified_gmt?: string;
  slug: string;
  status: string;
  link: string;
  type: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  _closing?: number; // jobszimbabwe noo_job: unix seconds when posting closes
  _embedded?: {
    "wp:term"?: Array<Array<{ taxonomy: string; name: string; slug: string }>>;
    author?: Array<{ name?: string }>;
  };
  [k: string]: unknown;
}
