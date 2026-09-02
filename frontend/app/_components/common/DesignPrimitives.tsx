import Image from "next/image";
import {
  forwardRef,
  useId,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";

type FieldMeta = {
  label: string;
  hint?: string;
  error?: string;
};

function fieldIds(id: string | undefined, generatedId: string, hint?: string, error?: string) {
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
      {label}
      {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
      {required ? <span className="sr-only"> required</span> : null}
    </label>
  );
}

function FieldMessages({ hint, error, hintId, errorId }: { hint?: string; error?: string; hintId: string; errorId: string }) {
  return (
    <>
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </>
  );
}

const controlClass =
  "w-full rounded-[var(--sabi-radius-md)] border bg-card text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & FieldMeta;

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const { controlId, hintId, errorId, describedBy } = fieldIds(id, generatedId, hint, error);

  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={controlId} label={label} required={required} />
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <input
        ref={ref}
        id={controlId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(controlClass, "min-h-11 px-3 py-2", error ? "border-destructive" : "border-input", className)}
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
});
Field.displayName = "Field";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta;
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, hint, error, id, className, required, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const { controlId, hintId, errorId, describedBy } = fieldIds(id, generatedId, hint, error);
  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={controlId} label={label} required={required} />
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <textarea
        ref={ref}
        id={controlId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(controlClass, "resize-y px-3 py-3 leading-6", error ? "border-destructive" : "border-input", className)}
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
});
TextareaField.displayName = "TextareaField";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & FieldMeta & { children: ReactNode };
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, id, className, required, children, ...props },
  ref,
) {
  const generatedId = useId();
  const { controlId, hintId, errorId, describedBy } = fieldIds(id, generatedId, hint, error);
  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={controlId} label={label} required={required} />
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      <select
        ref={ref}
        id={controlId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(controlClass, "min-h-11 px-3 py-2", error ? "border-destructive" : "border-input", className)}
        {...props}
      >
        {children}
      </select>
      {error ? <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
});
SelectField.displayName = "SelectField";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & FieldMeta;
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { label, hint, error, id, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const { controlId, hintId, errorId, describedBy } = fieldIds(id, generatedId, hint, error);
  return (
    <div className="grid gap-1.5">
      <label htmlFor={controlId} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--sabi-radius-md)] py-2 text-sm leading-6 text-foreground">
        <input
          ref={ref}
          id={controlId}
          type="checkbox"
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx("mt-0.5 h-5 w-5 shrink-0 accent-[var(--sabi-primary)]", className)}
          {...props}
        />
        <span>{label}{required ? <span className="sr-only"> required</span> : null}</span>
      </label>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
CheckboxField.displayName = "CheckboxField";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-[var(--sabi-radius-lg)] border border-border bg-card text-card-foreground shadow-[var(--sabi-shadow-sm)]", className)} {...props} />;
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";
const badgeTone: Record<StatusTone, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-[var(--sabi-success-soft)] text-[var(--sabi-primary-strong)]",
  warning: "bg-[var(--sabi-warning-soft)] text-foreground",
  danger: "bg-[var(--sabi-danger-soft)] text-destructive",
  info: "bg-[var(--sabi-info-soft)] text-[var(--sabi-info)]",
};

export function StatusBadge({ children, tone = "neutral", className }: { children: ReactNode; tone?: StatusTone; className?: string }) {
  return <span className={clsx("inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTone[tone], className)}>{children}</span>;
}

type StateTone = "empty" | "info" | "warning" | "error" | "success";
const stateTone: Record<StateTone, string> = {
  empty: "border-border bg-card",
  info: "border-[var(--sabi-info)]/30 bg-[var(--sabi-info-soft)]",
  warning: "border-accent/60 bg-[var(--sabi-warning-soft)]",
  error: "border-destructive/40 bg-[var(--sabi-danger-soft)]",
  success: "border-primary/30 bg-[var(--sabi-success-soft)]",
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
    <section className={clsx("rounded-[var(--sabi-radius-lg)] border p-5", stateTone[tone], className)} role={tone === "error" ? "alert" : tone === "success" ? "status" : undefined}>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

type InlineAlertTone = Exclude<StateTone, "empty"> | "danger";
export function InlineAlert({
  children,
  tone = "info",
  title,
  className,
}: {
  children: ReactNode;
  tone?: InlineAlertTone;
  title?: string;
  className?: string;
}) {
  const resolvedTone: Exclude<StateTone, "empty"> = tone === "danger" ? "error" : tone;
  return (
    <div
      role={resolvedTone === "error" ? "alert" : "status"}
      className={clsx("rounded-[var(--sabi-radius-md)] border px-4 py-3 text-sm font-medium leading-6", stateTone[resolvedTone], className)}
    >
      {title ? <p className="mb-1 font-bold text-foreground">{title}</p> : null}
      {children}
    </div>
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
