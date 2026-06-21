import type { HTMLAttributes } from "react";

export function VisuallyHidden({ children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: "rect(0,0,0,0)" }}
      {...props}
    >
      {children}
    </span>
  );
}
