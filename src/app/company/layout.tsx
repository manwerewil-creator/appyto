"use client";
import { ReactNode } from "react";
import AppShell, { NavItem } from "@/components/vb/app-shell";
import { Spinner } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";

const COMPANY_NAV: NavItem[] = [
  { href: "/company", label: "Home", icon: "home" },
  { href: "/company/post", label: "Post", icon: "plus" },
  { href: "/company/messages", label: "Messages", icon: "chat" },
  { href: "/company/profile", label: "Profile", icon: "building" },
];

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile({ requiredRole: "company" });

  if (loading || !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell
      title="Company"
      name={profile.company_name || profile.full_name || "Company"}
      nav={COMPANY_NAV}
    >
      {children}
    </AppShell>
  );
}
