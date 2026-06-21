# Vin Furniture — Implementation Rules for AI Agents

This file is read by Codex, Gemini, and other AI coding agents.
Claude Code reads `CLAUDE.md` (same rules, same authority).

Read `docs/system-architecture.md` before starting any implementation task.

---

## Monorepo Structure

```
frontend/          Next.js 14 App Router (npm workspace)
packages/domain/   @vin/domain — Zod schemas, view models, mappers
packages/api-contracts/  @vin/api-contracts — generated OpenAPI TypeScript types
backend/           FastAPI (Python) — source of truth for pricing and business logic
```

---

## Rule 1 — Design Tokens, no raw colors

Every color class must be a semantic token from `frontend/tailwind.config.ts`.

```
✅  text-text-primary  bg-surface  border-border-default  text-brand  bg-success-bg
❌  text-stone-900     bg-white    border-gray-200         text-yellow-700
```

Full token reference: `frontend/tailwind.config.ts` → `theme.extend.colors`
Visual preview (dev): `http://localhost:3000/vi/design-tokens`

---

## Rule 2 — API Contracts, no hand-rolled DTOs

Import DTO types from `@vin/api-contracts`. Never define API response shapes inline.

```ts
import type { ProductCatalogItemDTO, CreateOrderRequestDTO } from "@vin/api-contracts";
```

Source: `packages/api-contracts/src/index.ts`

---

## Rule 3 — Domain Package for validation and mapping

Use `@vin/domain` for all Zod schemas, enums, view model types, and mapper functions.

```ts
import { checkoutSchema, mapCartItemDTOtoViewModel, OrderStatus } from "@vin/domain";
```

Never define Zod schemas inline in page or component files.

---

## Rule 4 — i18n, no hardcoded strings

All UI strings live in `frontend/messages/vi.json` (primary) and `zh-CN.json`.

```tsx
// Server Component
const t = await getTranslations("namespace");

// Client Component  
const t = useTranslations("namespace");
```

Add new keys to **both** locale files simultaneously.

---

## Rule 5 — Navigation imports

```ts
✅  import { Link, useRouter, usePathname } from "@/i18n/navigation";
❌  import Link from "next/link";
❌  import { useRouter } from "next/navigation";
```

---

## Rule 6 — Design system components first

Before writing a new component, check `frontend/design-system/` for existing equivalents:

| Need | Use |
|------|-----|
| CTA button | `Button` from `@/design-system/components/button` |
| Empty list | `EmptyState` from `@/design-system/components/empty-state` |
| API error | `ErrorState` from `@/design-system/components/error-state` |
| Loading | `Skeleton` from `@/design-system/components/skeleton` |
| Order/payment status | `StatusBadge` from `@/design-system/components/status-badge` |
| Page wrapper | `Container` from `@/design-system/primitives/container` |
| Horizontal rule | `Divider` from `@/design-system/primitives/divider` |

Do **not** use shadcn `@/components/ui/*` in new customer-facing pages.

---

## Rule 7 — Server Components by default

Default to React Server Components. Add `"use client"` only when using:
- React hooks (`useState`, `useEffect`, `useContext`, …)
- Browser APIs (`window`, `localStorage`, …)
- Event handlers passed as props

---

## Rule 8 — Backend is sole pricing authority

Never calculate prices in the frontend. All prices flow from the backend cart hydration API
(`/api/v1/cart/hydrate`) and are stored as **integer VND** (`number`).

---

## File Conventions

- Filenames: `kebab-case` always
- Max file size: **200 lines** — split when larger
- Tests: `filename.test.ts` alongside the source file
- Commit format: `feat(scope):` `fix(scope):` `test(scope):` `docs(scope):` `refactor(scope):`
- No AI references in commit messages
