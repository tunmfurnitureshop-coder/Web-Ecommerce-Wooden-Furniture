/** Routes where the mobile bottom nav steps aside for a sticky checkout CTA (P4). */
export const FUNNEL_ROUTE_PREFIXES = ["/cart", "/checkout"] as const;

/** True when the locale-stripped pathname is part of the cart/checkout funnel. */
export function isFunnelRoute(pathname: string): boolean {
  return FUNNEL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
