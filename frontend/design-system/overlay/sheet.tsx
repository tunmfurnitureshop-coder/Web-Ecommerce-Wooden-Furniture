"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/design-system/primitives/visually-hidden";

type SheetSide = "bottom" | "right";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required for screen readers (Radix Dialog.Title). Pass an i18n string. */
  title: string;
  /** aria-label for the close button. Pass an i18n string; omit to hide the close button. */
  closeLabel?: string;
  /** Visually hide the header bar — title is still announced to screen readers. */
  hideHeader?: boolean;
  side?: SheetSide;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const contentBySide: Record<SheetSide, string> = {
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t " +
    "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  right:
    "inset-y-0 right-0 w-[88%] max-w-sm border-l " +
    "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

/**
 * Accessible bottom/side sheet built on Radix Dialog — focus trap, scroll lock,
 * ESC + backdrop close come for free. Reused for the mobile category menu (P1)
 * and the PLP filter sheet (P2). i18n-agnostic: caller passes `title`/`closeLabel`.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  hideHeader = false,
  side = "bottom",
  children,
  footer,
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col bg-surface text-text-primary shadow-md border-border-default pb-safe-b",
            "focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
            contentBySide[side],
            className,
          )}
        >
          {hideHeader ? (
            <VisuallyHidden>
              <Dialog.Title>{title}</Dialog.Title>
            </VisuallyHidden>
          ) : (
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-default px-4 py-3">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              {closeLabel && (
                <Dialog.Close
                  aria-label={closeLabel}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <X className="h-5 w-5" aria-hidden />
                </Dialog.Close>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

          {footer && (
            <div className="shrink-0 border-t border-border-default px-4 py-3">{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
