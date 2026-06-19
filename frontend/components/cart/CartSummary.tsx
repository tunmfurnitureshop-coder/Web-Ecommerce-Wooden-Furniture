import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatVnd } from "@/lib/format-currency";
import type { CartHydrateResponse } from "@/features/cart/cart.types";

interface Props {
  hydrated: CartHydrateResponse;
}

export function CartSummary({ hydrated }: Props) {
  const t = useTranslations("cart");
  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="border rounded-lg p-6 space-y-4 sticky top-4">
        <h2 className="font-semibold">{t("total")}</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span>{formatVnd(hydrated.subtotalVnd)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>{t("total")}</span>
          <span className="text-primary">{formatVnd(hydrated.totalVnd)}</span>
        </div>
        <Link href="/checkout">
          <Button className="w-full">{t("checkout")}</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" className="w-full">{t("continueShopping")}</Button>
        </Link>
      </div>
    </div>
  );
}
