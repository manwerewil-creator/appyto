"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", ico: "▦" },
  { href: "/jobs", label: "All Jobs", ico: "≣" },
  { href: "/matches", label: "My Matches", ico: "◎" },
  { href: "/quick-apply", label: "Quick Apply", ico: "✎" },
  { href: "/applications", label: "Applications", ico: "✈" },
  { href: "/resume", label: "CV Builder", ico: "▤" },
  { href: "/profile", label: "Profile & CV", ico: "◑" },
  { href: "/settings", label: "Settings", ico: "⚙" },
];

export default function Sidebar() {
  const path = usePathname();
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
        A tool to apply faster — not a guarantee of a job.
      </div>
    </aside>
  );
}
