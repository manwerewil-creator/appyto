"use client";
import { ReactNode } from "react";
import AppShell, { NavItem } from "@/components/vb/app-shell";
import { PageLoader } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Home", icon: "home" },
  { href: "/student/browse", label: "Browse", icon: "search" },
  { href: "/student/applications", label: "Applications", icon: "file" },
  { href: "/student/messages", label: "Messages", icon: "chat" },
  { href: "/student/profile", label: "Profile", icon: "user" },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile({ requiredRole: "student", requirePaid: true });

  if (loading || !profile) {
    return <PageLoader />;
  }

  return (
    <AppShell title="Student" name={profile.full_name || "Student"} nav={STUDENT_NAV}>
      {children}
    </AppShell>
  );
}
