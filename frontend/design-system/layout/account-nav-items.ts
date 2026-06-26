import { User, Package, Heart, MapPin } from "lucide-react";

/** Shared account navigation — consumed by AccountSidebar (desktop) and
 * AccountMobileNav (mobile tab strip). Labels resolve under `account.nav`. */
export const ACCOUNT_NAV_ITEMS = [
  { href: "/account/profile", icon: User, labelKey: "profile" },
  { href: "/account/orders", icon: Package, labelKey: "orders" },
  { href: "/account/wishlist", icon: Heart, labelKey: "wishlist" },
  { href: "/account/addresses", icon: MapPin, labelKey: "addresses" },
] as const;
