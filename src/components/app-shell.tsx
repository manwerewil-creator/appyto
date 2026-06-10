"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Target, Send, Inbox, FileText, User, Crown, Settings, LogOut, Menu,
  Home, Sparkles, ClipboardCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PwaInstall } from "@/components/pwa-install";
import { cn } from "@/lib/utils";

// Full navigation — used by the desktop sidebar and the mobile drawer.
const NAV = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/jobs", label: "All Jobs", Icon: Briefcase },
  { href: "/matches", label: "My Matches", Icon: Target },
  { href: "/quick-apply", label: "Quick Apply", Icon: Send },
  { href: "/applications", label: "Applications", Icon: Inbox },
  { href: "/resume", label: "CV Builder", Icon: FileText },
  { href: "/profile", label: "Profile & CV", Icon: User },
  { href: "/billing", label: "Upgrade", Icon: Crown },
  { href: "/settings", label: "Settings", Icon: Settings },
];

// The 4 essentials for the mobile/tablet liquid-glass bottom bar — the core
// job-application loop: see your dashboard → matches → apply → track.
const BOTTOM_NAV = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/matches", label: "Matches", Icon: Sparkles },
  { href: "/quick-apply", label: "Apply", Icon: Send },
  { href: "/applications", label: "Applied", Icon: ClipboardCheck },
];

const isActivePath = (path: string, href: string) =>
  href === "/" ? path === "/" : path.startsWith(href);

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActivePath(path, href)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
      <Image src="/icon.svg" alt="Featers" width={32} height={32} className="rounded-lg" priority />
      <span className="text-lg font-extrabold tracking-tight">Featers</span>
    </Link>
  );
}

function UserFooter() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };
  return (
    <div className="mt-auto space-y-2 border-t pt-3">
      <PwaInstall fullWidth />
      {email && <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>}
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

// Floating liquid-glass tab bar — mobile + tablet only (hidden ≥ lg).
// A single highlight pill slides (with a spring) between tabs instead of each
// item toggling its own background, so switching sections feels continuous.
function BottomNav() {
  const path = usePathname();
  const activeIndex = Math.max(0, BOTTOM_NAV.findIndex(({ href }) => isActivePath(path, href)));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 safe-bottom lg:hidden">
      <nav className="lg-glass pointer-events-auto relative flex w-full max-w-md items-stretch rounded-[28px] p-2">
        {/* Sliding active indicator — width = one slot, translated to the active tab. */}
        <span
          aria-hidden
          className="lg-pill lg-slide absolute inset-y-2 left-2 rounded-[20px]"
          style={{
            width: `calc((100% - 1rem) / ${BOTTOM_NAV.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {BOTTOM_NAV.map(({ href, label, Icon }, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] py-1.5 text-center"
            >
              <Icon
                className={cn(
                  "lg-anim h-[22px] w-[22px]",
                  active ? "scale-110 text-white" : "text-primary/80",
                )}
              />
              <span
                className={cn(
                  "lg-anim text-[10px] font-semibold leading-none",
                  active ? "text-white" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // Login / auth screens render without the app chrome.
  if (path === "/login" || path.startsWith("/auth")) return <>{children}</>;
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-1 border-r bg-background p-3 lg:flex">
        <Brand />
        <div className="my-2" />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile / tablet top bar (full nav via drawer) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-1 p-3">
            <Brand />
            <div className="my-2" />
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserFooter />
          </SheetContent>
        </Sheet>
        <Brand />
      </header>

      {/* Main content — extra bottom padding on mobile so the floating bar never overlaps */}
      <main className="pb-safe-nav lg:pl-64 lg:pb-0">{children}</main>

      <BottomNav />
    </div>
  );
}
