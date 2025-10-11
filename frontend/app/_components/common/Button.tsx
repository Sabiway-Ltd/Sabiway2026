"use client";

import { motion, MotionProps } from "framer-motion";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    variant?: "normal" | "primary" | "secondary" | "danger" | "ghost";
    className?: string;
  };

export default function Button({
  children,
  variant = "normal",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "rounded-full font-medium transition-all duration-150 focus:outline-none";

  const variantStyles = {
    normal: "bg-inherit text-inherit px-1 md:px-3",
    primary: "bg-[#008753] text-white hover:bg-[#007046] px-3",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 px-3",
    danger: "bg-red-600 text-white hover:bg-red-700 px-3",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 px-3",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
