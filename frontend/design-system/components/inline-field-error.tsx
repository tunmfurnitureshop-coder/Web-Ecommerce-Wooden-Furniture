import { cn } from "@/lib/utils";

interface InlineFieldErrorProps {
  message?: string;
  id?: string;
  className?: string;
}

export function InlineFieldError({ message, id, className }: InlineFieldErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-1 text-xs text-danger", className)}
    >
      {message}
    </p>
  );
}
