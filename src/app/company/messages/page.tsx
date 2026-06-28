"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/vb/use-profile";
import Messages from "@/components/vb/messages";
import { PageLoader } from "@/components/vb/ui";

function MessagesInner() {
  const { profile, loading } = useProfile({ requiredRole: "company" });
  const searchParams = useSearchParams();
  const peer = searchParams.get("peer") ?? undefined;

  if (loading || !profile) return <PageLoader />;

  return <Messages me={profile} initialPeerId={peer} />;
}

export default function CompanyMessagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MessagesInner />
    </Suspense>
  );
}
