# Vin Furniture — E-commerce Platform

A full-stack e-commerce platform for premium custom wooden furniture. Customers configure products (wood type, finish, size), get server-calculated pricing, pay via PayOS or COD, and manage orders and wishlists through a full account portal. Includes a complete admin panel and a shared domain package with Zod schemas and view-model mappers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16 |
| Frontend | Next.js 14 (App Router, RSC-first), TypeScript, Tailwind CSS |
| Design System | Custom component library (`frontend/design-system/`) with semantic Tailwind tokens |
| Shared Packages | `@vin/domain` (Zod schemas, mappers, view models), `@vin/api-contracts` (generated OpenAPI types) |
| State | Zustand (cart + wishlist) |
| i18n | next-intl v3 — route-based (`/vi/...`, `/zh-CN/...`) |
| Auth | JWT (python-jose) + bcrypt (passlib); refresh token in httpOnly cookie |
| Payment | PayOS |
| Storage | Cloudflare R2 (boto3 S3-compatible) |
| Email | Resend (console fallback for local dev) |
| Tests | pytest + httpx AsyncClient (backend); Vitest (domain package) |
| Infra | Docker Compose |

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Run the stack

```bash
docker compose up -d
```

### Initialize the database

```bash
# Run migrations
docker exec wood_furniture_backend alembic upgrade head

# Seed sample data (8 products, 5 room categories, admin user)
docker exec wood_furniture_backend python -m app.seed
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Admin Panel | http://localhost:3000/vi/admin |

**Default admin credentials:** `admin@example.com` / `admin123`

## Features

### Customer
- Register / login with email verification and password reset
- Profile management and address book (multiple addresses, one default)
- Order history with full detail and reorder flow
- Guest order claim on email verification
- Wishlist (add, remove, persistent across sessions)
- Product reviews — submit after a delivered order, edit, delete
- Full-text product search with live suggestions and filter/sort

### Admin
- Product management with image upload (Cloudflare R2)
- Order management with status timeline
- Payment transaction list and manual confirmation (bank transfer / COD)
- Review moderation — approve, reject, hide, restore (PENDING → APPROVED/REJECTED, APPROVED ↔ HIDDEN)
- Inventory management
- Dashboard with revenue and order metrics

### Shopping
- Product catalog with filters (room, wood type, price range) and sort (newest, price, rating)
- Product detail with image gallery, option selector, pricing preview
- Cart (persisted in localStorage via Zustand)
- Checkout with COD, bank transfer, or payOS (QR / card)
- payOS webhook with checksum verification and idempotent processing

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/              # config, database, security, exceptions
│   │   ├── modules/
│   │   │   ├── auth/          # admin JWT login
│   │   │   ├── customer_auth/ # customer register/login, email verify, password reset
│   │   │   ├── customer/      # profile, addresses, order history, reorder
│   │   │   ├── product/       # catalog, detail, suggestions
│   │   │   ├── pricing/       # server-side price calculation
│   │   │   ├── cart/          # cart hydration & validation
│   │   │   ├── order/         # order creation, events
│   │   │   ├── inventory/     # stock management
│   │   │   ├── wishlist/      # wishlist CRUD
│   │   │   ├── review/        # product reviews + admin moderation
│   │   │   ├── payment/       # PayOS provider, transaction service
│   │   │   ├── webhook/       # PayOS webhook processing
│   │   │   ├── media/         # R2 image upload/delete
│   │   │   ├── notification/  # email service, templates
│   │   │   └── admin/         # dashboard, manual payment confirm
│   │   └── shared/            # enums, pagination, responses
│   ├── alembic/               # migrations
│   ├── tests/                 # pytest tests (customer auth, addresses, orders, wishlist, reviews, search)
│   └── requirements.txt
├── docs/                      # Architecture, roadmap, changelog, code standards
├── frontend/
│   ├── app/[locale]/
│   │   ├── admin/
│   │   │   ├── dashboard/     # revenue and order metrics
│   │   │   ├── payments/      # payment transaction list
│   │   │   ├── orders/[id]/   # order detail with timeline
│   │   │   ├── products/      # product management + image upload
│   │   │   └── reviews/       # review moderation
│   │   ├── account/
│   │   │   ├── profile/       # name, phone, address book
│   │   │   ├── orders/        # order history + detail + reorder
│   │   │   ├── addresses/     # address book management
│   │   │   └── wishlist/      # saved products
│   │   ├── (auth)/            # login, register, forgot/reset password, verify email
│   │   ├── cart/              # cart with API hydration
│   │   ├── checkout/
│   │   │   ├── return/        # PayOS return handler
│   │   │   └── cancel/        # PayOS cancel handler
│   │   ├── products/[slug]/   # product detail with reviews
│   │   └── success/           # post-order confirmation
│   ├── components/
│   │   ├── auth/              # AuthLayout
│   │   ├── catalog/           # CatalogFilters, CatalogSortSelector, ActiveFilterChips
│   │   ├── checkout/          # CheckoutForm, CheckoutOrderSummary
│   │   ├── customer/          # CustomerAuthContext, OrderDetailTimeline, ReorderButton
│   │   ├── admin/             # OrderTimeline, PaymentTransactionTable, ProductImageManager
│   │   ├── product/           # ProductDetailClient
│   │   ├── wishlist/          # WishlistButton, WishlistGrid, WishlistItemCard
│   │   ├── review/            # RatingStars, ReviewSummary, ReviewList, ReviewForm
│   │   └── search/            # SearchBar (debounced suggestions)
│   ├── design-system/         # Shared component library
│   │   ├── primitives/        # Container, Section, Divider
│   │   ├── components/        # Button, Badge, Skeleton, EmptyState, ErrorState, StatusBadge, Alert
│   │   ├── commerce/          # ProductCard, ProductGrid, CartItem, CartSummary
│   │   └── layout/            # Header, Footer, AccountSidebar, Breadcrumb, Pagination
│   ├── features/              # API clients and types per domain
│   ├── lib/                   # utilities, i18n config, auth helpers
│   └── messages/              # vi.json, zh-CN.json
├── packages/
│   ├── domain/                # @vin/domain — Zod schemas, view models, mappers (Vitest unit tests)
│   └── api-contracts/         # @vin/api-contracts — generated TypeScript types from OpenAPI spec
├── spec/                      # Product requirement documents
└── docker-compose.yml
```

## Key Design Decisions

- **Backend is sole pricing authority** — frontend never calculates final prices
- **Cart and wishlist store IDs only** — no labels or prices cached client-side
- **Customer auth uses memory + httpOnly cookie** — access token in React state, refresh token in cookie (XSS-safe)
- **Wishlist loaded once** — Zustand store with `loaded` flag; single API call shared across all heart buttons
- **WishlistButton outside `<Link>`** — avoids invalid interactive-in-interactive HTML nesting
- **Order status and payment status are separate fields** — never merged
- **All prices in integer VND** — no floats
- **Review state machine** — PENDING → APPROVED/REJECTED; APPROVED → HIDDEN; HIDDEN → APPROVED; others return 422
- **Webhook idempotency** — duplicate payOS webhooks are ignored safely
- **Email is non-blocking** — email failure never fails the checkout or payment flow
- **Search uses translation slugs** — `room` filter matches `RoomCategoryTranslation.slug` (locale-aware)

## Environment Variables

Copy and edit the example files before first run:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Change in production |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial admin account |
| `PAYOS_CLIENT_ID` | payOS merchant client ID |
| `PAYOS_API_KEY` | payOS API key |
| `PAYOS_CHECKSUM_KEY` | payOS webhook checksum key |
| `PAYOS_RETURN_URL` | Redirect after successful payment |
| `PAYOS_CANCEL_URL` | Redirect after cancelled payment |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_ENDPOINT_URL` | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_BASE_URL` | Public URL prefix for uploaded images |
| `EMAIL_PROVIDER` | `console` (local) or `resend` (production) |
| `RESEND_API_KEY` | Resend API key (required if `EMAIL_PROVIDER=resend`) |
| `EMAIL_FROM` | Sender address, e.g. `Wood Furniture <no-reply@example.com>` |
| `ADMIN_NOTIFICATION_EMAIL` | Admin email for order/payment alerts |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (default: `http://localhost:8000`) |

## Payment Flow

### payOS

```
Customer checkout → Backend creates order + payment transaction
→ payOS payment link created → Customer redirected to payOS
→ payOS webhook → Backend verifies signature → Updates order status
→ Email sent to customer and admin
→ Customer redirected to /checkout/return
```

For local webhook testing, expose the backend with a public tunnel:

```bash
ngrok http 8000
# then set PAYOS_WEBHOOK_URL=https://<tunnel-id>.ngrok.io/api/v1/webhooks/payos
```

### COD / Bank Transfer

```
Customer checkout → Order created → Admin manages manually
Bank Transfer: Admin uses "Confirm Payment" button in order detail
```

## Development

### Run backend tests

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
pytest tests/ -q
```

Tests use SQLite in-memory — no running database required.

### Run domain package tests

```bash
cd packages/domain
npm test
```

### Regenerate API contract types

```bash
cd packages/api-contracts
npx openapi-typescript openapi/openapi.json -o src/generated/schema.ts
```

Requires the backend to be running at `http://localhost:8000` first to fetch the latest spec.

### Run locally without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload

# Frontend (from repo root — uses npm workspaces)
npm install
npm run dev --workspace=frontend
```
