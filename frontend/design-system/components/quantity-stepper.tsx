"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false, className }: QuantityStepperProps) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);

  return (
    <div className={cn("inline-flex items-center border border-border-default rounded-md", className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={disabled || value <= min}
        className="flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        className="flex h-9 min-w-[2.5rem] items-center justify-center border-x border-border-default px-2 text-sm font-medium tabular-nums"
        aria-live="polite"
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={disabled || value >= max}
        className="flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
