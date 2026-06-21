"use client";

import { useState } from "react";
import { useRouter } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { adminCreateCollection } from "@/features/admin/admin.api";
import { CollectionForm } from "@/components/admin/CollectionForm";

export default function NewCollectionPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("createCollection")}</h1>
      <CollectionForm
        saving={saving}
        onSave={async (data) => {
          setSaving(true);
          try {
            await adminCreateCollection(data);
            router.push("/admin/collections");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
