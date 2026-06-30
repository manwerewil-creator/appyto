"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../_components/usePwaInstall";
import { Download, Share, SquarePlus, Check, Briefcase, Send } from "lucide-react";

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

// A lightweight, stylised phone showing a mini Feasters UI — conveys "this is an
// app you install", without needing real screenshots.
function PhoneMockup() {
  return (
    <div className="mx-auto w-[230px] rounded-[2.2rem] border-[7px] border-foreground/90 bg-foreground/90 shadow-2xl">
      <div className="overflow-hidden rounded-[1.7rem] bg-background">
        {/* status bar / app header */}
        <div className="flex items-center justify-between bg-[#159e8c] px-4 py-2.5 text-white">
          <span className="text-[11px] font-bold tracking-tight">Feasters</span>
          <Briefcase className="h-3.5 w-3.5" />
        </div>
        {/* fake job cards */}
        <div className="space-y-2.5 p-3">
          {[
            { t: "Accountant", c: "Harare", a: "#0ea5e9" },
            { t: "Sales Rep", c: "Bulawayo", a: "#8b5cf6" },
            { t: "IT Support", c: "Remote", a: "#f43f5e" },
          ].map((j) => (
            <div key={j.t} className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5 text-left">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white" style={{ background: j.a }}>
                {j.t[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold leading-tight">{j.t}</p>
                <p className="truncate text-[9px] text-muted-foreground">{j.c}</p>
              </div>
              <span className="rounded-md bg-[#159e8c] px-2 py-1 text-[9px] font-bold text-white">Apply</span>
            </div>
          ))}
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#159e8c]/10 py-2 text-[10px] font-semibold text-[#159e8c]">
            <Send className="h-3 w-3" /> Applied from your Gmail
          </div>
        </div>
      </div>
    </div>
  );
}
