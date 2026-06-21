"use client";

import { useRouter, usePathname } from "@/lib/i18n";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROOMS = [
  { code: "living_room", label: "Phòng khách" },
  { code: "bedroom", label: "Phòng ngủ" },
  { code: "dining_room", label: "Phòng ăn" },
  { code: "office", label: "Văn phòng" },
  { code: "outdoor", label: "Ngoài trời" },
];

const WOOD_TYPES = [
  { code: "oak", label: "Gỗ sồi" },
  { code: "walnut", label: "Gỗ óc chó" },
  { code: "ash", label: "Gỗ tần bì" },
  { code: "rubberwood", label: "Gỗ cao su" },
];

interface ProductFiltersProps {
  currentFilters: {
    room?: string;
    woodType?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export function ProductFilters({ currentFilters }: ProductFiltersProps) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [room, setRoom] = useState(currentFilters.room ?? "");
  const [woodType, setWoodType] = useState(currentFilters.woodType ?? "");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice ?? "");

  function apply() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const sort = searchParams.get("sort");
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    if (room) params.set("room", room);
    if (woodType) params.set("woodType", woodType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    setRoom(""); setWoodType(""); setMinPrice(""); setMaxPrice("");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border">
      <div className="space-y-2">
        <Label>{t("room")}</Label>
        <Select value={room} onValueChange={setRoom}>
          <SelectTrigger>
            <SelectValue placeholder={t("all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("all")}</SelectItem>
            {ROOMS.map((r) => (
              <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("woodType")}</Label>
        <Select value={woodType} onValueChange={setWoodType}>
          <SelectTrigger>
            <SelectValue placeholder={t("all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("all")}</SelectItem>
            {WOOD_TYPES.map((w) => (
              <SelectItem key={w.code} value={w.code}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("minPrice")}</Label>
        <Input
          type="number"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("maxPrice")}</Label>
        <Input
          type="number"
          placeholder="100000000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={apply}>{t("apply")}</Button>
        <Button variant="outline" onClick={reset}>{t("reset")}</Button>
      </div>
    </div>
  );
}
