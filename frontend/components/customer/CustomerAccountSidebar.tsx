"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useRouter } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/account/profile", key: "profile" },
  { href: "/account/addresses", key: "addresses" },
  { href: "/account/orders", key: "orders" },
  { href: "/account/wishlist", key: "wishlist" },
] as const;

export function CustomerAccountSidebar() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  const { logout } = useCustomerAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <nav className="w-48 flex-shrink-0 space-y-1">
      {NAV_LINKS.map(({ href, key }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "block px-3 py-2 rounded-md text-sm transition-colors",
            pathname.includes(href.replace("/account/", ""))
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {t(key)}
        </Link>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground px-3"
        onClick={handleLogout}
      >
        {t("logout")}
      </Button>
    </nav>
  );
}
