"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AppUser {
  email: string | null;
  name: string | null;
  avatar: string | null;   // Google profile photo when signed in with Google
}

// Lightweight client hook for the signed-in user's display identity. Pulls
// name + avatar from the OAuth metadata (Google login provides both).
export function useUser(): AppUser {
  const [u, setU] = useState<AppUser>({ email: null, name: null, avatar: null });
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const m = (data.user?.user_metadata ?? {}) as Record<string, string | undefined>;
      setU({
        email: data.user?.email ?? null,
        name: m.full_name || m.name || null,
        avatar: m.avatar_url || m.picture || null,
      });
    });
  }, []);
  return u;
}
