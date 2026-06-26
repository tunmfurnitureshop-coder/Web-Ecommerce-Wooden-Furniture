"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessagesSquare, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isFunnelRoute, isProductDetailRoute } from "@/lib/layout/chrome-routes";
import { getContactChannels, type ContactChannelId } from "@/lib/contact/channels";
import { ContactChannelButton } from "./contact-channel-button";

export function ContactFab() {
  const t = useTranslations("contact");
  const pathname = usePathname();
  // On funnel routes the bottom nav is gone, so the FAB drops back to the base offset.
  const onFunnel = isFunnelRoute(pathname);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const panelId = useId();
  const headingId = `${panelId}-heading`;

  // Values are derived from inlined env; the array reference is rebuilt each render.
  const channels = getContactChannels();

  // Move focus into the panel on open; restore to the trigger on close.
  // Skip the initial mount so we never steal focus on page load.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (open) {
      panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  // Close on Escape from anywhere while open (not just when focus is in the panel).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // PDP has its own inquiry CTA + sticky add-to-cart owning the bottom-right.
  if (channels.length === 0 || isProductDetailRoute(pathname)) return null;

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col items-end gap-3",
        onFunnel
          ? "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
          : "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem+var(--bottom-nav-height))] md:bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]",
      )}
    >
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          aria-labelledby={headingId}
          className="w-60 rounded-lg border border-border-default bg-surface p-3 shadow-lg"
        >
          <p id={headingId} className="mb-2 px-1 text-sm font-semibold text-text-primary">
            {t("heading")}
          </p>
          <div className="flex flex-col gap-2">
            {channels.map((channel) => (
              <ContactChannelButton
                key={channel.id}
                channel={channel}
                label={t(`channels.${channel.id}` as `channels.${ContactChannelId}`)}
                variant="fab"
              />
            ))}
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? t("closeLabel") : t("openLabel")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-text-inverse shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessagesSquare className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
