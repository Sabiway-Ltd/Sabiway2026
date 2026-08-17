import Image from "next/image";
import { forwardRef, useId, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
        {label}{required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
        {required ? <span className="sr-only"> required</span> : null}
      </label>
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(
          "min-h-11 w-full rounded-[var(--sabi-radius-md)] border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
          error ? "border-destructive" : "border-input",
          className,
        )}
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
});

Field.displayName = "Field";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-[var(--sabi-radius-lg)] border border-border bg-card text-card-foreground shadow-[var(--sabi-shadow-sm)]", className)} {...props} />;
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";
const badgeTone: Record<StatusTone, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-[color-mix(in_srgb,var(--sabi-success)_12%,white)] text-[var(--sabi-primary-strong)]",
  warning: "bg-[color-mix(in_srgb,var(--sabi-warning)_20%,white)] text-foreground",
  danger: "bg-[color-mix(in_srgb,var(--sabi-danger)_10%,white)] text-destructive",
  info: "bg-[color-mix(in_srgb,var(--sabi-info)_10%,white)] text-[var(--sabi-info)]",
};

export function StatusBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: StatusTone; className?: string }) {
  return <span className={clsx("inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTone[tone], className)}>{children}</span>;
}

type StateTone = "empty" | "info" | "warning" | "error" | "success";
const stateTone: Record<StateTone, string> = {
  empty: "border-border bg-card",
  info: "border-[var(--sabi-info)]/30 bg-card",
  warning: "border-accent bg-card",
  error: "border-destructive/40 bg-card",
  success: "border-primary/30 bg-card",
};

export function StatePanel({
  title,
  description,
  action,
  tone = "empty",
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: StateTone;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-[var(--sabi-radius-lg)] border p-5", stateTone[tone], className)} role={tone === "error" ? "alert" : undefined}>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SW";
  return (
    <span
      className={clsx("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-bold text-secondary-foreground", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" /> : initials}
    </span>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={clsx("animate-pulse rounded-[var(--sabi-radius-sm)] bg-muted motion-reduce:animate-none", className)} {...props} />;
}
