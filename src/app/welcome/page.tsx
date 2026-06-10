"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * First-touch "Get Started" screen — the screen unauthenticated users land on
 * before login / sign up. Full-screen, centered: the Feasters logo + name, a
 * headline, a short pitch, and a single green CTA into the auth flow (/login).
 */
export default function WelcomePage() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] as const },
  });

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* Brand */}
        <motion.img
          {...(reduce ? {} : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } })}
          src="/logo.png"
          alt="Feasters"
          width={112}
          height={112}
          className="h-28 w-28"
        />
        <motion.span {...rise(0.08)} className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
          Feasters
        </motion.span>

        {/* Copy */}
        <motion.h1 {...rise(0.16)} className="mt-8 text-balance text-[26px] font-extrabold leading-[1.18] tracking-tight text-foreground">
          Shape Your Future With Job Opportunities
        </motion.h1>
        <motion.p {...rise(0.24)} className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
          Discover a vast selection of over 30,000 job opportunities to
          supercharge your career path today.
        </motion.p>

        {/* CTA */}
        <motion.div {...rise(0.32)} className="mt-9 w-full space-y-4">
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
  );
}
