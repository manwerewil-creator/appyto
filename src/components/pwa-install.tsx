"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The browser fires this (Chrome / Edge / Android) when the app meets PWA
// install criteria. We stash it and trigger it from our own button.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

/**
 * "Install app" button. Renders only when the app can actually be installed
 * (and isn't already), so it stays hidden inside the installed PWA. On iOS —
 * which has no programmatic prompt — it shows the Add-to-Home-Screen steps.
 */
export function PwaInstall({ className, fullWidth }: { className?: string; fullWidth?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true); // assume hidden until we know it's installable
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    setInstalled(false);
    setIos(isIOS());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("Featers installed", { description: "Open it any time from your home screen." });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Nothing to do if already installed, or no install path on this browser.
  if (installed) return null;
  if (!deferred && !ios) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDeferred(null);
      return;
    }
    // iOS: no prompt API — guide the user.
    toast("Install Featers", {
      icon: <Share className="h-4 w-4" />,
      description: "Tap the Share button, then “Add to Home Screen”.",
      duration: 8000,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(fullWidth && "w-full justify-start", className)}
    >
      <Download className="h-4 w-4" /> Install app
    </Button>
  );
}
