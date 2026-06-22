"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface CartRecoveryBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function CartRecoveryBanner({ message, onDismiss }: CartRecoveryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-focus bg-brand-soft px-4 py-3 text-sm text-brand">
      <span>{message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Đóng"
        className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
