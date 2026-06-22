# Development Roadmap

## Project: Vin Furniture Web Storefront

---

## v0.3.1 — Web Storefront UI Foundation ✅ COMPLETE (2026-06-21)

Complete customer-facing storefront built on Next.js 14 App Router with full i18n, design system, and domain package.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 01 | Design system foundation (primitives, components, commerce, layout) | ✅ Done |
| Phase 02 | Layout & navigation (header, footer, account sidebar, breadcrumb) | ✅ Done |
| Phase 03 | Product catalog & PDP (filters, sort, search, customization) | ✅ Done |
| Phase 04 | Cart & checkout UI (cart store, checkout form, PayOS integration) | ✅ Done |
| Phase 05 | Account & auth pages (login, register, profile, orders, wishlist) | ✅ Done |
| Phase 06 | API contracts & domain package (OpenAPI types, Zod schemas, mappers) | ✅ Done |
| Phase 07 | Quality pass (unit tests, i18n audit, TypeScript clean) | ✅ Done |

### Key Deliverables
- `frontend/design-system/` — 25+ reusable components with Tailwind semantic tokens
- `packages/domain/` — Zod schemas, view model types, mapper functions (44 unit tests)
- `packages/api-contracts/` — Generated TypeScript types from FastAPI OpenAPI spec
- Full i18n: vi-VN (primary), zh-CN — zero hardcoded UI strings
- Customer auth flow, cart persistence, checkout (COD + PayOS), order history

---

## v0.4 — Discovery, SEO & Content Foundation ✅ COMPLETE (2026-06-22)

Full-stack discovery, SEO infrastructure, and content hub for product findability.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 01 | Data foundation: taxonomy, collection, content, discovery DB tables | ✅ Done |
| Phase 02 | Backend Taxonomy: tags, tag translations, product tags CRUD | ✅ Done |
| Phase 03 | Backend Collections: curated product groups with publish workflow | ✅ Done |
| Phase 04 | Backend Content: buying/material guides with markdown + bleach sanitization | ✅ Done |
| Phase 05 | Backend Discovery: related products (5-tier fallback), recently-viewed hydration, synonym search | ✅ Done |
| Phase 06 | Backend SEO: robots.txt, sitemap.xml, JSON-LD (Product/BreadcrumbList/Article), canonical URLs | ✅ Done |
| Phase 07 | Domain Package: Zod schemas, view models, mappers for discovery/SEO/taxonomy | ✅ Done |
| Phase 08 | API Contracts: regenerated OpenAPI TypeScript types with v0.4 DTOs | ✅ Done |
| Phase 09 | Frontend Discovery: /collections, /categories/[slug], /materials/[slug], /guides pages + design-system components | ✅ Done |
| Phase 10 | Frontend SEO & Admin: robots.ts, sitemap.ts, admin tags/collections/content CRUD pages | ✅ Done |
| Phase 11 | Testing & QA: 22 new backend tests (83 total), all passing, no regressions | ✅ Done |

### Key Deliverables
- Taxonomy: Tag system (8 types: STYLE/MATERIAL/ROOM/USAGE/CAPACITY/PRICE_TIER/FEATURE/AVAILABILITY) with admin CRUD
- Collections: Curated product groups with draft/publish/archive, sort_order, cover images, SEO fields
- Content Hub: Buying guides, material guides with Markdown editing, live preview, bleach HTML sanitization
- Discovery: 5-tier related-products fallback (manual → category → tags → price_tier → latest), recently-viewed persistence
- SEO: Product/BreadcrumbList/Article JSON-LD, hreflang alternates in sitemap, canonical URLs
- Admin: Tags, Collections, Content management pages with SeoMetadataForm (character counters)
- Recently-viewed: localStorage-only Zustand store (max 12 IDs) with API hydration

---

## v0.5 — Promotion, Campaign & Conversion Optimization ✅ COMPLETE (2026-06-22)

Full-stack promotion engine, campaign management, cart recovery, commerce events, and admin tooling.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 01 | Promotion Data Foundation: DB models, Alembic migration, enums, seed | ✅ Done |
| Phase 02 | Promotion Engine: evaluator, allocator, cart quote API (POST /cart/quote) | ✅ Done |
| Phase 03 | Checkout Integration: idempotency, promotion lifecycle (RESERVED→REDEEMED→RELEASED), order service rewrite | ✅ Done |
| Phase 04 | Campaign Module: Campaign, CampaignTranslation, CampaignPromotion models + public API | ✅ Done |
| Phase 05 | Commerce Events: CommerceEvent model, client/server event ingestion, PRODUCT_VIEWED/PURCHASE_COMPLETED | ✅ Done |
| Phase 06 | Cart Recovery & Worker: CartRecoverySession, arq worker (evaluate/send/expire crons), Redis, Docker | ✅ Done |
| Phase 07 | Admin APIs & Frontend: promotion/campaign CRUD + metrics endpoints; feature files, design-system components, admin pages, campaign landing page, cart/checkout updates | ✅ Done |
| Phase 08 | Domain Package: Zod schemas + view models + mappers for promotion/campaign/analytics/cart-recovery | ✅ Done |

### Key Deliverables
- Promotion engine: automatic + coupon triggers, PERCENTAGE/FIXED_AMOUNT/PERCENTAGE_PER_PRODUCT discount types, best-eligible wins, allocation proportional to eligible lines
- Idempotency: `Idempotency-Key` header on POST /orders — same key+body → cached response, different body → 409
- Cart recovery: arq worker scans for abandoned carts every 15 min, generates opaque recovery tokens, sends email reminders
- Commerce events: client allowlist (9 event types), server-only events (PURCHASE_COMPLETED, PROMOTION_APPLIED), never blocks UI
- Campaign: slug-based landing pages with hero image, featured products/collections, attribution tracking
- Admin: promotions + campaigns CRUD with metrics (usage counts, revenue, conversion rates)
- Frontend: CouponInput, DiscountBreakdown, PromotionSummary, CampaignHero, CheckoutSubmitButton, CartRecoveryBanner components
- Cart page: coupon input + discount breakdown display; Checkout: marketing consent + cart recovery session tracking

---

## v0.6 — Advanced Features (Backlog)

- Product reviews & ratings (customer-submitted)
- Recommendation engine (room-based cross-sell)
- Advanced search with vector embeddings
- Mobile app (React Native)
