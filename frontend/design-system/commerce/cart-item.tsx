"use client";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "../components/quantity-stepper";

export interface CartItemViewModel {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  selectedOptionsLabel: string[];
  quantity: number;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  availabilityState: "AVAILABLE" | "OUT_OF_STOCK" | "PRICE_CHANGED";
  maxQuantity?: number;
}

interface CartItemProps {
  item: CartItemViewModel;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  removeLabel?: string;
  outOfStockLabel?: string;
  priceChangedLabel?: string;
  className?: string;
}

export function CartItem({
  item, onQuantityChange, onRemove,
  removeLabel = "Remove", outOfStockLabel = "Out of stock", priceChangedLabel = "Price changed",
  className,
}: CartItemProps) {
  return (
    <div className={cn("flex gap-4 py-4", className)}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="80px" />
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{item.productName}</p>
            {item.selectedOptionsLabel.map((opt, i) => (
              <p key={i} className="text-xs text-text-muted">{opt}</p>
            ))}
          </div>
          <button
            type="button"
            aria-label={`${removeLabel} ${item.productName}`}
            onClick={() => onRemove(item.id)}
            className="shrink-0 text-text-muted hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {item.availabilityState !== "AVAILABLE" && (
          <p className="text-xs text-danger font-medium">
            {item.availabilityState === "OUT_OF_STOCK" ? outOfStockLabel : priceChangedLabel}
          </p>
        )}

        <div className="flex items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            onChange={(qty) => onQuantityChange(item.id, qty)}
            min={1}
            max={item.maxQuantity ?? 99}
            disabled={item.availabilityState === "OUT_OF_STOCK"}
          />
          <p className="text-sm font-semibold text-text-primary">{item.lineTotalFormatted}</p>
        </div>
      </div>
    </div>
  );
}
