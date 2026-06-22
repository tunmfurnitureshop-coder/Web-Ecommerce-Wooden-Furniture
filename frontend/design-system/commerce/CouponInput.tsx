"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  onApply: (code: string) => void;
  onRemove?: () => void;
  appliedCode?: string | null;
  errorMessage?: string | null;
  loading?: boolean;
  inputLabel: string;
  applyLabel: string;
  removeLabel: string;
  placeholder?: string;
}

export function CouponInput({
  onApply,
  onRemove,
  appliedCode,
  errorMessage,
  loading,
  inputLabel,
  applyLabel,
  removeLabel,
  placeholder,
}: CouponInputProps) {
  const [value, setValue] = useState("");

  function handleApply() {
    const trimmed = value.trim();
    if (trimmed) onApply(trimmed);
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success bg-success-bg px-3 py-2 text-sm">
        <span className="font-mono font-medium text-success">{appliedCode}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-text-muted hover:text-danger text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        >
          {removeLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-primary">{inputLabel}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder={placeholder}
          className={cn(
            "flex-1 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
            errorMessage ? "border-danger" : "border-border-default"
          )}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !value.trim()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          {loading ? "..." : applyLabel}
        </button>
      </div>
      {errorMessage && (
        <p className="text-xs text-danger">{errorMessage}</p>
      )}
    </div>
  );
}
