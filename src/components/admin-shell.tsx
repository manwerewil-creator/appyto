"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Standalone chrome for the control centre — deliberately NOT the user app
// shell. A dark, distinct header so it's unmistakably a separate, internal tool.
// There is no link to this area anywhere in the user app; you arrive by typing
// the URL and you only get past the gate with an owner email + password.
export default function AdminShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="Feasters" width={26} height={26} className="rounded" />
            <span className="font-extrabold tracking-tight">Feasters</span>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
              <ShieldCheck className="h-3 w-3" /> Admin
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {email && <span className="hidden max-w-[180px] truncate text-xs text-white/60 md:block">{email}</span>}
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to app</span></Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" onClick={signOut}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
