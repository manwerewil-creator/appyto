"use client";

import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null): string {
  const base = (name || email || "").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}

/**
 * Circular profile image with a graceful fallback: the user's Google photo when
 * present, otherwise their initials on a blue gradient (LinkedIn-style). Sized
 * by the caller via className (e.g. "h-9 w-9", "h-24 w-24 text-2xl").
 */
export function UserAvatar({ src, name, email, className }: UserAvatarProps) {
  if (src) {
    return (
      // Google avatars 403 without no-referrer; <img> avoids next/image domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Profile"}
        referrerPolicy="no-referrer"
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-blue-700 font-semibold text-white",
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}
