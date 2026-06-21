import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const styles: Record<AlertVariant, { wrap: string; icon: string; IconComp: typeof AlertCircle }> = {
  info: { wrap: "bg-info-bg border-info/20 text-info", icon: "text-info", IconComp: Info },
  success: { wrap: "bg-success-bg border-success/20 text-success", icon: "text-success", IconComp: CheckCircle2 },
  warning: { wrap: "bg-warning-bg border-warning/20 text-warning", icon: "text-warning", IconComp: AlertTriangle },
  danger: { wrap: "bg-danger-bg border-danger/20 text-danger", icon: "text-danger", IconComp: AlertCircle },
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { wrap, icon, IconComp } = styles[variant];
  return (
    <div role="alert" className={cn("flex gap-3 rounded-md border p-4", wrap, className)}>
      <IconComp className={cn("h-5 w-5 shrink-0 mt-0.5", icon)} aria-hidden />
      <div className="flex flex-col gap-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
