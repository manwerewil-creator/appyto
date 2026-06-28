"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/vb/types";

// Client guard: loads the signed-in user's profile.
// Pass requiredRole to enforce a role; requirePaid to gate students behind the $10 fee.
export function useProfile(opts?: { requiredRole?: Role; requirePaid?: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("vb_profiles").select("*").eq("id", user.id).single();
      if (!active) return;
      const p = data as Profile | null;
      if (!p) { router.replace("/login"); return; }
      if (opts?.requiredRole && p.role !== opts.requiredRole) {
        router.replace(
          p.role === "company" ? "/company" :
          p.role === "university" ? "/university" :
          p.role === "admin" ? "/admin" : "/student"
        );
        return;
      }
      if (opts?.requirePaid && p.role === "student" && !p.paid) { router.replace("/pay"); return; }
      setProfile(p);
      setLoading(false);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, loading, supabase };
}
