"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ACCOUNT_NAV_ITEMS } from "./account-nav-items";

/** Horizontal scrollable account nav for mobile — replaces the hidden sidebar
 * on `<md`. Reuses ACCOUNT_NAV_ITEMS so it stays in sync with AccountSidebar. */
export function AccountMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("account.nav");

  return (
    <nav aria-label={t("ariaLabel")} className="mb-6 overflow-x-auto md:hidden">
      <div className="flex min-w-max gap-2">
        {ACCOUNT_NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border-default text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
