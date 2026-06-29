"use client";
import { ReactNode } from "react";
import { PageLoader } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";

// Auth gate only — the unified Feasters shell provides the nav/chrome.
export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile({ requiredRole: "company" });
  if (loading || !profile) return <PageLoader />;
  return <div className="mx-auto max-w-5xl px-4 py-7 md:px-8 md:py-10">{children}</div>;
}
