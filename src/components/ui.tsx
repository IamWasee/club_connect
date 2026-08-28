"use client";

/** Shared primitives, so pages stay about behaviour rather than class strings. */

import { PageHead, Sparkle } from "@/components/Poster";

export { PageHead, Sparkle, SparkleRule } from "@/components/Poster";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface/80 p-5 shadow-[0_1px_2px_rgba(20,40,30,0.04),0_8px_24px_-12px_rgba(20,40,30,0.10)] backdrop-blur-[2px] ${className}`}
    >
      {children}
    </div>
  );
}

/** Kept as a thin alias so older call sites still work; PageHead is canonical. */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <PageHead title={title} lede={subtitle} />;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <Sparkle size={18} className="mx-auto mb-3 text-subtle/50" />
      <p className="mx-auto max-w-[42ch] text-sm leading-relaxed text-subtle">{children}</p>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-subtle">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-[10px] border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-subtle/70 transition-colors focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} resize-y ${props.className ?? ""}`} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

const VARIANTS = {
  primary: "bg-ink text-paper hover:bg-brand",
  ghost: "border border-line bg-surface/60 text-ink hover:border-ink hover:bg-brand-soft",
  danger: "border border-line text-down hover:border-down hover:bg-down-soft",
} as const;

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "muted" }) {
  const tones = {
    brand: "bg-ink text-paper",
    muted: "bg-transparent text-subtle ring-1 ring-line",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** "In 3 days" / "2 days ago" — friendlier than a bare date on cards. */
export function relativeDay(iso: string): string {
  const target = new Date(iso);
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(target) - midnight(new Date())) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
}
