# Vin Furniture — Implementation Rules for Claude

Read `docs/system-architecture.md` and `docs/code-standards.md` before starting any task.

---

## Design Tokens — NEVER use raw colors

All colors, spacing, and surfaces must use semantic Tailwind tokens defined in
`frontend/tailwind.config.ts` and `frontend/app/[locale]/globals.css`.

```
✅  className="text-text-primary bg-surface border-border-default"
❌  className="text-stone-900 bg-white border-gray-200"
```

| Category   | Available tokens |
|------------|-----------------|
| Text       | `text-text-primary` `text-text-secondary` `text-text-muted` `text-text-inverse` |
| Surface    | `bg-surface` `bg-surface-muted` `bg-surface-subtle` `bg-background` |
| Brand      | `bg-brand` `bg-brand-soft` `text-brand` `border-border-focus` |
| Border     | `border-border-default` `border-border-strong` |
| Status     | `text-success` `bg-success-bg` · `text-warning` `bg-warning-bg` · `text-danger` `bg-danger-bg` · `text-info` `bg-info-bg` |

Preview tokens visually at `http://localhost:3000/vi/design-tokens` (dev only).

---

## API Contracts — use generated types, never hand-roll DTOs

DTO types for API responses come from `packages/api-contracts/src/index.ts` (`@vin/api-contracts`).

```ts
✅  import type { ProductCatalogItemDTO, CartHydrateResponseDTO } from "@vin/api-contracts";
❌  interface ProductCatalogItem { id: string; name: string; ... }  // hand-rolled
```

To regenerate types after backend changes:
```bash
cd packages/api-contracts
npx openapi-typescript openapi/openapi.json -o src/generated/schema.ts
```

---

## Domain Package — schemas, view models, mappers

`@vin/domain` (`packages/domain/src/index.ts`) exports:

- **Zod schemas** — use at every user-input boundary: `loginSchema`, `checkoutSchema`, `catalogFilterSchema`, etc.
- **View model types** — `ProductCardViewModel`, `CartItemViewModel`, `OrderSummaryViewModel`, etc.
- **Mappers** — `mapProductCardDTOtoViewModel`, `mapCartItemDTOtoViewModel`, etc.
- **Enums** — `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `ProductSort`, `Locale`
- **Constants** — `APP_LOCALES`, `DEFAULT_PAGE_SIZE`, `SEARCH_DEBOUNCE_MS`

```ts
✅  import { checkoutSchema, mapOrderSummaryDTOtoViewModel } from "@vin/domain";
❌  const schema = z.object({ name: z.string() });  // inline, not in domain package
```

---

## i18n — zero hardcoded UI strings

All user-visible strings must come from `frontend/messages/vi.json` (primary) and `zh-CN.json`.

```tsx
// Server Component
const t = await getTranslations("cart");

// Client Component
const t = useTranslations("cart");

✅  <span>{t("securePayment")}</span>
❌  <span>Thanh toán an toàn & bảo mật</span>
```

Add matching keys to **both** `vi.json` and `zh-CN.json` whenever a new string is introduced.

---

## Navigation — always @/i18n/navigation

```ts
✅  import { Link, useRouter, usePathname } from "@/i18n/navigation";
❌  import Link from "next/link";
❌  import { useRouter } from "next/navigation";
```

---

## Component Hierarchy

Prefer components in this order — use the highest level that fits:

1. **`frontend/design-system/`** — `Button`, `EmptyState`, `ErrorState`, `Skeleton`, `StatusBadge`, `Container`, `Divider`, `ProductCard`, `CartItem`, etc.
2. **`frontend/components/`** — feature-specific components (`CheckoutForm`, `CatalogFilters`, `AuthLayout`, …)
3. **`frontend/features/`** — API clients and store (cart, wishlist, customer)

Do **not** import shadcn components (`@/components/ui/*`) in new pages — use the design-system equivalents.

---

## Rendering — Server Components by default

```tsx
✅  // Server Component — no directive needed
export default async function ProductsPage() { ... }

✅  // Client only when using hooks / browser APIs
"use client";
export function FilterPanel() { ... }

❌  "use client";  // on a page that only fetches data and renders HTML
```

---

## File Rules

- Max **200 lines** per file — split into focused modules if larger
- **kebab-case** filenames: `checkout-order-summary.tsx`, `cart.store.ts`
- Tests alongside source: `foo.ts` → `foo.test.ts` (Vitest in `packages/domain`)
- Commits: `feat(scope):`, `fix(scope):`, `test(scope):`, `docs(scope):`, `refactor(scope):`
