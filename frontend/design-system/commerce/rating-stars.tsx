import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}

export function RatingStars({ rating, count, size = "sm", className }: RatingStarsProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const displayRating = Math.round(rating * 10) / 10;

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rating: ${displayRating} out of 5${count !== undefined ? `, ${count} reviews` : ""}`}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i < Math.round(rating)
                ? "fill-brand text-brand"
                : "fill-surface-muted text-border-strong"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted tabular-nums">
        {displayRating.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </div>
  );
}
