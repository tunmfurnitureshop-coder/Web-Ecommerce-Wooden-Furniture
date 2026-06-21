"use client";
import { useTranslations } from "next-intl";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";

export default function WishlistPage() {
  const t = useTranslations("wishlist");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">{t("title")}</h1>
      <WishlistGrid />
    </div>
  );
}
