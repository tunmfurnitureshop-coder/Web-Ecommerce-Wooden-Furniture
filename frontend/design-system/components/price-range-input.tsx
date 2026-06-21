"use client";
import { cn } from "@/lib/utils";
import type { ChangeEvent } from "react";

interface PriceRangeInputProps {
  min: number | "";
  max: number | "";
  onMinChange: (value: number | "") => void;
  onMaxChange: (value: number | "") => void;
  currency?: string;
  className?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function PriceRangeInput({
  min, max, onMinChange, onMaxChange,
  currency = "VND", className, minLabel = "Min", maxLabel = "Max",
}: PriceRangeInputProps) {
  const handleChange = (setter: (v: number | "") => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setter(val === "" ? "" : Number(val));
  };

  const inputClass = cn(
    "w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm",
    "placeholder:text-text-muted text-text-primary",
    "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
    "transition-colors"
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1">
        <label className="text-xs text-text-muted block mb-1">{minLabel}</label>
        <input
          type="number"
          min={0}
          value={min}
          onChange={handleChange(onMinChange)}
          placeholder="0"
          className={inputClass}
          aria-label={`${minLabel} price`}
        />
      </div>
      <span className="text-text-muted text-sm pt-5">—</span>
      <div className="flex-1">
        <label className="text-xs text-text-muted block mb-1">{maxLabel}</label>
        <input
          type="number"
          min={0}
          value={max}
          onChange={handleChange(onMaxChange)}
          placeholder="∞"
          className={inputClass}
          aria-label={`${maxLabel} price`}
        />
      </div>
    </div>
  );
}
