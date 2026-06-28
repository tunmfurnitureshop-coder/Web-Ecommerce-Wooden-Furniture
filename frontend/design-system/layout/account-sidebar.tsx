"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ACCOUNT_NAV_ITEMS } from "./account-nav-items";

export function AccountSidebar() {
  const pathname = usePathname();
  const t = useTranslations("account.nav");

  return (
    <nav aria-label={t("ariaLabel")} className="flex flex-col gap-1">
      {ACCOUNT_NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
              active
                ? "bg-brand-soft text-brand"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
