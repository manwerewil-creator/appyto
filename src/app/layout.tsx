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
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
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
          dangerouslySetInnerHTML={{
            __html:
              `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
