"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Overview", ico: "▦" },
  { href: "/jobs", label: "All Jobs", ico: "≣" },
  { href: "/matches", label: "My Matches", ico: "◎" },
  { href: "/quick-apply", label: "Quick Apply", ico: "✎" },
  { href: "/applications", label: "Applications", ico: "✈" },
  { href: "/resume", label: "CV Builder", ico: "▤" },
  { href: "/profile", label: "Profile & CV", ico: "◑" },
  { href: "/billing", label: "Upgrade", ico: "★" },
  { href: "/settings", label: "Settings", ico: "⚙" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function signOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        Appyto
      </div>
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`nav-link${isActive(n.href) ? " active" : ""}`}
        >
          <span className="ico">{n.ico}</span>
          {n.label}
        </Link>
      ))}
      <div className="sidebar-foot">
        {email && (
          <div className="spread" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </span>
            <button className="btn ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
        A tool to apply faster — not a guarantee of a job.
      </div>
    </aside>
  );
}
