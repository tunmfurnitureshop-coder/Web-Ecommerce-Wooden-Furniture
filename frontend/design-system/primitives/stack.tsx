import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "1" | "2" | "3" | "4" | "6" | "8";
}

const gapMap = {
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
} as const;

export function Stack({ gap = "4", className, children, ...props }: StackProps) {
  return (
    <div className={cn("flex flex-col", gapMap[gap], className)} {...props}>
      {children}
    </div>
  );
}
