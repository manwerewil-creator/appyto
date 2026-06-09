import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";

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
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
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
        <script
          // The PWA service worker kept breaking Google OAuth (intercepted
          // /auth/callback, served stale JS → dead login button + login loop).
          // It has been retired: actively unregister any existing worker and
          // clear its caches so already-affected browsers recover on next load.
          dangerouslySetInnerHTML={{
            __html:
              `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})}).catch(function(){});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})}).catch(function(){})}}`,
          }}
        />
      </body>
    </html>
  );
}
