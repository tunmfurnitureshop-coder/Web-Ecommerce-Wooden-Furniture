# System Architecture

## Overview

Vin Furniture is a full-stack e-commerce application for custom wooden furniture.

```
┌─────────────────────────────────────────────────────┐
│                     Monorepo                        │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   frontend   │  │  packages/ │  │  backend/  │  │
│  │  (Next.js)   │  │  domain    │  │ (FastAPI)  │  │
│  │              │  │  api-contr │  │            │  │
│  └──────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Frontend (`frontend/`)

**Framework**: Next.js 14 App Router  
**Rendering**: Server Components by default; Client Components only for interactivity  
**Styling**: Tailwind CSS with semantic design tokens  
**i18n**: `next-intl` with vi-VN (primary) and zh-CN locales  
**State**: Zustand for cart store; React Server Components for data fetching

### Directory Structure

```
frontend/
├── app/[locale]/          # Page routes (RSC-first)
├── components/            # Feature components (not design system)
│   ├── auth/              # Auth layout & forms
│   ├── catalog/           # Filter, sort, chips
│   ├── customer/          # Auth context, order timeline, reorder
│   └── checkout/          # Checkout form, order summary
├── design-system/         # Shared UI library
│   ├── primitives/        # Container, Section, Divider
│   ├── components/        # Button, Badge, Skeleton, EmptyState, etc.
│   ├── commerce/          # ProductCard, CartItem, CartSummary
│   └── layout/            # Header, Footer, AccountSidebar, Breadcrumb
├── features/              # Domain-specific logic
│   ├── cart/              # Cart store (Zustand), cart API
│   ├── customer/          # Customer auth, profile, order types
│   └── product/           # Product types
├── lib/                   # Shared utilities
│   ├── api.ts             # HTTP client
│   ├── format-currency.ts # VND formatter
│   └── i18n.ts            # next-intl navigation exports
└── messages/              # Translation JSON files
```

### Design Token Conventions

| Category | Tokens |
|----------|--------|
| Text | `text-text-primary`, `text-text-secondary`, `text-text-muted` |
| Brand | `text-brand`, `bg-brand`, `bg-brand-soft` |
| Surface | `bg-surface`, `bg-background` |
| Border | `border-border-default`, `border-border-focus` |
| Status | `text-success`, `text-error`, `text-info`, `text-warning` |

## Domain Package (`packages/domain/`)

Shared business logic consumed by frontend. No runtime dependencies on Next.js.

- **Zod schemas** — validation at every user-input boundary
- **View models** — typed shapes for UI rendering
- **Mappers** — transform API DTOs → view models
- **Constants & enums** — shared between frontend and tests

## API Contracts Package (`packages/api-contracts/`)

Generated TypeScript types from the FastAPI OpenAPI spec. Regenerate with:
```bash
npx openapi-typescript openapi/openapi.json -o src/generated/schema.ts
```

## Backend (`backend/`)

**Framework**: FastAPI (Python)  
**Database**: PostgreSQL  
**Auth**: JWT tokens (customer) + session (admin)  
**Payments**: PayOS integration

### Key API Groups
- `/api/v1/products` — catalog, search, PDP
- `/api/v1/cart` — hydration (price calculation)
- `/api/v1/orders` — create, status
- `/api/v1/customer` — auth, profile, orders, wishlist, addresses
- `/api/v1/admin` — dashboard, product management, order management
