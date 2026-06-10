"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * First-touch "Get Started" screen — the screen unauthenticated users land on
 * before login / sign up. Mobile-first: a branded hero (Feasters logo + name),
 * a headline, a short pitch, and a single green CTA into the auth flow (/login).
 */
export default function WelcomePage() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] as const },
  });

  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-muted/50 px-3 py-3 sm:py-6">
      {/* Phone-width content card */}
      <div className="flex min-h-[100dvh] w-full max-w-md flex-col rounded-[28px] bg-background p-4 shadow-sm sm:min-h-0 sm:self-center sm:p-5 sm:shadow-xl">
        {/* Branded hero — Feasters logo + name */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } })}
          className="relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-primary/10 via-muted to-muted"
        >
          <div className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--sb-primary)/0.08)_1px,transparent_0)] [background-size:18px_18px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Feasters" width={108} height={108} className="relative h-24 w-24 rounded-[28px] shadow-lg sm:h-28 sm:w-28" />
          <span className="relative text-4xl font-extrabold tracking-tight text-foreground sm:text-[40px]">Feasters</span>
        </motion.div>

        {/* Copy + CTA */}
        <div className="flex flex-1 flex-col px-2 pt-7 text-center">
          <motion.h1
            {...rise(0.1)}
            className="text-balance text-[26px] font-extrabold leading-[1.18] tracking-tight text-foreground"
          >
            Shape Your Future With Job Opportunities
          </motion.h1>

          <motion.p
            {...rise(0.18)}
            className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground"
          >
            Discover a vast selection of over 30,000 job opportunities to
            supercharge your career path today.
          </motion.p>

          <motion.div {...rise(0.26)} className="mt-auto space-y-4 pt-9">
            <Button
              asChild
              className="h-12 w-full rounded-full bg-[#159e8c] text-base font-semibold text-white shadow-sm hover:bg-[#11856f]"
            >
              <Link href="/login">Get Started</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
