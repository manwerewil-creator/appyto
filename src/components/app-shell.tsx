"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Target, Send, Inbox, FileText, User, Crown, Settings, LogOut, Menu,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
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
      <Image src="/logo.png" alt="Featers" width={30} height={30} className="rounded-lg" />
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
    <div className="mt-auto border-t pt-3">
      {email && <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{email}</p>}
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
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

      {/* Mobile top bar */}
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

      {/* Main content — pages provide their own header/padding */}
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
