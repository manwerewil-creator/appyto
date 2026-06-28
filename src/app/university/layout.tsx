"use client";
import { ReactNode } from "react";
import AppShell, { NavItem } from "@/components/vb/app-shell";
import { Spinner } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";

const UNI_NAV: NavItem[] = [
  { href: "/university", label: "Home", icon: "home" },
  { href: "/university/students", label: "Students", icon: "cap" },
  { href: "/university/reports", label: "Reports", icon: "chart" },
];

export default function UniversityLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile({ requiredRole: "university" });

  if (loading || !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell
      title="University"
      name={profile.company_name || profile.full_name || "University"}
      nav={UNI_NAV}
    >
      {children}
    </AppShell>
  );
}
