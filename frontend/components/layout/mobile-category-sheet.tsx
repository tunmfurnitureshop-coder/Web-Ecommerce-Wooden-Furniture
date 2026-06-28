"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/design-system/overlay/sheet";

// Mirrors the storefront's canonical destinations (see Footer) so mobile users
// reach the same places desktop users do.
const ROOMS = ["living_room", "bedroom", "dining_room", "outdoor"] as const;

interface MobileCategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SheetLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-[44px] items-center justify-between rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
    </Link>
  );
}

export function MobileCategorySheet({ open, onOpenChange }: MobileCategorySheetProps) {
  const t = useTranslations("mobileMenu");
  const tf = useTranslations("footer");
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("title")} closeLabel={t("close")}>
      <nav className="flex flex-col" aria-label={t("title")}>
        <SheetLink href="/products" label={t("allProducts")} onNavigate={close} />

        <p className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("byRoom")}
        </p>
        {ROOMS.map((room) => (
          <SheetLink
            key={room}
            href={`/products?room=${room}`}
            label={tf(`rooms.${room}`)}
            onNavigate={close}
          />
        ))}

        <div className="my-2 border-t border-border-default" />
        <SheetLink href="/collections" label={t("collections")} onNavigate={close} />
        <SheetLink href="/guides" label={t("guides")} onNavigate={close} />
        <SheetLink href="/lien-he" label={t("contact")} onNavigate={close} />
      </nav>
    </Sheet>
  );
}
