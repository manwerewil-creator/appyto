export type Role = "student" | "company" | "university" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  university: string | null;
  program: string | null;
  year_of_study: string | null;
  skills: string | null;
  bio: string | null;
  cv_url: string | null;
  paid: boolean;
  company_name: string | null;
  company_sector: string | null;
  company_website: string | null;
  company_verified: boolean;
  created_at: string;
};

export type Opportunity = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  location: string | null;
  field: string | null;
  positions: number | null;
  duration: string | null;
  requirements: string | null;
  deadline: string | null;
  status: "open" | "closed";
  created_at: string;
};

export type Application = {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: "pending" | "shortlisted" | "interview" | "accepted" | "rejected";
  cover_note: string | null;
  cv_url: string | null;
  applicant_name: string | null;
  created_at: string;
};

export const dashboardPath = (role: Role) =>
  role === "company" ? "/company" :
  role === "university" ? "/university" :
  role === "admin" ? "/admin" : "/student";
