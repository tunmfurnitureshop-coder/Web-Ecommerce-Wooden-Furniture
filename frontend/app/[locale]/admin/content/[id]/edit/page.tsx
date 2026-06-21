"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { adminGetContent, adminUpdateContent, adminAddContentProduct, adminRemoveContentProduct, adminListProducts } from "@/features/admin/admin.api";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { Button } from "@/components/ui/button";
import type { AdminContent } from "@/features/admin/admin.types";
import type { AdminProductListItem } from "@/features/admin/admin.types";

export default function EditContentPage({ params }: { params: { id: string } }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [content, setContent] = useState<AdminContent | null>(null);
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const load = () => {
    adminGetContent(params.id).then(setContent).catch(console.error);
    adminListProducts().then((r) => setProducts(r.items)).catch(console.error);
  };

  useEffect(() => { load(); }, [params.id]);

  if (!content) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  const linkedProductIds = new Set(content.linked_products.map((p) => p.product_id));
  const filtered = products.filter((p) => {
    const name = (p as AdminProductListItem & { nameVi: string }).nameVi?.toLowerCase() ?? "";
    return !searchQ || p.sku.toLowerCase().includes(searchQ.toLowerCase()) || name.includes(searchQ.toLowerCase());
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-6">{t("editContent")}</h1>
        <ContentEditor
          initial={content}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              await adminUpdateContent(content.id, data);
              router.push("/admin/content");
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("linkedProducts")} ({content.linked_products.length})</h2>
        <div className="mb-4">
          <input
            className="w-full max-w-xs rounded border px-3 py-1.5 text-sm"
            placeholder="Tìm sản phẩm..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto max-h-64 border rounded">
          <table className="w-full text-sm">
            <tbody>
              {filtered.slice(0, 30).map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="py-2 px-3">{(p as AdminProductListItem & { nameVi: string }).nameVi}</td>
                  <td className="py-2 px-3 text-right">
                    {linkedProductIds.has(p.id) ? (
                      <Button size="sm" variant="destructive" onClick={async () => { await adminRemoveContentProduct(content.id, p.id); load(); }}>
                        {t("removeProduct")}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={async () => { await adminAddContentProduct(content.id, p.id); load(); }}>
                        {t("addProduct")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
