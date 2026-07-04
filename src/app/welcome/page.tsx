"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../_components/usePwaInstall";
import {
  Download, Share, SquarePlus, Check, Briefcase, Send, Menu, Bell, Settings,
  MapPin, CalendarDays, FileText, X, Heart, Home, Sparkles, ClipboardCheck, Wifi,
} from "lucide-react";

/**
 * First-touch landing at feasters.cloud. Feasters is a PWA — this page sells the
 * app and gets it installed on the phone (native prompt on Android, guided
 * "Add to Home Screen" on iOS), so people use it as a standalone app, not a tab.
 * "Continue in browser" stays available (installing requires a browser visit).
 */
export default function WelcomePage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { canInstall, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] as const },
  });

  // The single primary action adapts to the device + install state.
  const primaryLabel = isStandalone
    ? "Open Feasters"
    : canInstall
      ? "Install the app"
      : isIOS
        ? "Add to Home Screen"
        : "Get started";

  const onPrimary = async () => {
    if (isStandalone) { router.push("/login"); return; }
    if (canInstall) {
      setBusy(true);
      const r = await promptInstall();
      setBusy(false);
      if (r === "accepted") toast.success("Installing Feasters — open it from your home screen.");
      else if (r === "dismissed") toast("No problem — you can install anytime from here.");
      else router.push("/login");
      return;
    }
    if (isIOS) { setIosOpen(true); return; }
    router.push("/login"); // desktop / unsupported: just continue
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-hidden bg-background px-6 py-10">
      {/* soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#159e8c]/15 blur-3xl" />

      <div className="relative flex w-full max-w-sm flex-1 flex-col items-center text-center">
        {/* Brand */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } })}
          className="flex items-center gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Feasters" width={40} height={40} className="h-10 w-10" />
          <span className="text-2xl font-extrabold tracking-tight">Feasters</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...rise(0.12)} className="mt-8 text-balance text-[28px] font-extrabold leading-[1.15] tracking-tight">
          Apply to jobs faster, right from your phone
        </motion.h1>
        <motion.p {...rise(0.2)} className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
          Over 30,000 jobs in Zimbabwe, matched to you and applied for from your own inbox. Install the app and carry it with you.
        </motion.p>

        {/* Phone mockup */}
        <motion.div {...rise(0.28)} className="mt-8 w-full">
          <PhoneMockup />
        </motion.div>

        {/* Trust row */}
        <motion.div {...rise(0.34)} className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#159e8c]" /> Works on iPhone &amp; Android</span>
          <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#159e8c]" /> No app store needed</span>
        </motion.div>

        {/* CTA */}
        <motion.div {...rise(0.4)} className="mt-6 w-full space-y-3">
          <Button
            onClick={onPrimary}
            disabled={busy}
            className="h-12 w-full rounded-full bg-[#159e8c] text-base font-semibold text-white shadow-sm hover:bg-[#11856f]"
          >
            {!isStandalone && <Download className="h-5 w-5" />}
            {primaryLabel}
          </Button>

          {!isStandalone && (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Continue in browser
            </button>
          )}
        </motion.div>
      </div>

      <p className="relative mt-8 text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign in</Link>
      </p>

      <p className="relative mt-2 text-xs text-muted-foreground">
        <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy Policy</Link>
        {" · "}
        <Link href="/terms" className="underline-offset-4 hover:underline">Terms</Link>
      </p>

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

// Real iPhone frame (Dynamic Island, side buttons, home indicator), sized to
// the actual 19.5:9 Pro Max aspect ratio (not a guessed height) so it reads as
// a real device, not a stretched icon. Static resting pose — no idle bob/sway
// — with a pointer-tracked tilt only while the user is actively hovering (a
// no-op on touch/mobile and fully still under prefers-reduced-motion). The
// job feed genuinely scrolls on hover/drag so the mock is something you
// interact with, not a still image. Screen content mirrors the real app 1:1 —
// same tokens as app-shell.tsx (brown #7c4a21 section title, JobBoardCard.tsx
// layout/colors, BottomNav icons/order) — not a generic mock.
function PhoneMockup() {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 260, damping: 22, mass: 0.5 };
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);
  const glowX = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(my, [-0.5, 0.5], [0, 100]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !frameRef.current) return;
    const r = frameRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => { mx.set(0); my.set(0); };

  return (
    <div style={{ perspective: 1600 }} className="mx-auto w-[272px]">
      <motion.div
        ref={frameRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        whileHover={reduce ? undefined : { scale: 1.015 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* drop shadow that reads as "resting on the page" */}
        <div className="absolute -inset-x-8 -bottom-8 top-6 -z-10 rounded-[3rem] bg-black/25 blur-2xl" style={{ transform: "translateZ(-40px)" }} />

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

              {/* app top panel — mirrors app-shell.tsx header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2">
                <Menu className="h-3.5 w-3.5 text-foreground/70" strokeWidth={1.75} />
                <span className="text-[10.5px] font-bold tracking-tight text-[#7c4a21]">All Jobs</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[hsl(221,83%,60%)] to-[hsl(262,83%,58%)] ring-1 ring-border" />
                </span>
              </div>

              {/* job feed — genuinely scrollable, fills remaining height (real aspect ratio, not a fixed px guess) */}
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="space-y-2 p-2">
                  <MockJobCard
                    logo="W" logoClass="bg-indigo-600"
                    title="WWF Africa Hiring Remote Consultants t…"
                    salary="$300"
                    location="Remote" posted="Posted today"
                    pills={["Contract", "Remote", "Global", "Remote"]}
                    desc="WWF Africa Consultancy Opportunity 2026: Remote Stakeholder Mapping and Climate & Biodiversity Networks Consultant…"
                  />
                  <MockJobCard
                    logo="C" logoClass="bg-rose-600"
                    title="The Chamber of Mines of Zimbabwe: Student Attachme…"
                    location="Zimbabwe" posted="Posted today"
                    pills={["Contract", "Zimbabwe", "Onsite", "Zimbabwe"]}
                    desc="Student Attachment Opportunities at The Chamber of Mines of Zimbabwe — Apply by July 7, 2026…"
                  />
                  <MockJobCard
                    logo="P" logoClass="bg-emerald-600"
                    title="ProCredit Bank Zimbabwe: Graduate Trainee Program…"
                    salary="$450"
                    location="Harare" posted="Posted 2h ago"
                    pills={["Full-time", "Harare", "Onsite", "Zimbabwe"]}
                    desc="Graduate Trainee Program 2026 — rotational placement across retail and corporate banking…"
                  />
                </div>
              </div>

              {/* bottom tab bar — mirrors BottomNav in app-shell.tsx */}
              <div className="flex shrink-0 items-stretch justify-around border-t border-border bg-white py-1.5">
                {[
                  { label: "Home", Icon: Home },
                  { label: "Jobs", Icon: Briefcase, active: true },
                  { label: "Matches", Icon: Sparkles },
                  { label: "Apply", Icon: Send },
                  { label: "Applied", Icon: ClipboardCheck },
                ].map(({ label, Icon, active }) => (
                  <span key={label} className={`relative flex flex-1 flex-col items-center gap-0.5 text-[5.5px] font-medium ${active ? "text-[hsl(221,83%,53%)]" : "text-muted-foreground"}`}>
                    {active && <span className="absolute -top-1.5 h-[2px] w-3 rounded-full bg-[hsl(221,83%,53%)]" />}
                    <Icon className="h-3 w-3" strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </span>
                ))}
              </div>

              {/* home indicator */}
              <div className="flex shrink-0 justify-center bg-white pb-[6px] pt-[3px]">
                <span className="h-[3px] w-[70px] rounded-full bg-black/80" />
              </div>

              {/* glossy reflection, tracks the pointer for a real "glass" feel */}
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
