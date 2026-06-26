"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { adminListCollections } from "@/features/admin/admin.api";
import { getAdminRooms } from "@/features/room/room.api";

const SELECT_CLASS =
  "w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm";

interface Option {
  id: string;
  label: string;
}

interface Props {
  locale: string;
  targetType: string;
  targetId: string;
  onChange: (targetType: string, targetId: string) => void;
}

/** Campaign target picker: choose COLLECTION or CATEGORY, then the concrete
 * entity. Shared by the create + edit campaign forms. Changing the type clears
 * the selected id so the two stay consistent. */
export function CampaignTargetField({ locale, targetType, targetId, onChange }: Props) {
  const t = useTranslations("admin");
  const [collections, setCollections] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);

  useEffect(() => {
    adminListCollections()
      .then((r) =>
        setCollections(
          r.items.map((c) => ({
            id: c.id,
            label: c.translations.find((tr) => tr.locale === "vi")?.name ?? c.code,
          })),
        ),
      )
      .catch(() => {});
    getAdminRooms(locale)
      .then((r) => setRooms(r.items.map((rm) => ({ id: rm.id, label: rm.name }))))
      .catch(() => {});
  }, [locale]);

  const entities =
    targetType === "COLLECTION" ? collections : targetType === "CATEGORY" ? rooms : [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>{t("targetType")}</Label>
        <select
          value={targetType}
          onChange={(e) => onChange(e.target.value, "")}
          className={SELECT_CLASS}
        >
          <option value="">{t("targetTypeNone")}</option>
          <option value="COLLECTION">{t("targetCollection")}</option>
          <option value="CATEGORY">{t("targetCategory")}</option>
        </select>
      </div>
      {targetType && (
        <div className="space-y-1.5">
          <Label>{t("targetEntity")}</Label>
          <select
            value={targetId}
            onChange={(e) => onChange(targetType, e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">—</option>
            {entities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
