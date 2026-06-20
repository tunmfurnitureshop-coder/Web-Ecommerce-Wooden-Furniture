# Wood Furniture Ecommerce Platform

A full-stack ecommerce platform for premium wooden furniture with product customization (wood type, finish, size), server-side pricing, payOS payment integration, Cloudflare R2 image storage, and a complete admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16 |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| State | Zustand (cart persistence) |
| i18n | next-intl v3 — route-based (`/vi/...`, `/zh-CN/...`) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Payment | payOS |
| Storage | Cloudflare R2 (boto3 S3-compatible) |
| Email | Resend (console fallback for local dev) |
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

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/              # config, database, security, exceptions
│   │   ├── modules/
│   │   │   ├── auth/          # JWT login
│   │   │   ├── product/       # catalog, product detail
│   │   │   ├── pricing/       # server-side price calculation
│   │   │   ├── cart/          # cart validation
│   │   │   ├── order/         # order creation, events
│   │   │   ├── inventory/     # stock management
│   │   │   ├── payment/       # payOS provider, transaction service
│   │   │   ├── webhook/       # payOS webhook processing
│   │   │   ├── media/         # R2 image upload/delete
│   │   │   ├── notification/  # email service, templates
│   │   │   └── admin/         # dashboard, manual payment confirm
│   │   └── shared/            # enums, pagination, responses
│   ├── alembic/               # migrations (002 adds v0.2 tables)
│   ├── tests/                 # pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── app/[locale]/
│   │   ├── admin/
│   │   │   ├── payments/      # payment transaction list
│   │   │   ├── orders/[id]/   # order detail with timeline
│   │   │   └── products/      # product management + image upload
│   │   ├── checkout/
│   │   │   ├── return/        # payOS return handler
│   │   │   └── cancel/        # payOS cancel handler
│   │   └── products/[slug]/   # product detail with image gallery
│   ├── components/
│   │   ├── admin/             # OrderTimeline, PaymentTransactionTable, ProductImageManager
│   │   ├── checkout/          # CheckoutForm with PAYOS option
│   │   └── product/           # ProductDetailClient, ProductOptionSelector
│   ├── features/              # API clients and types per domain
│   ├── lib/                   # utilities, i18n config, auth helpers
│   └── messages/              # vi.json, zh-CN.json
├── spec/                      # Product specifications
└── docker-compose.yml
```

## Key Design Decisions

- **Backend is sole pricing authority** — frontend never calculates final prices
- **Cart stores IDs only** — `{ productId, quantity, selectedOptions }`, no labels or prices
- **Order status and payment status are separate fields** — never merged
- **All prices in integer VND** — no floats
- **Webhook idempotency** — duplicate payOS webhooks are ignored safely
- **Email is non-blocking** — email failure never fails the checkout or payment flow

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
# ngrok
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
docker exec wood_furniture_backend python -m pytest tests/ -v
```

### Run locally without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
