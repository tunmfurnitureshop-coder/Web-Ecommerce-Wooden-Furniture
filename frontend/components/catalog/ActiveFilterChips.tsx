import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActiveFilterChipsProps {
  filters: {
    q?: string;
    room?: string;
    woodType?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

function buildWithout(filters: Record<string, string | undefined>, removeKey: string) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (k !== removeKey && v) params.set(k, v);
  }
  return `/products?${params.toString()}`;
}

export function ActiveFilterChips({ filters }: ActiveFilterChipsProps) {
  const t = useTranslations("filters");
  const active: { key: string; label: string }[] = [];

  if (filters.q) active.push({ key: "q", label: `"${filters.q}"` });
  if (filters.room) active.push({ key: "room", label: `${t("room")}: ${filters.room.replace(/_/g, " ")}` });
  if (filters.woodType) active.push({ key: "woodType", label: `${t("woodType")}: ${filters.woodType}` });
  if (filters.minPrice) active.push({ key: "minPrice", label: `≥ ${filters.minPrice}` });
  if (filters.maxPrice) active.push({ key: "maxPrice", label: `≤ ${filters.maxPrice}` });

  if (active.length === 0) return null;

  const f = filters as Record<string, string | undefined>;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Active filters">
      {active.map(({ key, label }) => (
        <Link
          key={key}
          href={buildWithout(f, key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface px-3 py-1 text-xs font-medium text-text-secondary hover:border-border-strong hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          aria-label={`Remove filter: ${label}`}
        >
          {label}
          <X className="h-3 w-3" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
