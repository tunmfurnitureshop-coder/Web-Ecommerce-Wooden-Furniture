"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { getAdminRooms, updateRoomImage } from "@/features/room/room.api";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import type { AdminRoomItem } from "@/features/room/room.types";

export default function AdminRoomsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { status, data, reload } = usePageData(() => getAdminRooms(locale));
  const rooms = data?.items ?? [];
  const [savingId, setSavingId] = useState<string | null>(null);

  const persist = async (room: AdminRoomItem, url: string) => {
    setSavingId(room.id);
    try {
      await updateRoomImage(room.id, url || null, locale);
      reload();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t("rooms")}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t("roomsSubtitle")}</p>
      </div>
      <PageState
        status={status}
        isEmpty={rooms.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tCommon("retry")}
        emptyIcon={<LayoutGrid className="h-10 w-10" />}
        emptyTitle={t("noRooms")}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-lg border border-border-default bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-medium text-text-primary">{room.name}</span>
                <span className="font-mono text-xs text-text-muted">{room.code}</span>
              </div>
              <ImageUploadField
                label={t("roomImage")}
                value={room.imageUrl ?? ""}
                onChange={(url) => persist(room, url)}
                prefix="rooms"
              />
              {savingId === room.id && (
                <p className="mt-2 text-xs text-text-muted">{tCommon("saving")}</p>
              )}
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
}
