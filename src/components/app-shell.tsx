"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Target, Send, Inbox, FileText, Crown, Settings, LogOut, Menu,
  Home, Sparkles, ClipboardCheck, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PwaInstall } from "@/components/pwa-install";
import NotificationBell from "@/app/_components/NotificationBell";
import { cn } from "@/lib/utils";

// Sidebar / drawer nav. Profile & Settings live in the top panel now, so they're
// intentionally absent here. `highlight` flags the Upgrade CTA.
const NAV: { href: string; label: string; Icon: LucideIcon; highlight?: boolean }[] = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/jobs", label: "All Jobs", Icon: Briefcase },
  { href: "/matches", label: "My Matches", Icon: Target },
  { href: "/quick-apply", label: "Quick Apply", Icon: Send },
  { href: "/applications", label: "Applications", Icon: Inbox },
  { href: "/resume", label: "CV Builder", Icon: FileText },
  { href: "/billing", label: "Upgrade", Icon: Crown, highlight: true },
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

// Section title shown in the top panel (brown), per route.
const PAGE_TITLES: { match: string; title: string }[] = [
  { match: "/jobs", title: "All Jobs" },
  { match: "/matches", title: "My Matches" },
  { match: "/quick-apply", title: "Quick Apply" },
  { match: "/applications", title: "Applications" },
  { match: "/resume", title: "CV Builder" },
  { match: "/billing", title: "Upgrade" },
  { match: "/settings", title: "Settings" },
  { match: "/profile", title: "Profile" },
  { match: "/onboarding", title: "Set up your profile" },
];
const titleFor = (path: string) =>
  path === "/" ? "Overview" : (PAGE_TITLES.find((p) => path.startsWith(p.match))?.title ?? "Feasters");

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Menu
      </p>
      {NAV.map(({ href, label, Icon, highlight }) => {
        const active = isActivePath(path, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary"
                : highlight
                  ? "text-amber-700 hover:bg-amber-50"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <Icon
              className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", highlight && !active && "text-amber-500")}
              strokeWidth={active ? 2.1 : 1.75}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
      <Image src="/logo.png" alt="Feasters" width={34} height={34} priority />
      <span className="text-lg font-extrabold tracking-tight">Feasters</span>
    </Link>
  );
}

function UserFooter() {
  const router = useRouter();
  const { email, name, avatar } = useUser();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };
  return (
    <div className="mt-auto space-y-2 border-t pt-3">
      <PwaInstall fullWidth />
      <Link href="/profile" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted">
        <UserAvatar src={avatar} name={name} email={email} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{name ?? "Your account"}</p>
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
        </div>
      </Link>
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

// Right-hand actions in the top panel: notifications, settings, profile avatar.
function TopBarActions() {
  const path = usePathname();
  const { email, name, avatar } = useUser();
  return (
    <div className="ml-auto flex items-center gap-1">
      <NotificationBell />
      <Link
        href="/settings"
        aria-label="Settings"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-accent",
          isActivePath(path, "/settings") ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Settings className="h-5 w-5" strokeWidth={1.75} />
      </Link>
      <Link
        href="/profile"
        aria-label="Profile"
        className={cn(
          "rounded-full ring-2 ring-offset-2 ring-offset-background transition hover:ring-primary/40",
          isActivePath(path, "/profile") ? "ring-primary/60" : "ring-transparent",
        )}
      >
        <UserAvatar src={avatar} name={name} email={email} className="h-9 w-9 text-xs" />
      </Link>
    </div>
  );
}

// Floating dim-gray tab bar — mobile + tablet only (hidden ≥ lg). The active
// item expands into an icon + label pill; the rest stay icon-only. The pill
// resizes with a spring and siblings reflow via framer-motion layout.
function BottomNav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  const activeIndex = Math.max(0, BOTTOM_NAV.findIndex(({ href }) => isActivePath(path, href)));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 safe-bottom lg:hidden">
      <nav className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#4b5158] to-[#363b41] p-1.5 shadow-[0_14px_34px_-10px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        {BOTTOM_NAV.map(({ href, label, Icon }, i) => {
          const active = i === activeIndex;
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={label}>
              <motion.div
                layout={!reduce}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-full transition-colors",
                  active ? "bg-[#1d2126] px-4 py-2.5" : "px-3.5 py-2.5 hover:bg-white/5",
                )}
              >
                <Icon
                  className={cn("h-[22px] w-[22px] shrink-0", active ? "text-white" : "text-white/70")}
                  strokeWidth={active ? 2.2 : 1.9}
                />
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      key="label"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, width: 0 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, width: "auto" }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, width: 0 }}
                      transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                      className="overflow-hidden whitespace-nowrap text-sm font-semibold text-white"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
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
  // Welcome / login / auth screens render without the app chrome.
  if (path === "/welcome" || path === "/login" || path.startsWith("/auth")) return <>{children}</>;
  const title = titleFor(path);
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col gap-1 border-r bg-gradient-to-b from-background to-muted/20 p-3 lg:flex">
        <Brand />
        <div className="my-1" />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Content column (sits right of the desktop sidebar) */}
      <div className="lg:pl-52">
        {/* Top panel — shown on every page: hamburger (mobile) + the section
            title (brown), and the profile / notifications / settings actions. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-1 p-3">
              <Brand />
              <div className="my-1" />
              <NavLinks onNavigate={() => setOpen(false)} />
              <UserFooter />
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-bold tracking-tight text-[#7c4a21] sm:text-lg">{title}</h1>

          <TopBarActions />
        </header>

        {/* Main content — extra bottom padding on mobile so the floating bar never overlaps */}
        <main className="pb-safe-nav lg:pb-0">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
