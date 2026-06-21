import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "1" | "2" | "3" | "4" | "6";
  align?: "start" | "center" | "end";
  wrap?: boolean;
}

const gapMap = { "1": "gap-1", "2": "gap-2", "3": "gap-3", "4": "gap-4", "6": "gap-6" } as const;
const alignMap = { start: "items-start", center: "items-center", end: "items-end" } as const;

export function Inline({ gap = "2", align = "center", wrap = false, className, children, ...props }: InlineProps) {
  return (
    <div
      className={cn("flex", gapMap[gap], alignMap[align], wrap && "flex-wrap", className)}
      {...props}
    >
      {children}
    </div>
  );
}
