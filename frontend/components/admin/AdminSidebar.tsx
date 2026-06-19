"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", key: "dashboard" },
  { href: "/admin/products", key: "products" },
  { href: "/admin/orders", key: "orders" },
  { href: "/admin/inventory", key: "inventory" },
] as const;

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-card border-r flex flex-col">
      <div className="p-4 border-b font-bold text-sm">Admin Panel</div>
      <nav className="flex-1 py-4 space-y-1">
        {NAV.map(({ href, key }) => (
          <Link key={key} href={href}>
            <span className={cn(
              "block px-4 py-2 text-sm rounded mx-2 transition-colors",
              pathname.includes(href.replace("/admin/", ""))
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}>
              {t(key)}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
