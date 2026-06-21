import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Divider } from "@/design-system/primitives/divider";

const ROOMS = ["living_room", "bedroom", "dining_room", "office", "outdoor"] as const;
const WOOD_TYPES = ["oak", "walnut", "pine", "teak", "cherry"] as const;

interface CatalogFiltersProps {
  currentFilters: {
    room?: string;
    woodType?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    q?: string;
  };
}

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  params.delete("page");
  return `/products?${params.toString()}`;
}

export function CatalogFilters({ currentFilters }: CatalogFiltersProps) {
  const t = useTranslations("filters");
  const tHome = useTranslations("home");
  const base = {
    q: currentFilters.q,
    sort: currentFilters.sort,
    room: currentFilters.room,
    woodType: currentFilters.woodType,
    minPrice: currentFilters.minPrice,
    maxPrice: currentFilters.maxPrice,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Room filter */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-text-primary">{t("room")}</p>
        <div className="flex flex-col gap-1.5">
          <Link
            href={buildHref(base, { room: undefined })}
            className={`text-sm px-2 py-1 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
              !currentFilters.room
                ? "text-brand font-medium bg-brand-soft"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
            }`}
          >
            {t("all")}
          </Link>
          {ROOMS.map((room) => (
            <Link
              key={room}
              href={buildHref(base, { room })}
              className={`text-sm px-2 py-1 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                currentFilters.room === room
                  ? "text-brand font-medium bg-brand-soft"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
              }`}
            >
              {tHome(`categories.${room}`)}
            </Link>
          ))}
        </div>
      </div>

      <Divider />

      {/* Wood type filter */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-text-primary">{t("woodType")}</p>
        <div className="flex flex-col gap-1.5">
          <Link
            href={buildHref(base, { woodType: undefined })}
            className={`text-sm px-2 py-1 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
              !currentFilters.woodType
                ? "text-brand font-medium bg-brand-soft"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
            }`}
          >
            {t("all")}
          </Link>
          {WOOD_TYPES.map((wt) => (
            <Link
              key={wt}
              href={buildHref(base, { woodType: wt })}
              className={`text-sm px-2 py-1 rounded-sm transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                currentFilters.woodType === wt
                  ? "text-brand font-medium bg-brand-soft"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
              }`}
            >
              {wt}
            </Link>
          ))}
        </div>
      </div>

      <Divider />

      {/* Reset */}
      <Link
        href="/products"
        className="text-xs text-text-muted hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
      >
        {t("reset")}
      </Link>
    </div>
  );
}
