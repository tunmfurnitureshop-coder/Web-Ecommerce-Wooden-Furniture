"use client";

import { useState } from "react";
import { useRouter } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { adminCreateContent } from "@/features/admin/admin.api";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default function NewContentPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("createContent")}</h1>
      <ContentEditor
        saving={saving}
        onSave={async (data) => {
          setSaving(true);
          try {
            await adminCreateContent(data);
            router.push("/admin/content");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
