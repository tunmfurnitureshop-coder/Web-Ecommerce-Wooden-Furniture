"use client";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, isLoading, className, value, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center", className)}>
        <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" aria-hidden />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "w-full rounded-md border border-border-default bg-surface py-2.5 pl-9 pr-9 text-sm",
            "placeholder:text-text-muted text-text-primary",
            "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
            "transition-colors"
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-3 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
