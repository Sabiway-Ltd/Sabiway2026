"use client";

import { motion, type MotionProps, useReducedMotion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "normal" | "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    loadingLabel?: string;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    className?: string;
  };

const variantStyles: Record<ButtonVariant, string> = {
  normal: "bg-transparent text-foreground hover:bg-muted",
  primary: "bg-primary text-primary-foreground hover:bg-[var(--sabi-primary-strong)]",
  secondary: "bg-secondary text-secondary-foreground hover:bg-[var(--sabi-surface-selected)]",
  danger: "bg-destructive text-white hover:brightness-90",
  ghost: "bg-transparent text-foreground hover:bg-muted",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-11 rounded-[var(--sabi-radius-md)] px-3 text-sm",
  md: "min-h-11 rounded-[var(--sabi-radius-md)] px-4 text-sm",
  lg: "min-h-12 rounded-[var(--sabi-radius-md)] px-5 text-base",
  icon: "h-11 min-h-11 w-11 rounded-full p-0",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "normal",
    size = "md",
    loading = false,
    loadingLabel = "Working…",
    leadingIcon,
    trailingIcon,
    className = "",
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const unavailable = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={reduceMotion || unavailable ? undefined : { scale: 1.015 }}
      whileTap={reduceMotion || unavailable ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[var(--sabi-focus-ring-width)] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={unavailable}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
          {size === "icon" ? <span className="sr-only">{loadingLabel}</span> : loadingLabel}
        </>
      ) : (
        <>
          {leadingIcon ? <span className="shrink-0" aria-hidden="true">{leadingIcon}</span> : null}
          {children}
          {trailingIcon ? <span className="shrink-0" aria-hidden="true">{trailingIcon}</span> : null}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = "Button";

export default Button;
