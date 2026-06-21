import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
}

export function Section({ as: Tag = "section", className, children, ...props }: SectionProps) {
  return (
    <Tag className={cn("py-16 xl:py-20", className)} {...props}>
      {children}
    </Tag>
  );
}
