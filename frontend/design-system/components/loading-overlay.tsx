import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  label?: string;
  className?: string;
}

export function LoadingOverlay({ label = "Loading…", className }: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-[2px] z-10 rounded-inherit", className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
