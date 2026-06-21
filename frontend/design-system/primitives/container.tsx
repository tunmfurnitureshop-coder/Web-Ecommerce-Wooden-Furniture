import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide";
}

export function Container({ className, size = "default", children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 md:px-8 xl:px-12",
        size === "default" && "max-w-container",
        size === "narrow" && "max-w-3xl",
        size === "wide" && "max-w-screen-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
