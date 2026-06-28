"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/components/vb/ui";
import { Icon, IconName } from "@/components/vb/icons";

export type NavItem = { href: string; label: string; icon: IconName };

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-white">
        <Icon name="spark2" className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[17px] font-extrabold tracking-tightest text-ink">VisionBridge</span>
    </Link>
  );
}

export default function AppShell({
  title, nav, children, name,
}: { title: string; nav: NavItem[]; children: ReactNode; name?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const signOut = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <div className="min-h-[100dvh] bg-paper pb-24 md:pb-0">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-[244px] flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <div className="px-2"><Brand /></div>
        <span className="mt-8 px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{title}</span>
        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200",
                  active ? "bg-ink text-white shadow-soft" : "text-dim hover:bg-paper hover:text-ink")}>
                <Icon name={n.icon} className={cn("h-[18px] w-[18px]", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-dim transition-colors hover:bg-paper hover:text-ink">
          <Icon name="logout" className="h-[18px] w-[18px] opacity-70" /> Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-3 backdrop-blur-md md:hidden">
        <Brand />
        <button onClick={signOut} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full text-dim hover:bg-paper">
          <Icon name="logout" className="h-5 w-5" />
        </button>
      </header>

      <main className="md:pl-[244px]">
        <div className="mx-auto max-w-5xl px-4 py-7 md:px-10 md:py-12">
          {name && <p className="text-sm text-dim">Welcome back</p>}
          {name && <h1 className="mt-1 mb-7 text-[26px] font-extrabold tracking-tightest text-ink md:text-3xl">{name}</h1>}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-line bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={cn("flex min-w-[56px] flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold transition-colors",
                active ? "text-brand" : "text-faint")}>
              <Icon name={n.icon} className="h-[22px] w-[22px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
