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

## v0.4 — Backend Hardening & Admin Polish (Planned)

- Admin UI redesign using the new design system
- Product inventory management improvements
- Order status webhook integration (PayOS callbacks)
- Email notification system
- Performance: ISR for catalog, image CDN

---

## v0.5 — Advanced Features (Backlog)

- Product reviews & ratings (customer-submitted)
- Recommendation engine (room-based cross-sell)
- Advanced search with vector embeddings
- Mobile app (React Native)
