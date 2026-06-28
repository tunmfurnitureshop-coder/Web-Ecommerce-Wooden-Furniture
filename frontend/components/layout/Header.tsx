"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ShoppingCart, Heart, User, Globe, TreePine, Search } from "lucide-react";
import { useCartStore } from "@/features/cart/cart.store";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { IconButton } from "@/design-system/components/icon-button";
import { VisuallyHidden } from "@/design-system/primitives/visually-hidden";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-CN", label: "中文" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const { customer } = useCustomerAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border-default bg-surface">
        <div className="mx-auto flex h-header-mobile md:h-header-desktop max-w-container items-center justify-between gap-6 px-4 md:px-8 xl:px-12">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-text-primary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            <TreePine className="h-6 w-6 text-brand" aria-hidden />
            <span className="font-display">Vin Furniture</span>
          </Link>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" aria-label={t("mainNavLabel")}>
            <Link
              href="/products"
              className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              {t("products")}
            </Link>
            <Link
              href="/products?room=living_room"
              className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              {t("rooms")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {/* Search */}
            <IconButton
              label={t("search")}
              icon={<Search className="h-5 w-5" />}
              onClick={openSearch}
              size="md"
            />

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              aria-label={t("wishlist")}
            >
              <Heart className="h-5 w-5 text-text-secondary" aria-hidden />
            </Link>

            {/* Account */}
            <Link
              href={customer ? "/account/profile" : "/login"}
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              aria-label={customer ? t("account") : t("login")}
            >
              <User className="h-5 w-5 text-text-secondary" aria-hidden />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              aria-label={`${t("cart")}${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <ShoppingCart className="h-5 w-5 text-text-secondary" aria-hidden />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-text-inverse text-[10px] font-bold"
                  aria-hidden
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Locale switcher */}
            <div className="relative">
              <IconButton
                label={t("switchLanguage")}
                icon={<Globe className="h-5 w-5" />}
                onClick={() => setLocaleOpen((o) => !o)}
                size="md"
              />
              {localeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLocaleOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-md border border-border-default bg-surface shadow-sm py-1">
                    {LOCALES.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
                        onClick={() => {
                          router.replace("/", { locale: code });
                          setLocaleOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
