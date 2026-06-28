"use client";
import { useProfile } from "@/lib/vb/use-profile";
import Messages from "@/components/vb/messages";
import { PageLoader } from "@/components/vb/ui";

export default function MessagesPage() {
  const { profile, loading } = useProfile({ requiredRole: "student" });

  if (loading || !profile) return <PageLoader />;

  return <Messages me={profile} />;
}
