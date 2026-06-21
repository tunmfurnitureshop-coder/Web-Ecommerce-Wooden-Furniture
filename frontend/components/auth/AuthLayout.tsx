import { TreePine } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        aria-label="Vin Furniture"
      >
        <TreePine className="h-6 w-6 text-brand" aria-hidden />
        <span className="font-display text-lg font-semibold text-text-primary">Vin Furniture</span>
      </Link>
      <div className="bg-surface rounded-xl shadow-sm border border-border-default p-6 w-full max-w-sm">
        {title && (
          <h1 className="text-xl font-bold text-text-primary mb-6">{title}</h1>
        )}
        {children}
      </div>
    </div>
  );
}
