"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Target, Send, Inbox, FileText, Crown, Settings, LogOut, Menu,
  Home, Sparkles, ClipboardCheck, Search, MessageSquare, User, PlusCircle, Building2,
  GraduationCap, BarChart3, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PwaInstall } from "@/components/pwa-install";
import NotificationBell from "@/app/_components/NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; Icon: LucideIcon; highlight?: boolean };
type Mode = "seeker" | "student" | "company" | "university";

// One app, many modes. The nav adapts to which part of the product you're in —
// the per-area auth gate (useProfile) guarantees only the right role can be here,
// so the path alone determines the mode (no extra round-trip).
const NAV: Record<Mode, NavItem[]> = {
  seeker: [
    { href: "/", label: "Overview", Icon: LayoutDashboard },
    { href: "/jobs", label: "All Jobs", Icon: Briefcase },
    { href: "/matches", label: "My Matches", Icon: Target },
    { href: "/quick-apply", label: "Quick Apply", Icon: Send },
    { href: "/applications", label: "Applications", Icon: Inbox },
    { href: "/resume", label: "CV Builder", Icon: FileText },
    { href: "/billing", label: "Upgrade", Icon: Crown, highlight: true },
  ],
  student: [
    { href: "/student", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/student/browse", label: "Internships", Icon: Search },
    { href: "/student/applications", label: "Applications", Icon: Inbox },
    { href: "/student/messages", label: "Messages", Icon: MessageSquare },
    { href: "/student/profile", label: "Profile", Icon: User },
  ],
  company: [
    { href: "/company", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/company/post", label: "Post a role", Icon: PlusCircle },
    { href: "/company/messages", label: "Messages", Icon: MessageSquare },
    { href: "/company/profile", label: "Company", Icon: Building2 },
  ],
  university: [
    { href: "/university", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/university/students", label: "Students", Icon: GraduationCap },
    { href: "/university/reports", label: "Reports", Icon: BarChart3 },
  ],
};

// Mobile bottom bar per mode (max 5).
const BOTTOM: Record<Mode, NavItem[]> = {
  seeker: [
    { href: "/", label: "Home", Icon: Home },
    { href: "/jobs", label: "Jobs", Icon: Briefcase },
    { href: "/matches", label: "Matches", Icon: Sparkles },
    { href: "/quick-apply", label: "Apply", Icon: Send },
    { href: "/applications", label: "Applied", Icon: ClipboardCheck },
  ],
  student: NAV.student,
  company: NAV.company,
  university: NAV.university,
};

const HOME: Record<Mode, string> = { seeker: "/", student: "/student", company: "/company", university: "/university" };
const PROFILE_HREF: Record<Mode, string> = {
  seeker: "/profile", student: "/student/profile", company: "/company/profile", university: "/university",
};

function modeFor(path: string): Mode {
  if (path.startsWith("/student")) return "student";
  if (path.startsWith("/company")) return "company";
  if (path.startsWith("/university")) return "university";
  return "seeker";
}

const isActivePath = (path: string, href: string) =>
  href === "/" || href === "/student" || href === "/company" || href === "/university"
    ? path === href
    : path.startsWith(href);

// Section title shown in the top panel (brown). Most-specific paths first.
const PAGE_TITLES: { match: string; title: string }[] = [
  { match: "/jobs", title: "All Jobs" },
  { match: "/matches", title: "My Matches" },
  { match: "/quick-apply", title: "Quick Apply" },
  { match: "/applications", title: "Applications" },
  { match: "/resume", title: "CV Builder" },
  { match: "/billing", title: "Upgrade" },
  { match: "/settings", title: "Settings" },
  { match: "/onboarding", title: "Set up your profile" },
  { match: "/student/browse", title: "Internships" },
  { match: "/student/applications", title: "Applications" },
  { match: "/student/messages", title: "Messages" },
  { match: "/student/opportunity", title: "Internship" },
  { match: "/student/profile", title: "Profile" },
  { match: "/student", title: "Dashboard" },
  { match: "/company/post", title: "Post a role" },
  { match: "/company/messages", title: "Messages" },
  { match: "/company/opportunity", title: "Applicants" },
  { match: "/company/profile", title: "Company profile" },
  { match: "/company", title: "Dashboard" },
  { match: "/university/students", title: "Students" },
  { match: "/university/reports", title: "Reports" },
  { match: "/university", title: "Dashboard" },
  { match: "/profile", title: "Profile" },
];
const titleFor = (path: string) =>
  path === "/" ? "Overview" : (PAGE_TITLES.find((p) => path.startsWith(p.match))?.title ?? "Feasters");

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Menu
      </p>
      {items.map(({ href, label, Icon, highlight }) => {
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

function Brand({ home }: { home: string }) {
  return (
    <Link href={home} className="flex items-center gap-2.5 px-2 py-1">
      <Image src="/logo.png" alt="Feasters" width={34} height={34} priority />
      <span className="text-lg font-extrabold tracking-tight">Feasters</span>
    </Link>
  );
}

function UserFooter({ profileHref }: { profileHref: string }) {
  const router = useRouter();
  const { email, name, avatar } = useUser();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };
  return (
    <div className="mt-auto space-y-2 border-t pt-3">
      <PwaInstall fullWidth />
      <Link href={profileHref} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted">
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

// Right-hand actions in the top panel. The notifications + email settings are
// job-seeker features, so they only show in seeker mode; the avatar links to the
// right profile for the current mode.
function TopBarActions({ mode, profileHref }: { mode: Mode; profileHref: string }) {
  const path = usePathname();
  const { email, name, avatar } = useUser();
  return (
    <div className="ml-auto flex items-center gap-1">
      {mode === "seeker" && <NotificationBell />}
      {mode === "seeker" && (
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
      )}
      <Link
        href={profileHref}
        aria-label="Profile"
        className={cn(
          "rounded-full ring-2 ring-offset-2 ring-offset-background transition hover:ring-primary/40",
          path.startsWith(profileHref) ? "ring-primary/60" : "ring-transparent",
        )}
      >
        <UserAvatar src={avatar} name={name} email={email} className="h-9 w-9 text-xs" />
      </Link>
    </div>
  );
}

// Flat, full-width bottom tab bar — mobile + tablet only (hidden ≥ lg).
function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const activeIndex = Math.max(0, items.findIndex(({ href }) => isActivePath(path, href)));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden">
      <div className="safe-bottom flex items-stretch justify-around">
        {items.map(({ href, label, Icon }, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-1/2 top-0 h-0.5 w-7 -translate-x-1/2 rounded-full bg-primary" />}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Screens that render WITHOUT the app shell: pre-auth (welcome/login/register),
  // the focused checkout (/pay), the OAuth callback, and the owner control centre
  // (/admin has its own shell). Everything else — job-seeker AND the internship
  // modes — shares this one role-adaptive shell.
  const bare = ["/welcome", "/login", "/register", "/pay"];
  if (path.startsWith("/auth") || path.startsWith("/admin") || bare.some((p) => path === p || path.startsWith(p + "/")))
    return <>{children}</>;

  const mode = modeFor(path);
  const items = NAV[mode];
  const bottom = BOTTOM[mode];
  const home = HOME[mode];
  const profileHref = PROFILE_HREF[mode];
  const title = titleFor(path);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col gap-1 border-r bg-gradient-to-b from-background to-muted/20 p-3 lg:flex">
        <Brand home={home} />
        <div className="my-1" />
        <NavLinks items={items} />
        <UserFooter profileHref={profileHref} />
      </aside>

      {/* Content column (sits right of the desktop sidebar) */}
      <div className="lg:pl-52">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-1 p-3">
              <Brand home={home} />
              <div className="my-1" />
              <NavLinks items={items} onNavigate={() => setOpen(false)} />
              <UserFooter profileHref={profileHref} />
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-bold tracking-tight text-[#7c4a21] sm:text-lg">{title}</h1>

          <TopBarActions mode={mode} profileHref={profileHref} />
        </header>

        {/* Main content — reserves space for the fixed bottom bar on mobile */}
        <main className="pb-safe-nav lg:pb-0">{children}</main>
      </div>

      <BottomNav items={bottom} />
    </div>
  );
}
