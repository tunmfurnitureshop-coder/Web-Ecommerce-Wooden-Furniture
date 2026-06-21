"use client";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  isWishlisted: boolean;
  onToggle: (id: string, wishlisted: boolean) => void;
  className?: string;
  wishlistLabel?: string;
  removeLabel?: string;
}

export function WishlistButton({
  productId,
  isWishlisted,
  onToggle,
  className,
  wishlistLabel = "Add to wishlist",
  removeLabel = "Remove from wishlist",
}: WishlistButtonProps) {
  const [optimistic, setOptimistic] = useState(isWishlisted);
  const label = optimistic ? removeLabel : wishlistLabel;

  const handleClick = () => {
    const next = !optimistic;
    setOptimistic(next);
    onToggle(productId, next);
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-xs transition-colors",
        "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          optimistic ? "fill-danger text-danger" : "text-text-secondary"
        )}
        aria-hidden
      />
    </button>
  );
}
