/**
 * Business config — single source of truth for NAP (Name / Address / Phone)
 * data. Consumed by the LocalBusiness JSON-LD, the Footer and the Contact page,
 * so opening hours, email and phone live here exactly once.
 *
 * Address + geo are intentionally left blank until the real showroom data is
 * supplied; the schema builder and UI degrade gracefully while they are empty.
 */

const DAY_NAMES = {
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
  Su: "Sunday",
} as const;

type DayCode = keyof typeof DAY_NAMES;

interface OpeningPeriod {
  days: readonly DayCode[];
  opens: string;
  closes: string;
}

export const BUSINESS_CONFIG = {
  name: "Vin Furniture",
  legalName: "Công ty TNHH Vin Furniture",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://vinfurniture.vn",
  // Display-friendly value reused by Footer + Contact page + JSON-LD.
  telephone: process.env.NEXT_PUBLIC_HOTLINE?.trim() || "+84 901 234 567",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "support@vinfurniture.vn",
  address: {
    // TODO: điền địa chỉ thực của showroom (Phase 01 — cần data từ user).
    streetAddress: "",
    addressLocality: "",
    addressRegion: "",
    postalCode: "",
    addressCountry: "VN",
  },
  geo: {
    // TODO: lấy lat/lng từ Google Maps ("What's here?"). 0,0 = chưa cấu hình.
    latitude: 0,
    longitude: 0,
  },
  openingHours: [
    { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "08:00", closes: "18:00" },
    { days: ["Sa"], opens: "08:00", closes: "17:00" },
    // Sunday omitted = closed.
  ] satisfies OpeningPeriod[],
  priceRange: "$$",
  mapsEmbedUrl: process.env.NEXT_PUBLIC_MAPS_EMBED_URL?.trim() || "",
  mapsDirectionsUrl: process.env.NEXT_PUBLIC_MAPS_DIRECTIONS_URL?.trim() || "",
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;

/** `tel:` href with spaces stripped — dialers want a compact number. */
export const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

/**
 * Build LocalBusiness (FurnitureStore) JSON-LD. Address + geo are only included
 * once real data is present, so the emitted schema is never invalid/misleading
 * while the config is still scaffolded.
 */
export function buildLocalBusinessSchema(
  config: BusinessConfig
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: config.name,
    legalName: config.legalName,
    url: config.url,
    telephone: config.telephone,
    email: config.email,
    priceRange: config.priceRange,
    currenciesAccepted: "VND",
    paymentAccepted: "Cash, Bank Transfer",
    openingHoursSpecification: config.openingHours.map((period) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: period.days.map((day) => DAY_NAMES[day]),
      opens: period.opens,
      closes: period.closes,
    })),
    // TODO: thêm `image` (ảnh showroom trong public/) và `sameAs` (GBP/Facebook)
    // khi có sẵn — bỏ qua hiện tại để tránh tham chiếu ảnh 404.
  };

  const { streetAddress, ...rest } = config.address;
  if (streetAddress) {
    schema.address = { "@type": "PostalAddress", streetAddress, ...rest };
  }

  if (config.geo.latitude !== 0 || config.geo.longitude !== 0) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: config.geo.latitude,
      longitude: config.geo.longitude,
    };
  }

  return schema;
}
