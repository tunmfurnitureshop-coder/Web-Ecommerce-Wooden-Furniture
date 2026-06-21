"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioCard({ name, value, checked, onChange, children, disabled, className }: RadioCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer rounded-md border p-3 transition-colors",
        checked
          ? "border-brand bg-brand-soft ring-1 ring-brand"
          : "border-border-default bg-surface hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="sr-only"
      />
      {children}
    </label>
  );
}
