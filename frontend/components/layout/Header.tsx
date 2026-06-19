"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { ShoppingCart, TreePine } from "lucide-react";
import { useCartStore } from "@/features/cart/cart.store";
import { Button } from "@/components/ui/button";

export function Header() {
  const t = useTranslations();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <TreePine className="h-6 w-6 text-primary" />
          <span>Vin Furniture</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-primary transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/products" className="hover:text-primary transition-colors">
            {t("nav.products")}
          </Link>
        </nav>

        <Link href="/cart">
          <Button variant="outline" size="sm" className="relative">
            <ShoppingCart className="h-4 w-4" />
            <span className="ml-2">{t("nav.cart")}</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
