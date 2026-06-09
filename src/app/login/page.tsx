"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).get("error"));
  }, []);

  async function signIn() {
    setBusy(true);
    const sb = createClient();
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (err) setBusy(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.box}`}>
        <div className={styles.brand}>
          <span className={styles.dot} />
          Appyto
        </div>
        <p className={styles.tag}>
          A tool to apply faster — not a guarantee of a job.
        </p>
        {error && (
          <div className={styles.err}>
            {error === "auth"
              ? "Sign-in failed. Please try again."
              : error}
          </div>
        )}
        <button
          className={`btn ${styles.google}`}
          onClick={signIn}
          disabled={busy}
        >
          {busy ? (
            <span className="spinner" />
          ) : (
            <svg className={styles.gicon} viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 14.1 6 6 14.1 6 24s8.1 18 18 18 18-8.1 18-18c0-1.2-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M8.3 14.7l6.6 4.8C16.7 16 20 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 16.8 6 10.6 10.1 8.3 14.7z" />
              <path fill="#4CAF50" d="M24 42c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C10.5 37.8 16.7 42 24 42z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.5 42 31.6 42 24c0-1.2-.1-2.4-.4-3.5z" />
            </svg>
          )}
          Continue with Google
        </button>
      </div>
    </div>
  );
}
