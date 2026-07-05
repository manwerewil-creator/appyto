"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../_components/usePwaInstall";
import {
  Download, Share, SquarePlus, Check, Briefcase, Send, Menu, Bell, Settings,
  MapPin, CalendarDays, FileText, X, Heart, Home, Sparkles, ClipboardCheck, Wifi, Mail,
} from "lucide-react";

// WebGL scene — client + browser only, dynamically imported so it never
// touches the server render.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * First-touch landing at feasters.cloud. Feasters is a PWA — this page sells the
 * app and gets it installed on the phone (native prompt on Android, guided
 * "Add to Home Screen" on iOS), so people use it as a standalone app, not a tab.
 * The only path forward is installing — there is no "continue in the browser"
 * bypass link anywhere on this page, by design.
 *
 * Structure (Cal AI / Apple product-page pattern): dark confident split hero
 * (copy left, phone + 3D shape backdrop right) → alternating light
 * feature-walkthrough sections, each pairing one real feature with one
 * phone-screen mockup → dark closing CTA band. No fabricated ratings/
 * testimonials — Feasters doesn't have real ones yet to show.
 */
export default function WelcomePage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { canInstall, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const primaryLabel = isStandalone
    ? "Open Feasters"
    : canInstall
      ? "Install the app"
      : isIOS
        ? "Add to Home Screen"
        : "Install the app";

  const onPrimary = async () => {
    if (isStandalone) { router.push("/login"); return; }
    if (canInstall) {
      setBusy(true);
      const r = await promptInstall();
      setBusy(false);
      if (r === "accepted") toast.success("Installing Feasters — open it from your home screen.");
      else if (r === "dismissed") toast("No problem — you can install anytime from here.");
      return;
    }
    if (isIOS) { setIosOpen(true); return; }
    // Desktop browser without install support (e.g. Firefox, desktop Safari):
    // no bypass link to the web app — just point them at a browser that can install it.
    toast("Open this page in Chrome, Edge, or on your phone to install Feasters.");
  };

  const reveal = reduce
    ? {}
    : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const } };

  return (
    <div className="w-full overflow-x-hidden bg-white text-neutral-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e0d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Feasters" width={28} height={28} className="h-7 w-7" />
            <span className="text-[15px] font-extrabold tracking-tight text-white">Feasters</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      {/* HERO — dark, confident, split layout: copy left, phone + 3D shapes right */}
      <section className="relative overflow-hidden bg-[#0a0e0d] px-6 py-16 text-white sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#159e8c]/15 blur-[110px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-[-10%] h-72 w-72 rounded-full bg-[#159e8c]/10 blur-[90px]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* copy */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.span
              {...(reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 } })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#159e8c]/30 bg-[#159e8c]/10 px-3 py-1 text-[12px] font-semibold text-[#5fd6c4]"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#5fd6c4]" />
              30,000+ jobs in Zimbabwe, updated daily
            </motion.span>

            <motion.h1
              {...(reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.08 } })}
              className="mt-5 text-balance text-[36px] font-extrabold leading-[1.08] tracking-tight sm:text-[48px] lg:text-[52px]"
            >
              Apply to jobs faster.<br />
              <span className="text-[#5fd6c4]">From your own inbox.</span>
            </motion.h1>
            <motion.p
              {...(reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.16 } })}
              className="mx-auto mt-4 max-w-xs text-pretty text-[15px] leading-relaxed text-white/60 lg:mx-0 lg:max-w-sm"
            >
              Feasters matches you to real openings and sends the application for you — no forms, no rewriting your CV for every job.
            </motion.p>

            <motion.div
              {...(reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.24 } })}
              className="mt-7 w-full max-w-[280px]"
            >
              <Button
                onClick={onPrimary}
                disabled={busy}
                className="h-12 w-full rounded-full bg-[#159e8c] text-base font-semibold text-white hover:bg-[#11856f]"
              >
                {!isStandalone && <Download className="h-5 w-5" aria-hidden />}
                {primaryLabel}
              </Button>
            </motion.div>

            <motion.div
              {...(reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.3 } })}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/50 lg:justify-start"
            >
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#5fd6c4]" aria-hidden /> iPhone &amp; Android</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#5fd6c4]" aria-hidden /> No app store needed</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#5fd6c4]" aria-hidden /> Free to start</span>
            </motion.div>
          </div>

          {/* phone + 3D shape backdrop */}
          <motion.div
            {...(reduce ? {} : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] } })}
            className="relative mx-auto h-[520px] w-full max-w-[420px] sm:h-[600px]"
          >
            <div className="absolute inset-0 -z-0">
              <HeroScene reduceMotion={!!reduce} />
            </div>
            <div className="relative z-10 flex h-full items-center justify-center">
              <PhoneFrame bg="dark" interactive>
                <JobFeedScene />
              </PhoneFrame>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WALKTHROUGH — alternating light sections, one feature + one screen each */}
      <FeatureRow
        {...reveal}
        bg="white"
        kicker="Matching"
        title="Every job, ranked for you"
        body="We score every open role against your profile and skills, so the jobs actually worth applying to surface first — not just the newest ones."
      >
        <PhoneFrame bg="light" size={240}><MatchesScene /></PhoneFrame>
      </FeatureRow>

      <FeatureRow
        {...reveal}
        bg="neutral"
        reverse
        kicker="Applying"
        title="One tap. Sent from your own inbox."
        body="No third-party address, no generic template. Each application goes out as a real email from your own inbox, written for that specific role."
      >
        <PhoneFrame bg="light" size={240}><ApplyScene /></PhoneFrame>
      </FeatureRow>

      <FeatureRow
        {...reveal}
        bg="white"
        kicker="Your CV"
        title="A CV that's ready in minutes"
        body="Pick a template, fill in your experience once, and reuse it for every application — no design skills required."
      >
        <PhoneFrame bg="light" size={240}><CvScene /></PhoneFrame>
      </FeatureRow>

      <FeatureRow
        {...reveal}
        bg="neutral"
        reverse
        kicker="Stay ahead"
        title="Never miss a match"
        body="The moment a new job fits your profile, we let you know — so you're never the last one to apply."
      >
        <PhoneFrame bg="light" size={240}><NotifyScene /></PhoneFrame>
      </FeatureRow>

      {/* CLOSING CTA — dark bookend, mirrors the hero */}
      <section className="relative overflow-hidden bg-[#0a0e0d] px-6 py-20 text-center text-white sm:py-24">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#159e8c]/15 blur-[100px]" />
        <motion.div {...reveal} className="relative mx-auto flex max-w-sm flex-col items-center">
          <h2 className="text-balance text-[30px] font-extrabold leading-[1.15] tracking-tight sm:text-[36px]">
            Start applying faster today
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-white/60">
            Install Feasters and let your next application write itself.
          </p>
          <div className="mt-7 w-full max-w-[280px]">
            <Button
              onClick={onPrimary}
              disabled={busy}
              className="h-12 w-full rounded-full bg-[#159e8c] text-base font-semibold text-white hover:bg-[#11856f]"
            >
              {!isStandalone && <Download className="h-5 w-5" aria-hidden />}
              {primaryLabel}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white px-6 py-8 text-center">
        <p className="text-xs text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">Sign in</Link>
        </p>
        <p className="mt-2 text-xs text-neutral-400">
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="underline-offset-4 hover:underline">Terms</Link>
        </p>
      </footer>

      {/* iOS install instructions */}
      <Sheet open={iosOpen} onOpenChange={setIosOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-6">
          <div className="mx-auto w-full max-w-sm">
            <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-muted-foreground/20" />
            <h2 className="mt-4 text-center text-lg font-bold tracking-tight">Add Feasters to your Home Screen</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">Two quick taps in Safari — then it opens like a real app.</p>
            <ol className="mt-6 space-y-4">
              <IosStep n={1} icon={<Share className="h-5 w-5" />}>
                Tap the <b>Share</b> button at the bottom of Safari.
              </IosStep>
              <IosStep n={2} icon={<SquarePlus className="h-5 w-5" />}>
                Scroll down and tap <b>Add to Home Screen</b>.
              </IosStep>
              <IosStep n={3} icon={<Check className="h-5 w-5" />}>
                Tap <b>Add</b> — Feasters lands on your home screen.
              </IosStep>
            </ol>
            <Button onClick={() => setIosOpen(false)} className="mt-6 h-11 w-full rounded-full bg-[#159e8c] text-white hover:bg-[#11856f]">
              Got it
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function IosStep({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#159e8c]/10 text-[#159e8c]">{icon}</span>
      <p className="flex-1 text-sm leading-relaxed">
        <span className="mr-1.5 font-bold text-[#159e8c]">{n}.</span>{children}
      </p>
    </li>
  );
}

// One reusable recipe for every walkthrough section — alternates image/text
// side via `reverse`, alternates background via `bg` for section rhythm.
function FeatureRow({
  kicker, title, body, children, bg, reverse, ...motionProps
}: {
  kicker: string; title: string; body: string; children: React.ReactNode;
  bg: "white" | "neutral"; reverse?: boolean;
} & Record<string, unknown>) {
  return (
    <section className={bg === "white" ? "bg-white" : "bg-neutral-50"}>
      <motion.div
        {...motionProps}
        className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 sm:py-20 md:grid-cols-2 md:gap-16"
      >
        <div className={reverse ? "md:order-2" : undefined}>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#159e8c]">{kicker}</p>
          <h2 className="mt-2 text-balance text-[28px] font-extrabold leading-[1.15] tracking-tight text-neutral-900 sm:text-[32px]">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600">{body}</p>
        </div>
        <div className={reverse ? "md:order-1" : undefined}>{children}</div>
      </motion.div>
    </section>
  );
}

// Real iPhone frame chrome (titanium body, Dynamic Island, side buttons, home
// indicator), sized to the actual 19.5:9 Pro Max aspect ratio — not a guessed
// height. `bg="dark"` gives it a teal ambient glow (for the dark hero);
// `bg="light"` gives it a soft neutral shadow (for the light walkthrough
// sections) so it reads correctly against either background. `interactive`
// (hero only) adds a pointer-tracked 3D tilt, a no-op on touch/mobile and
// fully still under prefers-reduced-motion; the walkthrough mockups sit still.
function PhoneFrame({
  children, bg, interactive = false, size = 272,
}: { children: React.ReactNode; bg: "dark" | "light"; interactive?: boolean; size?: number }) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 260, damping: 22, mass: 0.5 };
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], interactive ? [-8, 8] : [0, 0]), spring);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], interactive ? [6, -6] : [0, 0]), spring);
  const glowX = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(my, [-0.5, 0.5], [0, 100]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || reduce || e.pointerType !== "mouse" || !frameRef.current) return;
    const r = frameRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => { mx.set(0); my.set(0); };

  return (
    <div style={{ perspective: 1600, width: size }} className="mx-auto">
      <motion.div
        ref={frameRef}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerLeave={interactive ? onPointerLeave : undefined}
        whileHover={interactive && !reduce ? { scale: 1.015 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* ambient glow / shadow — tuned per background so it reads correctly on both */}
        <div
          aria-hidden
          className={`absolute -inset-x-8 -bottom-8 top-6 -z-10 rounded-[3rem] blur-2xl ${bg === "dark" ? "bg-[#159e8c]/25" : "bg-black/15"}`}
          style={{ transform: "translateZ(-40px)" }}
        />

        {/* titanium frame — real Pro Max aspect ratio (19.5:9), not a fixed guessed height */}
        <div className="relative aspect-[9/19.5] rounded-[3rem] bg-gradient-to-br from-[#b8b5ac] via-[#82807a] to-[#48473f] p-[2.5px] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_-1px_0_rgba(0,0,0,0.4)_inset]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.85rem] bg-black p-[5px]">
            {/* side buttons (cosmetic, on the outer frame) */}
            <span className="absolute -left-[2px] top-[15%] h-5 w-[2.5px] rounded-l-sm bg-[#3a3934]" />
            <span className="absolute -left-[2px] top-[21%] h-9 w-[2.5px] rounded-l-sm bg-[#3a3934]" />
            <span className="absolute -left-[2px] top-[29%] h-9 w-[2.5px] rounded-l-sm bg-[#3a3934]" />
            <span className="absolute -right-[2px] top-[22%] h-12 w-[2.5px] rounded-r-sm bg-[#3a3934]" />

            {/* screen */}
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-white">
              {/* Dynamic Island */}
              <div className="absolute left-1/2 top-[1.4%] z-30 h-[16px] w-[68px] -translate-x-1/2 rounded-full bg-black" />

              {/* status bar */}
              <div className="relative z-20 flex shrink-0 items-center justify-between px-4 pb-1 pt-[10px] text-[9px] font-semibold text-foreground">
                <span>11:27</span>
                <div className="flex items-center gap-1">
                  <span className="flex items-end gap-[1.5px]">
                    {[3, 5, 7, 9].map((h) => (
                      <span key={h} className="w-[2.5px] rounded-[1px] bg-foreground" style={{ height: h }} />
                    ))}
                  </span>
                  <Wifi className="h-[10px] w-[10px]" strokeWidth={2.5} />
                  <span className="rounded-[3px] border border-foreground/70 px-[3px] text-[7px] leading-[10px]">100</span>
                </div>
              </div>

              {children}

              {/* home indicator */}
              <div className="flex shrink-0 justify-center bg-white pb-[6px] pt-[3px]">
                <span className="h-[3px] w-[70px] rounded-full bg-black/80" />
              </div>

              {/* glossy reflection, tracks the pointer for a real "glass" feel (static center highlight when not interactive) */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-40 opacity-30"
                style={{
                  background: useTransform(
                    [glowX, glowY],
                    ([gx, gy]: number[]) => `radial-gradient(220px circle at ${gx}% ${gy}%, rgba(255,255,255,0.5), transparent 60%)`,
                  ),
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Shared "app top panel" — mirrors app-shell.tsx header exactly (brown title).
function AppTopPanel({ title }: { title: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2">
      <Menu className="h-3.5 w-3.5 text-foreground/70" strokeWidth={1.75} />
      <span className="text-[10.5px] font-bold tracking-tight text-[#7c4a21]">{title}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Bell className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <Settings className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[hsl(221,83%,60%)] to-[hsl(262,83%,58%)] ring-1 ring-border" />
      </span>
    </div>
  );
}

// Shared bottom tab bar — the real 5 tabs from app-shell.tsx's BOTTOM nav.
// `active` is optional: screens for features that don't live on the bottom
// bar (like the CV builder, which lives in the sidebar/drawer) pass none,
// so nothing is falsely highlighted.
function BottomTabBar({ active }: { active?: "home" | "jobs" | "matches" | "apply" | "applied" }) {
  const tabs = [
    { key: "home", label: "Home", Icon: Home },
    { key: "jobs", label: "Jobs", Icon: Briefcase },
    { key: "matches", label: "Matches", Icon: Sparkles },
    { key: "apply", label: "Apply", Icon: Send },
    { key: "applied", label: "Applied", Icon: ClipboardCheck },
  ] as const;
  return (
    <div className="flex shrink-0 items-stretch justify-around border-t border-border bg-white py-1.5">
      {tabs.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <span key={key} className={`relative flex flex-1 flex-col items-center gap-0.5 text-[5.5px] font-medium ${isActive ? "text-[hsl(221,83%,53%)]" : "text-muted-foreground"}`}>
            {isActive && <span className="absolute -top-1.5 h-[2px] w-3 rounded-full bg-[hsl(221,83%,53%)]" />}
            <Icon className="h-3 w-3" strokeWidth={isActive ? 2.2 : 1.8} />
            {label}
          </span>
        );
      })}
    </div>
  );
}

// HERO scene: the job feed, plus a one-shot (never looping) "applied" toast
// that demonstrates the auto-apply value prop, skipped under reduced motion.
function JobFeedScene() {
  const reduce = useReducedMotion();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const inT = setTimeout(() => setToastVisible(true), 1400);
    const outT = setTimeout(() => setToastVisible(false), 4600);
    return () => { clearTimeout(inT); clearTimeout(outT); };
  }, [reduce]);

  return (
    <>
      <AppTopPanel title="All Jobs" />
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-2 p-2">
          <MockJobCard
            logo="W" logoClass="bg-indigo-600"
            title="WWF Africa Hiring Remote Consultants t…"
            salary="$300"
            location="Remote" posted="Posted today"
            pills={["Contract", "Remote", "Global"]}
            desc="WWF Africa Consultancy Opportunity 2026: Remote Stakeholder Mapping and Climate & Biodiversity Networks Consultant…"
          />
          <MockJobCard
            logo="C" logoClass="bg-rose-600"
            title="The Chamber of Mines of Zimbabwe: Student Attachme…"
            location="Zimbabwe" posted="Posted today"
            pills={["Contract", "Zimbabwe", "Onsite"]}
            desc="Student Attachment Opportunities at The Chamber of Mines of Zimbabwe — Apply by July 7, 2026…"
          />
          <MockJobCard
            logo="P" logoClass="bg-emerald-600"
            title="ProCredit Bank Zimbabwe: Graduate Trainee Program…"
            salary="$450"
            location="Harare" posted="Posted 2h ago"
            pills={["Full-time", "Harare", "Onsite"]}
            desc="Graduate Trainee Program 2026 — rotational placement across retail and corporate banking…"
          />
        </div>
      </div>
      <BottomTabBar active="jobs" />

      {/* one-shot "applied" toast — never loops */}
      <motion.div
        initial={false}
        animate={toastVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className="pointer-events-none absolute inset-x-2 top-[26%] z-40 flex items-center gap-1.5 rounded-xl border border-border/70 bg-white/95 px-2.5 py-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] backdrop-blur"
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(142,71%,45%)] text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <p className="text-[7.5px] font-semibold leading-tight text-foreground">
          Applied to ProCredit Bank Zimbabwe
          <span className="block font-normal text-muted-foreground">Sent from your inbox, just now</span>
        </p>
      </motion.div>
    </>
  );
}

// FEATURE 1 scene: Matches tab — ranked jobs with a match score + why-it-fits chips.
function MatchesScene() {
  const rows = [
    { pct: 97, title: "ProCredit Bank Zimbabwe — Graduate Trainee", reason: "Matches: Finance, Excel, Harare" },
    { pct: 91, title: "Chamber of Mines — Student Attachment", reason: "Matches: Engineering, Zimbabwe" },
    { pct: 84, title: "WWF Africa — Remote Consultant", reason: "Matches: Research, Remote" },
  ];
  return (
    <>
      <AppTopPanel title="My Matches" />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/20 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((r) => (
          <div key={r.title} className="rounded-xl border border-border/70 bg-card p-2">
            <div className="flex items-start gap-1.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[hsl(142,71%,45%)]/10 text-[9px] font-extrabold text-[hsl(142,71%,35%)]">
                {r.pct}%
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[8.5px] font-bold leading-tight tracking-tight">{r.title}</p>
                <p className="mt-0.5 truncate text-[6.5px] font-medium text-muted-foreground">{r.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar active="matches" />
    </>
  );
}

// FEATURE 2 scene: a sent-application email preview, from the user's own inbox.
function ApplyScene() {
  return (
    <>
      <AppTopPanel title="Quick Apply" />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-xl border border-border/70 bg-card p-2.5">
          <div className="flex items-center gap-1.5 border-b border-border/70 pb-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#159e8c]/10 text-[#159e8c]"><Mail className="h-3 w-3" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[7px] font-semibold">From: you@gmail.com</p>
              <p className="truncate text-[6.5px] text-muted-foreground">To: hr@procredit.co.zw</p>
            </div>
          </div>
          <p className="mt-2 text-[7.5px] font-bold leading-tight">Application — Graduate Trainee Program</p>
          <p className="mt-1 line-clamp-3 text-[6.5px] leading-relaxed text-muted-foreground">
            Good afternoon, I'm writing to apply for the Graduate Trainee Program. I recently completed my degree in Finance and have hands-on experience with…
          </p>
          <div className="mt-2 flex items-center gap-1 rounded-lg bg-[hsl(142,71%,45%)]/10 px-2 py-1.5">
            <Check className="h-3 w-3 text-[hsl(142,71%,35%)]" strokeWidth={3} />
            <span className="text-[6.5px] font-bold text-[hsl(142,71%,30%)]">Sent — just now</span>
          </div>
        </div>
      </div>
      <BottomTabBar active="apply" />
    </>
  );
}

// FEATURE 3 scene: a CV document preview (not one of the 5 bottom tabs in the
// real app — it lives in the sidebar/drawer — so no tab is highlighted).
function CvScene() {
  return (
    <>
      <AppTopPanel title="My CV" />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[10px] font-extrabold tracking-tight">Tendai Moyo</p>
          <p className="text-[6.5px] text-muted-foreground">Finance Graduate · Harare, Zimbabwe</p>
          <div className="mt-2 flex items-center gap-1 text-[6.5px] font-semibold text-[#7c4a21]">
            <FileText className="h-[8px] w-[8px]" /> Experience
          </div>
          <div className="mt-1 space-y-1">
            <div className="h-[5px] w-full rounded-full bg-muted" />
            <div className="h-[5px] w-[80%] rounded-full bg-muted" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-[6.5px] font-semibold text-[#7c4a21]">
            <FileText className="h-[8px] w-[8px]" /> Education
          </div>
          <div className="mt-1 space-y-1">
            <div className="h-[5px] w-[90%] rounded-full bg-muted" />
            <div className="h-[5px] w-[60%] rounded-full bg-muted" />
          </div>
        </div>
      </div>
      <BottomTabBar />
    </>
  );
}

// FEATURE 4 scene: an iOS-style notification banner over a dimmed job feed.
function NotifyScene() {
  return (
    <>
      <AppTopPanel title="All Jobs" />
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20 p-2">
        <div className="pointer-events-none space-y-2 opacity-40 blur-[1px]">
          <div className="h-16 rounded-xl border border-border/70 bg-card" />
          <div className="h-16 rounded-xl border border-border/70 bg-card" />
        </div>
        <div className="absolute inset-x-2 top-2 flex items-center gap-1.5 rounded-xl border border-border/70 bg-white/95 px-2.5 py-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] backdrop-blur">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#159e8c] text-white">
            <Bell className="h-3 w-3" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-bold leading-tight">Feasters</p>
            <p className="truncate text-[6.5px] leading-tight text-muted-foreground">3 new jobs match you — tap to view</p>
          </div>
        </div>
      </div>
      <BottomTabBar active="jobs" />
    </>
  );
}

function MockJobCard({
  logo, logoClass, title, salary, location, posted, pills, desc,
}: {
  logo: string; logoClass: string; title: string; salary?: string;
  location: string; posted: string; pills: string[]; desc: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="p-2">
        <div className="flex items-start gap-1.5">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white ${logoClass}`}>
            {logo}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[9px] font-bold leading-tight tracking-tight">{title}</p>
            <p className="truncate text-[7.5px] font-medium text-[hsl(221,83%,53%)]">Confidential company</p>
          </div>
          {salary && (
            <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-[1px] text-[8px] font-bold text-emerald-700">{salary}</span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[6.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><MapPin className="h-[7px] w-[7px]" />{location}</span>
          <span className="inline-flex items-center gap-0.5"><CalendarDays className="h-[7px] w-[7px]" />{posted}</span>
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          {pills.map((p, i) => (
            <span key={`${p}-${i}`} className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-[1px] text-[6px] font-semibold text-foreground/80">
              {i === 0 && <Briefcase className="h-[6px] w-[6px]" />}
              {p}
            </span>
          ))}
        </div>

        <div className="mt-1 rounded-lg border border-border/70 bg-muted/30 p-1.5">
          <p className="mb-0.5 flex items-center gap-1 text-[6.5px] font-semibold">
            <FileText className="h-[7px] w-[7px] text-[hsl(221,83%,53%)]" /> About this role
          </p>
          <p className="line-clamp-2 text-[6px] leading-relaxed text-muted-foreground">{desc}</p>
        </div>

        <p className="mt-1 text-[4.5px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Brought to you by Feasters
        </p>
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-border/70 bg-muted/20 px-2 py-1">
        <span className="flex flex-1 items-center justify-center gap-0.5 rounded-md border border-input text-[6.5px] font-medium">
          <X className="h-[7px] w-[7px]" /> Pass
        </span>
        <span className="flex flex-1 items-center justify-center gap-0.5 rounded-md bg-[hsl(142,71%,45%)] py-[3px] text-[6.5px] font-bold text-white">
          <Heart className="h-[7px] w-[7px]" /> Apply Now
        </span>
      </div>
    </div>
  );
}
