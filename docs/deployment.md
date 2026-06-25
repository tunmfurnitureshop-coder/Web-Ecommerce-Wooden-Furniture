# Deployment Guide

Production stack: **Vercel** (Next.js) · **Railway** (FastAPI + Arq worker + Redis) · **Supabase** (PostgreSQL) · **Cloudflare R2** (Images) · **Resend** (Email) · **Cloudflare** (DNS/CDN)

---

## Prerequisites — Accounts needed

| Service | Free tier | Purpose |
|---|---|---|
| [Supabase](https://supabase.com) | 500 MB DB, 2 projects | PostgreSQL |
| [Railway](https://railway.app) | $5 trial credit | FastAPI + Arq Worker |
| [Redis Cloud](https://redis.io/cloud) | 30 MB free | Redis (Arq queue) |
| [Vercel](https://vercel.com) | Hobby — non-commercial | Next.js frontend |
| [Cloudflare](https://cloudflare.com) | Free | R2 storage + DNS |
| [Resend](https://resend.com) | 3,000 emails/mo | Transactional email |
| [PayOS](https://payos.vn) | — | Payment gateway |

---

## Step 1 — Supabase (PostgreSQL)

1. Create new project → pick region **Southeast Asia (Singapore)**
2. Note down connection string from **Project Settings → Database → Connection string → URI**

```
postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

3. **Important**: Use the **Session mode** pooler URL (port `6543`) for async SQLAlchemy with psycopg3.

> Set `DATABASE_URL` in Railway backend env (Step 3).

---

## Step 2 — Redis Cloud

1. Đăng ký tại [redis.io/cloud](https://redis.io/cloud) (free tier: 30 MB)
2. **Create Database** → chọn region **Asia Pacific (Singapore)** → Cloud: AWS
3. Sau khi tạo xong, vào database → **Security** tab → note **Default user password**
4. **General** tab → copy **Public endpoint** (format: `redis-xxxxx.c1.ap-southeast-1-1.ec2.redns.redis-cloud.com:12345`)
5. Cấu trúc `REDIS_URL`:

```
redis://default:<password>@redis-xxxxx.c1.ap-southeast-1-1.ec2.redns.redis-cloud.com:12345
```

> Nếu Redis Cloud yêu cầu TLS, dùng `rediss://` (hai chữ s) thay vì `redis://`.

---

## Step 3 — Railway: FastAPI Backend

### 3a. Create service

1. In the same Railway project → **Add Service → GitHub Repo**
2. Select this repository
3. Set **Root Directory**: `backend`
4. Railway auto-detects `railway.toml` → uses `backend/Dockerfile`

### 3b. Environment variables

Set these in the Railway service **Variables** tab:

```bash
# Core
APP_NAME=Vin Furniture
ENV=production

# Database (from Supabase Step 1)
DATABASE_URL=postgresql+psycopg://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Auth
JWT_SECRET_KEY=<generate: openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CUSTOMER_JWT_EXPIRE_MINUTES=15
CUSTOMER_REFRESH_TOKEN_EXPIRE_DAYS=30

# Admin seed account
ADMIN_EMAIL=admin@vinfurniture.vn
ADMIN_PASSWORD=<strong-password>

# URLs — update after Vercel deploy (Step 5)
SITE_BASE_URL=https://vinfurniture.vn
FRONTEND_BASE_URL=https://vinfurniture.vn
CORS_ORIGINS=https://vinfurniture.vn,https://www.vinfurniture.vn

# Redis (from Step 2)
REDIS_URL=redis://default:password@host:port
ARQ_QUEUE_NAME=vin_furniture_jobs

# PayOS
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=https://vinfurniture.vn/vi/checkout/return
PAYOS_CANCEL_URL=https://vinfurniture.vn/vi/checkout/cancel
PAYOS_WEBHOOK_URL=https://<backend-railway-url>/api/v1/webhooks/payos

# Cloudflare R2 (from Step 6)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=vin-furniture
R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://images.vinfurniture.vn

# Email (Resend — from Step 7)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Vin Furniture <no-reply@vinfurniture.vn>
ADMIN_NOTIFICATION_EMAIL=admin@vinfurniture.vn

# Promotion engine
PROMOTION_TIMEZONE=Asia/Ho_Chi_Minh
PROMOTION_MAX_ACTIVE_PER_ORDER=1
PROMOTION_MAX_COUPON_CODE_LENGTH=40

# Cart recovery
ABANDONED_CART_DELAY_MINUTES=120
ABANDONED_CART_TOKEN_TTL_HOURS=168
ABANDONED_CART_SCAN_INTERVAL_MINUTES=15
```

### 3c. Generate domain

Railway dashboard → **Settings → Networking → Generate Domain**  
Note the URL: `https://web-production-xxxx.up.railway.app`

---

## Step 4 — Railway: Arq Worker

The worker uses the **same Docker image** as the backend but runs `arq` instead of uvicorn.

> ⚠️ **Do not override the Start Command in the dashboard.** Railway's `railway.toml`
> (config-as-code) always overrides dashboard settings. Since the worker shares the
> `backend/` directory with the backend service, it would otherwise read the backend's
> `railway.toml` and run `uvicorn` + the `/health` healthcheck (which a worker can't
> answer → deploy fails). Instead, point the worker at its own config file
> `backend/railway.worker.toml` (already in the repo).

1. In the same Railway project → **Add Service → GitHub Repo** (same repo again)
2. Set **Root Directory**: `backend`
3. **Settings → Config-as-code → Railway Config File** → set path to:

```
railway.worker.toml
```

   This makes the worker run `arq app.worker.WorkerSettings`, with **no healthcheck**
   and **no migrations** (migrations are owned by the backend service).
4. Copy **all the same environment variables** from Step 3b into this service.
   The worker needs `DATABASE_URL`, `REDIS_URL`, and all app secrets.
5. Worker does **not** need a public domain — leave **Networking** with no domain generated.

> Tip: In Railway you can reference variables across services with `${{backend.DATABASE_URL}}` to avoid duplication.

---

## Step 5 — Vercel: Next.js Frontend

### 5a. Import project

1. [vercel.com/new](https://vercel.com/new) → Import GitHub repo
2. Vercel reads `vercel.json` at repo root → sets **Root Directory** to `frontend` automatically
3. Framework preset auto-detected as **Next.js**

### 5b. Environment variables

Set in Vercel dashboard → **Settings → Environment Variables**:

```bash
# Public (exposed to browser)
NEXT_PUBLIC_API_BASE_URL=https://web-production-xxxx.up.railway.app
NEXT_PUBLIC_DEFAULT_LOCALE=vi

# Server-side only (RSC / API routes)
BACKEND_API_URL=https://web-production-xxxx.up.railway.app
```

> `NEXT_PUBLIC_API_BASE_URL` and `BACKEND_API_URL` both point to your Railway backend URL from Step 3c.

### 5c. Deploy

Click **Deploy**. First deploy takes ~3–5 minutes.

Production URL: `https://your-project.vercel.app`

After attaching custom domain (Step 8), go back and update Railway `CORS_ORIGINS` / `FRONTEND_BASE_URL` / `SITE_BASE_URL`.

---

## Step 6 — Cloudflare R2 (Image Storage)

1. Cloudflare dashboard → **R2** → **Create bucket** → name: `vin-furniture`
2. **Settings** → **Public Access** → Enable custom domain: `images.vinfurniture.vn`
3. **Manage API Tokens** → **Create Token** with **Object Read & Write** on the bucket
4. Copy:
   - Account ID (from R2 overview page)
   - Access Key ID
   - Secret Access Key

Fill these into the Railway backend env vars (Step 3b).

---

## Step 7 — Resend (Email)

1. [resend.com](https://resend.com) → Create account
2. **Domains** → Add `vinfurniture.vn` → add the DNS records to Cloudflare
3. **API Keys** → Create key with **Sending access** → copy to Railway env `RESEND_API_KEY`
4. Set `EMAIL_FROM=Vin Furniture <no-reply@vinfurniture.vn>`

---

## Step 8 — Cloudflare DNS & Custom Domain

### Add site to Cloudflare

1. Cloudflare dashboard → **Add a Site** → enter `vinfurniture.vn`
2. Update nameservers at your registrar to Cloudflare's

### DNS records

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` (or `www`) | `cname.vercel-dns.com` | Orange (proxied) |
| CNAME | `www` | `cname.vercel-dns.com` | Orange (proxied) |
| CNAME | `images` | `<bucket>.r2.cloudflarestorage.com` | Orange (proxied) |

### Attach domain in Vercel

Vercel dashboard → **Settings → Domains** → Add `vinfurniture.vn` and `www.vinfurniture.vn`

### SSL

Cloudflare handles SSL automatically. Set **SSL/TLS → Full (strict)**.

---

## Step 9 — Post-Deploy Checklist

### Database migrations

```bash
# Run from local machine or Railway CLI
railway run --service backend alembic upgrade head
```

Or via Railway dashboard → backend service → **New Deployment → Custom Command**:
```
alembic upgrade head
```

### Seed data (optional)

```bash
railway run --service backend python -m app.seed
```

### Register PayOS webhook

After backend is live, register your webhook URL in the PayOS dashboard:
```
https://web-production-xxxx.up.railway.app/api/v1/webhooks/payos
```

### Smoke tests

```bash
# Health check
curl https://web-production-xxxx.up.railway.app/health
# → {"status": "ok"}

# Frontend
curl -I https://vinfurniture.vn/vi
# → HTTP/2 200
```

---

## URLs Reference

| Service | URL |
|---|---|
| Frontend | `https://vinfurniture.vn` |
| Backend API | `https://web-production-xxxx.up.railway.app` |
| API Docs (Swagger) | `https://web-production-xxxx.up.railway.app/docs` |
| Image CDN | `https://images.vinfurniture.vn` |

---

## Rollback

**Frontend (Vercel):** Dashboard → Deployments → select previous → **Promote to Production**

**Backend (Railway):** Dashboard → backend service → Deployments → select previous → **Rollback**

```bash
# Via CLI
railway service rollback --service backend
```

---

## Cost Estimate (production traffic)

| Service | Plan | Est. cost |
|---|---|---|
| Vercel | Hobby (non-commercial) | $0 |
| Railway | Hobby + usage | ~$5–15/mo |
| Supabase | Free tier | $0 |
| Redis Cloud | Free (30 MB) | $0 |
| Cloudflare R2 | Free (10 GB storage, 1M ops) | $0 |
| Resend | Free (3,000 emails/mo) | $0 |
| **Total** | | **~$5–15/mo** |

> Upgrade to Vercel Pro ($20/mo) if using commercially or need >10s function timeout.
