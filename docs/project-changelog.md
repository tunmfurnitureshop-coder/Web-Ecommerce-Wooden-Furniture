# Project Changelog

---

## [0.3.1] — 2026-06-21

### Added

#### Design System (`frontend/design-system/`)
- Primitives: `Container`, `Section`, `Divider`
- Components: `Button`, `Badge`, `Skeleton`, `EmptyState`, `ErrorState`, `Alert`, `InlineFieldError`, `StatusBadge` (self-contained with i18n)
- Commerce: `ProductCard`, `ProductGrid`, `CartItem`, `CartSummary`, `CheckoutOrderSummary`
- Layout: `Header`, `Footer`, `AccountSidebar`, `Breadcrumb`, `Pagination`

#### Frontend Pages
- `/products` — Catalog with sidebar filters, sort selector, active filter chips, pagination
- `/products/[slug]` — PDP with customization (wood type, finish, size), price breakdown, add-to-cart
- `/cart` — Cart with hydration from API, quantity controls, order summary, payment confidence block
- `/checkout` — Two-column checkout form + order summary, COD/PayOS payment methods
- `/checkout/cancel` and `/checkout/return` — PayOS callback pages
- `/success` — Order success page with status badge
- Auth pages: login, register, forgot-password, reset-password, verify-email (all using `AuthLayout`)
- Account pages: profile, orders list, order detail (with timeline + reorder), addresses, wishlist

#### Domain Package (`packages/domain/`)
- Zod v3 validation schemas: auth, profile, address, checkout, review, catalog-filter, product-option, search, quantity
- View model types: `ProductCardViewModel`, `ProductDetailViewModel`, `CartItemViewModel`, `CartSummaryViewModel`, `OrderSummaryViewModel`, `OrderDetailViewModel`, `CustomerProfileViewModel`
- Mapper functions: product, cart item, order summary, order detail, API field errors, API error message
- Constants: `APP_LOCALES`, `DEFAULT_PAGE_SIZE`, `SEARCH_DEBOUNCE_MS`, `WEB_LAYOUT`
- Enums: `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `ProductSort`, `Locale`

#### API Contracts Package (`packages/api-contracts/`)
- `openapi.json` — Snapshot of FastAPI OpenAPI spec
- `src/generated/schema.ts` — TypeScript types generated via `openapi-typescript`
- Named re-exports: `ProductCatalogItemDTO`, `ProductDetailDTO`, `CartHydrateRequestDTO`, `CartHydrateResponseDTO`, `CreateOrderRequestDTO`, `CreateOrderResponseDTO`, `HTTPValidationError`

#### Tests (`packages/domain/`)
- 44 Vitest unit tests across 6 test files
- Mapper tests: product mapper (8), cart mapper (5), api-error mapper (8)
- Schema tests: auth (10), checkout (7), catalog-filter (5)

### Fixed
- `formatCurrency` alias added to `frontend/lib/format-currency.ts` (was missing, only `formatVnd` existed)
- `StatusBadge` made self-contained with `useTranslations` (removed required `labelMap` prop)
- `@/lib/i18n` → `@/i18n/navigation` migration across all Phase 05 pages
- Cart confidence block, catalog breadcrumb, and order detail price labels i18n-ized (were hardcoded Vietnamese)
- Vi-VN locale test assertions use actual formatter output instead of hardcoded US-format strings

---

## [0.3.0] — Prior to 2026-06-21

See git log for earlier phases (auth, search, wishlist, reviews, admin).
