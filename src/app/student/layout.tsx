"use client";
import { ReactNode } from "react";
import { PageLoader } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";

// Auth gate only — the unified Feasters shell (components/app-shell) provides the
// nav/chrome. Students must be signed in as a paid student.
export default function StudentLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile({ requiredRole: "student", requirePaid: true });
  if (loading || !profile) return <PageLoader />;
  return <div className="mx-auto max-w-5xl px-4 py-7 md:px-8 md:py-10">{children}</div>;
}
