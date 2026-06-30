"use client";

import { useCallback, useEffect, useState } from "react";

// Chrome/Edge/Android fire `beforeinstallprompt`; we capture it so an in-page
// button can trigger the native install dialog. iOS Safari has no such API, so
// there we detect iOS and guide the user through Share → Add to Home Screen.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstall {
  canInstall: boolean;     // native install prompt is available (Android/desktop Chrome)
  isIOS: boolean;          // needs the manual "Add to Home Screen" steps
  isStandalone: boolean;   // already running as an installed app
  installed: boolean;      // installed during this session
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export function usePwaInstall(): PwaInstall {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua));
    setIsStandalone(
      window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true,
    );

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return { canInstall: !!deferred, isIOS, isStandalone, installed, promptInstall };
}
