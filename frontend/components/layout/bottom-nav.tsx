"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, LayoutGrid, ShoppingCart, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFunnelRoute } from "@/lib/layout/chrome-routes";
import { useCartStore } from "@/features/cart/cart.store";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { MobileCategorySheet } from "./mobile-category-sheet";

const tabClass =
  "relative flex h-bottom-nav flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus";

function TabInner({
  icon: Icon,
  label,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <>
      <span className="relative">
        <Icon className="h-5 w-5" aria-hidden />
        {badge != null && badge > 0 && (
          <span
            className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-text-inverse"
            aria-hidden
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </>
  );
}

/**
 * Mobile bottom tab bar (4 tabs). Hidden on `md+` (desktop header takes over)
 * and during the cart/checkout funnel where a sticky CTA takes its place (P4).
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { customer } = useCustomerAuth();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Focus mode — sticky checkout CTA replaces the bar here (P4).
  if (isFunnelRoute(pathname)) return null;

  const isHome = pathname === "/";
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/login");

  return (
    <>
      <nav
        aria-label={t("bottomNavLabel")}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border-default bg-surface pb-safe-b md:hidden"
      >
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={cn(tabClass, isHome ? "text-brand" : "text-text-secondary")}
        >
          <TabInner icon={Home} label={t("home")} />
        </Link>

        <button
          type="button"
          onClick={() => setCategoryOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={categoryOpen}
          className={cn(tabClass, categoryOpen ? "text-brand" : "text-text-secondary")}
        >
          <TabInner icon={LayoutGrid} label={t("categories")} />
        </button>

        <Link
          href="/cart"
          aria-label={`${t("cart")}${itemCount > 0 ? `, ${itemCount}` : ""}`}
          className={cn(tabClass, "text-text-secondary")}
        >
          <TabInner icon={ShoppingCart} label={t("cart")} badge={itemCount} />
        </Link>

        <Link
          href={customer ? "/account/profile" : "/login"}
          aria-current={isAccount ? "page" : undefined}
          className={cn(tabClass, isAccount ? "text-brand" : "text-text-secondary")}
        >
          <TabInner icon={User} label={t("account")} />
        </Link>
      </nav>

      {/* Reserve in-flow space so the fixed bar never covers page-bottom content
          (incl. the footer). Co-located with the bar, so funnel routes that hide
          the bar get no dead space. */}
      <div
        aria-hidden
        className="h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:hidden"
      />

      <MobileCategorySheet open={categoryOpen} onOpenChange={setCategoryOpen} />
    </>
  );
}
