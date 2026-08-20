"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";

export function AuthPasswordField({
  name = "password",
  value,
  onChange,
  label = "Password",
  autoComplete,
  placeholder = "Password",
}: {
  name?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}<span className="sr-only"> required</span></label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-h-12 w-full rounded-[var(--sabi-radius-md)] border border-input bg-card px-3 py-2 pr-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 flex h-10 min-h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
