"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { Icon, IconName } from "@/components/vb/icons";
export { Icon } from "@/components/vb/icons";
export type { IconName } from "@/components/vb/icons";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Button({
  children, onClick, type = "button", variant = "primary", className, disabled, href, arrow,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "accent" | "outline" | "ghost" | "dark" | "danger";
  className?: string; disabled?: boolean; href?: string; arrow?: boolean;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-spring active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15";
  const styles = {
    primary: "bg-brand text-white shadow-soft hover:bg-brand-600",
    accent: "bg-grass text-white shadow-soft hover:bg-grass-600",
    dark: "bg-ink text-white hover:bg-ink/90",
    outline: "border border-line bg-surface text-ink hover:border-ink/20 hover:bg-paper",
    ghost: "text-ink hover:bg-paper",
    danger: "bg-danger text-white hover:brightness-95",
  }[variant];
  const inner = (
    <>
      {children}
      {arrow && (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px">
          <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );
  const cls = cn(base, styles, className);
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{inner}</button>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-soft", className)}>{children}</div>;
}

export function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
      dark ? "bg-white/10 text-white/80" : "bg-brand-50 text-brand")}>
      {children}
    </span>
  );
}

export function Field({ label, children, hint, required }: { label?: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink">{label}{required && <span className="text-danger">*</span>}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const { label, hint, className, required, ...rest } = props;
  return <Field label={label} hint={hint} required={required}><input {...rest} className={cn(fieldCls, className)} /></Field>;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  const { label, hint, className, required, ...rest } = props;
  return <Field label={label} hint={hint} required={required}><textarea {...rest} className={cn(fieldCls, "min-h-[120px] resize-y", className)} /></Field>;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string }) {
  const { label, hint, className, children, required, ...rest } = props;
  return <Field label={label} hint={hint} required={required}><select {...rest} className={cn(fieldCls, "appearance-none bg-[length:0]", className)}>{children}</select></Field>;
}

const tones: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
  shortlisted: "bg-brand-50 text-brand ring-brand/15",
  interview: "bg-violet-50 text-violet-700 ring-violet-600/15",
  accepted: "bg-grass-50 text-grass-600 ring-grass/20",
  rejected: "bg-red-50 text-danger ring-danger/15",
  open: "bg-grass-50 text-grass-600 ring-grass/20",
  closed: "bg-zinc-100 text-zinc-500 ring-zinc-400/20",
  verified: "bg-grass-50 text-grass-600 ring-grass/20",
};
export function Badge({ children, tone, icon }: { children: ReactNode; tone?: string; icon?: IconName }) {
  const color = (tone && tones[tone]) || "bg-paper text-dim ring-line";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset", color)}>
      {icon && <Icon name={icon} className="h-3.5 w-3.5" />}{children}
    </span>
  );
}

// Standard metric tile — replaces emoji stat cards.
export function Stat({ icon, value, label, accent }: { icon: IconName; value: ReactNode; label: string; accent?: "brand" | "accent" | "amber" | "violet" }) {
  const ring = { brand: "text-brand bg-brand-50", accent: "text-grass-600 bg-grass-50", amber: "text-amber-600 bg-amber-50", violet: "text-violet-600 bg-violet-50" }[accent || "brand"];
  return (
    <Card className="p-5 transition-shadow duration-300 hover:shadow-lift">
      <div className={cn("mb-4 grid h-10 w-10 place-items-center rounded-xl", ring)}><Icon name={icon} className="h-5 w-5" /></div>
      <div className="nums text-3xl font-extrabold tracking-tightest text-ink">{value}</div>
      <div className="mt-0.5 text-sm text-dim">{label}</div>
    </Card>
  );
}

export function Empty({ title, sub, icon = "sparkle" }: { title: string; sub?: string; icon?: IconName }) {
  return (
    <Card className="grid place-items-center px-8 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-paper text-faint"><Icon name={icon} className="h-6 w-6" /></div>
      <p className="font-semibold text-ink">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-dim">{sub}</p>}
    </Card>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand", className)} />;
}

export function PageLoader() {
  return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-7 w-7" /></div>;
}
