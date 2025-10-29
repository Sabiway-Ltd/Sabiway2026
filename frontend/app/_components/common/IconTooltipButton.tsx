// app/_components/common/IconTooltipButton.tsx


"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface IconTooltipButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  bg?: string;
  textColor?: string;
  tooltipBg?: string;
  tooltipTextColor?: string;
  size?: number;
}

export default function IconTooltipButton({
  onClick,
  icon: Icon,
  label,
  bg = "bg-transparent",
  textColor = "text-[#008753]",
  tooltipBg = "bg-black",
  tooltipTextColor = "text-white",
  size = 20,
}: IconTooltipButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={onClick}
        className={`${bg} ${textColor} p-2 rounded-full transition relative`}
        whileHover={{ scale: 1.05 }}
      >
        <Icon className="transition" style={{ width: size, height: size }} />
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-9 px-2 py-1 rounded-md shadow-lg whitespace-nowrap text-[10px] ${tooltipBg} ${tooltipTextColor}`}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
