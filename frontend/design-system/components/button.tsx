import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-text-inverse hover:bg-brand-hover active:bg-brand-active focus-visible:ring-brand border-transparent",
  secondary:
    "bg-surface-muted text-text-primary hover:bg-surface border-border-default focus-visible:ring-border-focus",
  outline:
    "bg-transparent text-text-primary border-border-strong hover:bg-surface-muted focus-visible:ring-border-focus",
  ghost:
    "bg-transparent text-text-primary border-transparent hover:bg-surface-muted focus-visible:ring-border-focus",
  danger:
    "bg-danger text-text-inverse hover:opacity-90 active:opacity-80 border-transparent focus-visible:ring-danger",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
