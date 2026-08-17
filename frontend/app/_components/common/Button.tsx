"use client";

import { motion, type MotionProps, useReducedMotion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    variant?: "normal" | "primary" | "secondary" | "danger" | "ghost";
    className?: string;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = "normal", className = "", disabled, ...props },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const baseStyles =
    "min-h-11 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantStyles = {
    normal: "bg-inherit text-inherit px-2 md:px-3",
    primary: "bg-primary text-primary-foreground hover:bg-[var(--sabi-primary-strong)] px-4",
    secondary: "bg-secondary text-secondary-foreground hover:brightness-95 px-4",
    danger: "bg-destructive text-white hover:brightness-90 px-4",
    ghost: "bg-transparent text-foreground hover:bg-muted px-4",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={clsx(baseStyles, variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export default Button;
