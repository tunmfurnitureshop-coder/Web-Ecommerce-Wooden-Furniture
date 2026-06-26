# Project Changelog

---

## [Unreleased] — Campaign Flow: Scoped Promotion

Makes campaigns coherent — a campaign targets a product group and its promotion
auto-applies to exactly that group. Golden rule: **Campaign target ≡ Promotion
scope** (Campaign = display, Promotion = pricing; the evaluator never reads `campaign_id`).

### Added

#### Backend
- **Campaign target** (`campaigns.target_type` + `target_id`, migration 008): a campaign points at a `COLLECTION` or `CATEGORY`
- **Catalog scoping** (`GET /api/v1/products?campaign={slug}`): resolves the target to a collection/room filter and returns a structured `campaignBanner` (from the campaign's first ACTIVE+AUTOMATIC promotion); unknown/inactive slugs degrade to the full catalog
- **Promotion-link validation**: linking a promotion to a campaign now requires `AUTOMATIC` trigger + scope matching the target, else `422` (`CAMPAIGN_TARGET_REQUIRED`, `CAMPAIGN_PROMO_NOT_AUTOMATIC`, `CAMPAIGN_PROMO_SCOPE_MISMATCH`)
- **Seed** `app/seed_campaign.py`: sample `BEDROOM10` campaign (CATEGORY → bedroom) + AUTOMATIC 10% scoped promotion, linked through the validated path

#### Frontend
- **Carousel CTA** now links to `/products?campaign={slug}` (filtered PLP) instead of the campaign detail page
- **`CampaignBannerCard`**: promo banner above the catalog grid; discount label formatted client-side from structured data
- **Admin `CampaignTargetField`**: target type + dependent collection/room picker in campaign create + edit forms
- **i18n**: `catalog.campaignDiscountPercent/campaignDiscountAmount/campaignEndsOn` + `admin.targetType/targetTypeNone/targetCollection/targetCategory/targetEntity` (vi + zh-CN)

#### Testing
- `test_campaign_scoped_promotion.py` (5): catalog filter, unknown-slug graceful, link validation branches; full suite 122 passing, no regressions

---

## [Unreleased] — Homepage Merchandising

### Added

#### Backend
- **Best-sellers endpoint** (`GET /api/v1/products/best-sellers`): ranks products by units sold across paid orders (90-day window), with a newest-products fallback so the rail is never empty
- **Deals endpoint** (`GET /api/v1/products/deals`): computes display strike-through prices from active AUTOMATIC promotions, reusing the checkout `allocate_discount` engine so card prices match `/cart/quote`; honesty rule excludes promotions with minimum-order, bundle, or payment-method conditions

#### Frontend
- **Hero slideshow**: `HomeHeroSlideshow` driven by `HOME_HERO` campaigns (embla + autoplay, pause on hover/focus, reduced-motion aware), with `HomeHeroStatic` fallback when no campaigns exist
- **Homepage rails**: "Giá siêu tốt" (deals — strike-through price + discount badge) and "Hàng bán chạy" (best-sellers) sections, hidden when empty
- **`ProductRail`**: shared embla carousel replacing the legacy manual-scroll `RelatedProductCarousel` (removed); used by related products, deals, and best-sellers
- **`ProductCard`**: optional strike-through price + discount badge for deal display
- **i18n**: `home.dealsTitle/bestSellersTitle/dealBadge/heroSlideCta/promotionsAria/goToSlide` + `common.scrollPrev/scrollNext` (vi + zh-CN)

#### Admin
- **Campaign image upload**: reusable `ImageUploadField` (preview + upload/replace/remove) for desktop + mobile hero images in campaign create/edit; `placement` is now a dropdown; edit form can change images/placement (not just status). Backed by a generic `POST /api/v1/admin/uploads/image` endpoint reusing the R2 storage layer (type/size validated, admin-only)

#### Testing
- 16 new backend tests: `test_deals.py` (9), `test_best_sellers.py` (4), `test_media_upload.py` (3); full suite 114 passing, no regressions

#### Dependencies
- `embla-carousel-react`, `embla-carousel-autoplay` (frontend)

---

## [0.4.0] — 2026-06-22

### Added

#### Backend
- **Taxonomy module**: Tag system with 8 types (STYLE/MATERIAL/ROOM/USAGE/CAPACITY/PRICE_TIER/FEATURE/AVAILABILITY), admin CRUD, public listing, product assignment
- **Collection module**: Curated product groups with DRAFT/PUBLISHED/ARCHIVED workflow, sort_order, cover images, SEO fields per locale, publish validation (≥1 active product)
- **Content module**: Buying/material/style/care guides with Markdown body, bleach HTML sanitization, cover images, author, scheduled publishing, product/category linking
- **Discovery module**: 5-tier related-products fallback (MANUAL_RELATED → same category → shared tags → price tier → latest), recently-viewed hydration endpoint (max 12 IDs), search synonym expansion, category/material landing pages
- **SEO Foundation**: robots.txt (`PlainTextResponse`), sitemap.xml with hreflang alternates for vi+zh-CN, product/breadcrumb/article JSON-LD builders, canonical URL generator, `SITE_BASE_URL` config
- **Search enhancements**: Tag filter (AND semantics per tag code), availability filter (in-stock check), rating filter (avg_rating ≥ threshold), zero-result fallback suggestions

#### Frontend
- **Discovery pages**: `/collections`, `/collections/[slug]`, `/categories/[slug]`, `/materials/[slug]`, `/guides`, `/guides/[slug]` — all with `generateMetadata` + JSON-LD
- **Product detail page**: Added `generateMetadata`, JSON-LD, `ProductTagList`, `RelatedProductCarousel`, `RecentlyViewedSection`
- **Design system components**: `CollectionCard/Grid`, `ProductTagList`, `RelatedProductCarousel`, `RecentlyViewedSection`, `ArticleCard/Grid/Hero/Meta`, `MarkdownRenderer`, `RelatedGuideCard`, `JsonLd`
- **Recently-viewed**: Zustand persist store (localStorage, max 12 IDs) + API hydration client
- **SEO infrastructure**: `frontend/app/robots.ts` and `frontend/app/sitemap.ts` (Next.js App Router conventions)
- **Admin pages**: Tags CRUD, Collections CRUD + product picker, Content CRUD with markdown live preview
- **`SeoMetadataForm`**: Character counters (50–60 ideal/180 max title, 140–160 ideal/320 max description)
- **`ContentEditor`**: Locale tabs (vi/zh-CN), `MarkdownRenderer` live preview toggle
- **Admin sidebar**: Added tags, collections, content nav links
- **i18n**: Added `discovery` namespace (14 keys) + admin namespace extensions (35 keys) to vi.json and zh-CN.json

#### Domain Package
- Zod schemas: `TagSchema`, `TagTypeSchema`, `SeoMetadataSchema`, `SearchFilterSchema`, `RelatedProductSchema`, `RecentlyViewedHydrationSchema`
- View models: `TagViewModel`, `CollectionCardViewModel`, `GuideCardViewModel`, `GuideDetailViewModel`, `SeoMetadataViewModel`, `RelatedProductViewModel`, `RecentlyViewedItemViewModel`, `MaterialLandingViewModel`, `CategoryLandingViewModel`
- Mappers: taxonomy, collection, content (guide), SEO, discovery

#### API Contracts
- Regenerated OpenAPI schema and TypeScript types
- New DTOs: `TagListResponseDTO`, `CollectionListItemDTO`, `CollectionDetailDTO`, `CollectionListResponseDTO`, `ContentListItemDTO`, `ContentDetailDTO`, `ContentListResponseDTO`, `CategoryLandingDTO`, `MaterialLandingDTO`, `SynonymDTO`

#### Testing
- 22 new backend tests: `test_taxonomy.py` (8), `test_collections.py` (7), `test_content.py` (7)
- All 83 backend tests passing, no regressions

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
