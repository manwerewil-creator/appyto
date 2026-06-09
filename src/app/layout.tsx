import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

// Matches rylolabz.com — Inter Tight, self-hosted by Next for zero layout shift.
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Featers",
  description: "Aggregate every job in Zimbabwe, match with code, and apply for you.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
  appleWebApp: { capable: true, title: "Featers", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interTight.variable}>
      <body>
        <AppShell>{children}</AppShell>
        <Toaster />
        <script
          // Register the minimal install-enabling service worker (public/sw.js).
          // It only caches hashed static assets and never touches navigations or
          // /auth, so it can't regress the OAuth flow — and it lets the browser
          // offer "Install app".
          dangerouslySetInnerHTML={{
            __html:
              `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
