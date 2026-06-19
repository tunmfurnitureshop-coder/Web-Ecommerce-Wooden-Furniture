import { getTranslations } from "next-intl/server";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("createProduct")}</h1>
      <ProductForm />
    </div>
  );
}
