"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);          // email/password submit
  const [googleBusy, setGoogleBusy] = useState(false);
  const reduce = useReducedMotion();

  // Animated reveal for the first/last name row when switching to sign-up.
  const nameAnim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" as const }, exit: { opacity: 0, height: 0 } };

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).get("error"));
  }, []);

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
      if (err) { setError(err.message); setGoogleBusy(false); }
    } catch (e: any) {
      setError(e?.message ?? "Could not start sign-in.");
      setGoogleBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      const sb = createClient();

      if (mode === "signin") {
        const { error: err } = await sb.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setBusy(false); return; }
        // Session cookie is set; let the server decide where to land.
        router.replace("/auth/callback");
        router.refresh();
        return;
      }

      // mode === "signup"
      const full_name = `${firstName} ${lastName}`.trim();
      const { data, error: err } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
          data: full_name ? { full_name } : undefined,
        },
      });
      if (err) { setError(err.message); setBusy(false); return; }

      // If email confirmation is on, there is no active session yet.
      if (!data.session) {
        const msg = "Account created. Check your inbox to confirm your email, then sign in.";
        setNotice(msg);
        toast.success("Account created", { description: "Check your inbox to confirm your email." });
        setMode("signin");
        setPassword("");
        setBusy(false);
        return;
      }

      // Confirmation disabled → already signed in.
      toast.success("Welcome to Feasters!");
      router.replace("/auth/callback");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/40 via-background to-background px-4 py-12">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <img src="/logo.png" alt="Feasters" width={56} height={56} className="mb-2" />
          <CardTitle className="text-2xl">Feasters</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to apply faster."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              {error === "auth" ? "Sign-in failed. Please try again." : error}
            </div>
          )}
          {notice && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-700 dark:text-emerald-400">
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  key="names"
                  {...nameAnim}
                  transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        placeholder="Smith"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
            disabled={googleBusy}
          >
            {googleBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 14.1 6 6 14.1 6 24s8.1 18 18 18 18-8.1 18-18c0-1.2-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M8.3 14.7l6.6 4.8C16.7 16 20 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 16.8 6 10.6 10.1 8.3 14.7z" />
                <path fill="#4CAF50" d="M24 42c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C10.5 37.8 16.7 42 24 42z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.5 42 31.6 42 24c0-1.2-.1-2.4-.4-3.5z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
