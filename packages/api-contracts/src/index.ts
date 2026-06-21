export type { components, paths, operations } from "./generated/schema";

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
