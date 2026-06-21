import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Divider({ className, orientation = "horizontal" }: DividerProps) {
  if (orientation === "vertical") {
    return <div className={cn("w-px self-stretch bg-border-default", className)} aria-hidden />;
  }
  return <hr className={cn("border-border-default", className)} aria-hidden />;
}
