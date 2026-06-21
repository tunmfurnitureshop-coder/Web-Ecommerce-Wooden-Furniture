"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  readonly?: boolean;
}

export function RatingStars({ value, onChange, size = "md", readonly = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const active = readonly ? value : (hovered || value);

  return (
    <div
      className={cn("flex items-center gap-0.5", !readonly && "cursor-pointer")}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "transition-colors",
            star <= active
              ? "fill-yellow-400 stroke-yellow-400"
              : "fill-transparent stroke-muted-foreground/40"
          )}
          onMouseEnter={() => !readonly && setHovered(star)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
}
