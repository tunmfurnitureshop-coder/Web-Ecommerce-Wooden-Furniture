# Wood Furniture Ecommerce Platform

A full-stack ecommerce platform for premium wooden furniture with product customization (wood type, finish, size), server-side pricing, and a complete admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16 |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| State | Zustand (cart persistence) |
| i18n | next-intl v3 — route-based (`/vi/...`, `/zh-CN/...`) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
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
│   │   ├── core/          # config, database, security, exceptions
│   │   ├── modules/       # auth, product, pricing, cart, order, inventory, admin
│   │   └── shared/        # enums, pagination, responses
│   ├── alembic/           # migrations
│   ├── tests/             # pytest test suite (15 tests)
│   └── requirements.txt
├── frontend/
│   ├── app/[locale]/      # Next.js App Router pages
│   ├── components/        # UI components (product, cart, checkout, admin)
│   ├── features/          # API clients and types per domain
│   ├── lib/               # utilities, i18n config, auth helpers
│   └── messages/          # vi.json, zh-CN.json
├── spec/                  # Product specification
└── docker-compose.yml
```

## Key Design Decisions

- **Backend is sole pricing authority** — frontend never calculates final prices independently
- **Cart stores IDs only** — `{ productId, quantity, selectedOptions: { woodType, finish, size } }`, no labels or prices
- **Order status and payment status are separate fields** — never merged
- **All prices in integer VND** — no floats

## Development

### Run backend tests

```bash
docker exec wood_furniture_backend python -m pytest tests/ -v
```

### Environment variables

Copy and edit the example files before first run:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/wood_furniture` | PostgreSQL connection |
| `JWT_SECRET_KEY` | `change_me_in_dev` | Change in production |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |
