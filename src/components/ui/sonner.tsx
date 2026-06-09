"use client";

import { Toaster as Sonner } from "sonner";

// App-wide toast host. `richColors` gives success/error/info their own tints,
// and `closeButton` lets users dismiss. Positioned top-center to sit under the
// sticky topbar without fighting the sidebar.
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      expand
      toastOptions={{
        style: { fontFamily: "var(--font-sans), system-ui, sans-serif" },
      }}
    />
  );
}
