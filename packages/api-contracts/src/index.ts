export type { components, paths, operations } from "./generated/schema";

// ── v0.3 types ─────────────────────────────────────────────────────────────
export type ProductCatalogItemDTO =
  import("./generated/schema").components["schemas"]["ProductCatalogItem"];
export type ProductCatalogResponseDTO =
  import("./generated/schema").components["schemas"]["ProductCatalogResponse"];
export type ProductDetailDTO =
  import("./generated/schema").components["schemas"]["ProductDetailOut"];
export type CartHydrateRequestDTO =
  import("./generated/schema").components["schemas"]["CartHydrateRequest"];
export type CartHydrateResponseDTO =
  import("./generated/schema").components["schemas"]["CartHydrateResponse"];
export type CartHydratedItemDTO =
  import("./generated/schema").components["schemas"]["CartHydratedItem"];
export type CreateOrderRequestDTO =
  import("./generated/schema").components["schemas"]["CreateOrderRequest"];
export type CreateOrderResponseDTO =
  import("./generated/schema").components["schemas"]["CreateOrderResponse"];
export type HTTPValidationError =
  import("./generated/schema").components["schemas"]["HTTPValidationError"];

// ── v0.4 Taxonomy ───────────────────────────────────────────────────────────
export type TagListResponseDTO =
  import("./generated/schema").components["schemas"]["TagListResponse"];

// ── v0.4 Collection ─────────────────────────────────────────────────────────
export type CollectionListItemDTO =
  import("./generated/schema").components["schemas"]["CollectionListItem"];
export type CollectionDetailDTO =
  import("./generated/schema").components["schemas"]["CollectionDetailOut"];
export type CollectionListResponseDTO =
  import("./generated/schema").components["schemas"]["CollectionListResponse"];

// ── v0.4 Content / Guides ───────────────────────────────────────────────────
export type ContentListItemDTO =
  import("./generated/schema").components["schemas"]["ContentListItem"];
export type ContentDetailDTO =
  import("./generated/schema").components["schemas"]["ContentDetailOut"];
export type ContentListResponseDTO =
  import("./generated/schema").components["schemas"]["ContentListResponse"];

// ── v0.4 Discovery ──────────────────────────────────────────────────────────
export type CategoryLandingDTO =
  import("./generated/schema").components["schemas"]["CategoryLandingOut"];
export type MaterialLandingDTO =
  import("./generated/schema").components["schemas"]["MaterialLandingOut"];

// Related products & recently-viewed are untyped dicts in OpenAPI.
// Use the domain package view models for these instead.

// ── v0.4 SEO ────────────────────────────────────────────────────────────────
export type SynonymDTO =
  import("./generated/schema").components["schemas"]["SynonymOut"];
