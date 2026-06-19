"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { adminCreateProduct, adminUpdateProduct } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminProduct } from "@/features/admin/admin.types";

const WOOD_TYPES = ["oak", "walnut", "ash", "rubberwood"];
const FINISHES = ["natural", "matte", "dark_brown", "walnut_tone"];
const SIZES = ["small", "medium", "large"];
const ROOMS = ["living_room", "bedroom", "dining_room", "office", "outdoor"];

interface Props {
  productId?: string;
  initialData?: AdminProduct;
}

export function ProductForm({ productId, initialData }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [room, setRoom] = useState("dining_room");
  const [basePrice, setBasePrice] = useState(initialData?.basePriceVnd?.toString() ?? "");
  const [status, setStatus] = useState<string>(initialData?.status ?? "ACTIVE");
  const [viName, setViName] = useState("");
  const [viSlug, setViSlug] = useState("");
  const [viShort, setViShort] = useState("");
  const [viDesc, setViDesc] = useState("");
  const [zhName, setZhName] = useState("");
  const [zhSlug, setZhSlug] = useState("");
  const [woodTypes, setWoodTypes] = useState<string[]>(["oak"]);
  const [finishes, setFinishes] = useState<string[]>(["natural"]);
  const [sizes, setSizes] = useState<string[]>(["medium"]);
  const [totalQty, setTotalQty] = useState(initialData?.inventory.totalQty.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleOption(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!viName || !viSlug) { setError("Tên và slug tiếng Việt là bắt buộc"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        sku, roomCategoryCode: room,
        basePriceVnd: Number(basePrice), status: status as "ACTIVE" | "INACTIVE",
        translations: {
          vi: { name: viName, slug: viSlug, shortDescription: viShort, description: viDesc, specifications: {} },
          ...(zhName ? { "zh-CN": { name: zhName, slug: zhSlug, shortDescription: "", description: "", specifications: {} } } : {}),
        },
        optionCodes: { woodTypes, finishes, sizes },
        inventory: { totalQty: Number(totalQty) },
      };
      if (productId) {
        await adminUpdateProduct(productId, payload);
      } else {
        await adminCreateProduct(payload);
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Phòng</Label>
          <Select value={room} onValueChange={setRoom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROOMS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Giá cơ bản (VND)</Label>
          <Input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-sm">Tiếng Việt (bắt buộc)</h3>
        <div className="space-y-2"><Label>Tên</Label><Input value={viName} onChange={(e) => setViName(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Slug</Label><Input value={viSlug} onChange={(e) => setViSlug(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Mô tả ngắn</Label><Input value={viShort} onChange={(e) => setViShort(e.target.value)} /></div>
        <div className="space-y-2"><Label>Mô tả chi tiết</Label><Textarea value={viDesc} onChange={(e) => setViDesc(e.target.value)} /></div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-sm">Tiếng Trung (tùy chọn)</h3>
        <div className="space-y-2"><Label>Tên</Label><Input value={zhName} onChange={(e) => setZhName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Slug</Label><Input value={zhSlug} onChange={(e) => setZhSlug(e.target.value)} /></div>
      </div>

      {[
        { label: "Loại gỗ", options: WOOD_TYPES, selected: woodTypes, set: setWoodTypes },
        { label: "Bề mặt", options: FINISHES, selected: finishes, set: setFinishes },
        { label: "Kích thước", options: SIZES, selected: sizes, set: setSizes },
      ].map(({ label, options, selected, set }) => (
        <div key={label} className="space-y-2">
          <Label>{label}</Label>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o} type="button"
                onClick={() => toggleOption(selected, set, o)}
                className={`px-3 py-1 text-sm rounded border transition-colors ${selected.includes(o) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"}`}
              >{o}</button>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <Label>Số lượng tồn kho</Label>
        <Input type="number" min={0} value={totalQty} onChange={(e) => setTotalQty(e.target.value)} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? t("saving") : t("saveProduct")}
      </Button>
    </form>
  );
}
