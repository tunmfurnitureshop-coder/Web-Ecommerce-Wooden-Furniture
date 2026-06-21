# Code Standards

## General Principles

- **YAGNI** — implement only what's needed now
- **KISS** — simple solutions over clever ones
- **DRY** — extract repeated logic, but not prematurely

## File Naming

- kebab-case for all files: `product-card.tsx`, `cart.store.ts`, `format-currency.ts`
- Name files descriptively so the purpose is clear without opening them
- Keep files under 200 lines; split when they grow larger

## Frontend (Next.js)

### Server vs Client Components
- Default to Server Components (RSC)
- Mark `"use client"` only when using hooks, browser APIs, or event handlers

### i18n
- **Never** hardcode UI strings in components
- Use `useTranslations(namespace)` in client components
- Use `getTranslations(namespace)` in server components
- All translation keys live in `frontend/messages/vi.json` and `zh-CN.json`

### Navigation
- Use `@/i18n/navigation` for `Link`, `useRouter`, `usePathname` (not `next/link` or `next/navigation` directly)

### Styling
- Use semantic Tailwind tokens, never raw colors (`text-stone-800` → `text-text-primary`)
- No inline styles except for computed values (e.g., dynamic widths)

### State Management
- Zustand stores for client-side persistent state (cart)
- React state (`useState`) for local component state
- No prop-drilling beyond 2 levels — lift to context or store

## Domain Package

### Validation
- All user-input boundaries use Zod schemas from `@vin/domain`
- Vietnamese phone: `/(03|05|07|08|09)[0-9]{8}/`
- Price ranges: use `.refine()` to ensure `maxPrice > minPrice`

### Mappers
- Accept a `format` function parameter for currency to avoid locale coupling
- Return `"/images/placeholder-product.jpg"` for null image URLs

## Testing

- Unit tests live alongside source files: `foo.ts` → `foo.test.ts`
- Run with `npm test` in the `packages/domain` directory
- Test actual behavior, not implementation details
- For locale-sensitive assertions, use the actual formatter output, not hardcoded strings

## Commits

Use conventional commit format:
```
feat(scope): short description
fix(scope): short description
test(scope): short description
docs(scope): short description
refactor(scope): short description
chore(scope): short description
```

Never reference AI tools, tickets, or implementation notes in commit messages.
