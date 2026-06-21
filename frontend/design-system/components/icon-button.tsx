import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { VisuallyHidden } from "../primitives/visually-hidden";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline";
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const variantStyles = {
  ghost: "bg-transparent hover:bg-surface-muted border-transparent",
  outline: "bg-transparent hover:bg-surface-muted border-border-default",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, size = "md", variant = "ghost", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <span aria-hidden>{icon}</span>
        <VisuallyHidden>{label}</VisuallyHidden>
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
