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

## v0.5 — Backend Hardening & Admin Polish (Planned)

## v0.5 — Advanced Features (Backlog)

- Product reviews & ratings (customer-submitted)
- Recommendation engine (room-based cross-sell)
- Advanced search with vector embeddings
- Mobile app (React Native)
