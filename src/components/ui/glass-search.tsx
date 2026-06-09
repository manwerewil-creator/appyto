"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Show a trailing circular search button (matches the reference mockup). */
  withButton?: boolean;
  onSubmit?: () => void;
  containerClassName?: string;
}

/**
 * Liquid-glass search field — frosted, translucent, rounded-full, with a
 * leading magnifier and an optional trailing circular button. Sits on top of
 * any background (works over gradients, photos, or the app's light surface).
 */
export function GlassSearch({
  value,
  onChange,
  withButton = false,
  onSubmit,
  placeholder = "Search …",
  className,
  containerClassName,
  ...props
}: GlassSearchProps) {
  return (
    <div
      className={cn(
        "lg-glass-input group flex h-12 items-center gap-2 rounded-full pl-4 pr-1.5",
        "focus-within:ring-2 focus-within:ring-primary/40",
        containerClassName,
      )}
    >
      <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit?.(); }}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground",
          "[&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {withButton && (
        <button
          type="button"
          onClick={onSubmit}
          aria-label="Search"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
        >
          <Search className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
