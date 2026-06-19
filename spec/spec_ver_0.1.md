# Implementation Spec: Wood Furniture Ecommerce Platform Ver 0.1

## 1. Objective

Build Ver 0.1 as an internal MVP for a wood furniture ecommerce platform.

The goal is to prove the full **customization-to-sale** flow:

```text
Customer browses catalog
→ opens product detail
→ selects wood type / finish / size
→ backend calculates price
→ customer adds customized item to cart
→ customer checks out
→ admin can view product, inventory, order, payment status
```

This version must prioritize speed, stable architecture, and clean data modeling over feature richness.

---

## 2. Scope

### 2.1 Customer Features

Ver 0.1 must include:

1. Homepage
2. Product catalog
3. Product filtering by query parameters
4. Product detail page
5. Product customization
6. Backend-driven price calculation
7. Client-side cart using `localStorage`
8. Cart hydration from backend
9. Checkout form
10. Order success page

### 2.2 Admin Features

Ver 0.1 must include:

1. Admin login using JWT
2. Basic admin dashboard
3. Product management
4. Inventory overview
5. Order management
6. Independent order status and payment status tracking
7. Basic revenue summary

---

## 3. Out of Scope for Ver 0.1

Do not implement these in Ver 0.1:

1. Customer login/register
2. Real payment gateway webhook
3. Cloudflare R2 image upload
4. 3D product viewer
5. AR preview
6. Wishlist
7. Reviews
8. Advanced search ranking
9. Email notification
10. Auto-expiring inventory reservation
11. Full CMS
12. Multi-admin role permission system
13. Production security hardening beyond basic JWT admin auth

If someone asks to add one of these during Ver 0.1, gently tell them the backlog exists so humans can practice restraint.

---

## 4. Tech Stack

### 4.1 Frontend

Use:

```text
Next.js
TypeScript
Tailwind CSS
Shadcn/UI
Zustand
next-intl
```

### 4.2 Backend

Use:

```text
FastAPI
Python 3.12+
Pydantic
SQLAlchemy 2.0
Alembic
PostgreSQL
JWT Auth
```

### 4.3 Infrastructure for Local Development

Use:

```text
Docker Compose
PostgreSQL container
Local static assets
Mock payment provider
```

---

## 5. System Architecture

```text
[Customer Browser]
      |
      | Next.js UI
      v
[Next.js App]
      |
      | REST API
      v
[FastAPI Backend]
      |
      | SQLAlchemy ORM
      v
[PostgreSQL Database]
```

### 5.1 Key Architecture Rules

1. Backend is the source of truth for pricing.
2. Frontend must never calculate final price independently.
3. Cart in `localStorage` only stores product IDs and option codes.
4. Product names, descriptions, slugs, and specifications must support localization at database level.
5. Admin authentication must use JWT.
6. Order status and payment status must be stored as separate fields.

---

## 6. Repository Structure

Recommended structure:

```text
wood-furniture-ecommerce/
  frontend/
    app/
    components/
    features/
    messages/
    lib/
    middleware.ts
    package.json

  backend/
    app/
    alembic/
    tests/
    pyproject.toml

  docker-compose.yml
  README.md
```

---

# Part A: Backend Spec

## 7. Backend Directory Structure

```text
backend/
  app/
    main.py

    core/
      config.py
      database.py
      security.py
      exceptions.py

    modules/
      auth/
        router.py
        service.py
        schemas.py
        models.py

      product/
        router.py
        service.py
        schemas.py
        models.py

      pricing/
        router.py
        service.py
        schemas.py

      cart/
        router.py
        service.py
        schemas.py

      order/
        router.py
        service.py
        schemas.py
        models.py

      inventory/
        router.py
        service.py
        schemas.py
        models.py

      admin/
        router.py
        service.py
        schemas.py

    shared/
      enums.py
      pagination.py
      responses.py

  alembic/
  tests/
```

---

## 8. Environment Variables

Create `.env`:

```env
APP_NAME=Wood Furniture Ecommerce
ENV=development

DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/wood_furniture

JWT_SECRET_KEY=change_me_in_dev
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

CORS_ORIGINS=http://localhost:3000
```

---

## 9. Database Schema

### 9.1 Enum Definitions

Create these enums:

```python
Locale:
  vi
  zh-CN

ProductStatus:
  ACTIVE
  INACTIVE

OrderStatus:
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPING
  DELIVERED
  CANCELLED

PaymentStatus:
  UNPAID
  PENDING
  PAID
  FAILED
  CANCELLED

PaymentMethod:
  COD
  BANK_TRANSFER
  MOCK_PROVIDER
```

Important rule:

```text
OrderStatus and PaymentStatus must never be merged.
```

Apparently separating concepts is difficult for civilization, but this one is non-negotiable.

---

## 10. Tables

### 10.1 `admin_users`

Purpose: Store pre-seeded admin account.

Fields:

```text
id UUID PK
email VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
role VARCHAR DEFAULT 'ADMIN'
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

### 10.2 `room_categories`

Purpose: Product room/category grouping.

Fields:

```text
id UUID PK
code VARCHAR UNIQUE NOT NULL
sort_order INT DEFAULT 0
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Example codes:

```text
living_room
bedroom
dining_room
office
outdoor
```

---

### 10.3 `room_category_translations`

Purpose: Localized category names and slugs.

Fields:

```text
id UUID PK
category_id UUID FK room_categories.id
locale VARCHAR NOT NULL
name VARCHAR NOT NULL
slug VARCHAR NOT NULL
description TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Constraints:

```text
UNIQUE(category_id, locale)
UNIQUE(locale, slug)
```

Vietnamese translation is mandatory. Chinese translation is optional.

---

### 10.4 `products`

Purpose: Store core product data.

Fields:

```text
id UUID PK
sku VARCHAR UNIQUE NOT NULL
room_category_id UUID FK room_categories.id
base_price_vnd INT NOT NULL
primary_image_url TEXT NULL
status ProductStatus DEFAULT ACTIVE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Notes:

```text
Price must be integer VND.
Do not use float for money.
```

---

### 10.5 `product_translations`

Purpose: Store localized product content.

Fields:

```text
id UUID PK
product_id UUID FK products.id
locale VARCHAR NOT NULL
name VARCHAR NOT NULL
slug VARCHAR NOT NULL
short_description TEXT NULL
description TEXT NULL
specifications JSONB NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Constraints:

```text
UNIQUE(product_id, locale)
UNIQUE(locale, slug)
```

Vietnamese fields are mandatory when creating product. Chinese fields are optional.

Example `specifications`:

```json
{
  "material": "Gỗ sồi tự nhiên",
  "origin": "Việt Nam",
  "warranty": "12 tháng",
  "care": "Lau bằng khăn mềm, tránh ánh nắng trực tiếp"
}
```

---

### 10.6 `wood_types`

Purpose: Define selectable wood options.

Fields:

```text
id UUID PK
code VARCHAR UNIQUE NOT NULL
price_delta_vnd INT DEFAULT 0
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Example codes:

```text
oak
walnut
ash
rubberwood
```

---

### 10.7 `wood_type_translations`

Fields:

```text
id UUID PK
wood_type_id UUID FK wood_types.id
locale VARCHAR NOT NULL
name VARCHAR NOT NULL
description TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Constraints:

```text
UNIQUE(wood_type_id, locale)
```

---

### 10.8 `finish_options`

Purpose: Define finish/color options.

Fields:

```text
id UUID PK
code VARCHAR UNIQUE NOT NULL
price_delta_vnd INT DEFAULT 0
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Example codes:

```text
natural
matte
dark_brown
walnut_tone
```

---

### 10.9 `finish_option_translations`

Fields:

```text
id UUID PK
finish_option_id UUID FK finish_options.id
locale VARCHAR NOT NULL
name VARCHAR NOT NULL
description TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Constraints:

```text
UNIQUE(finish_option_id, locale)
```

---

### 10.10 `size_options`

Purpose: Define size variants.

Fields:

```text
id UUID PK
code VARCHAR UNIQUE NOT NULL
width_cm INT NULL
depth_cm INT NULL
height_cm INT NULL
price_delta_vnd INT DEFAULT 0
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Example codes:

```text
small
medium
large
custom_standard
```

---

### 10.11 `size_option_translations`

Fields:

```text
id UUID PK
size_option_id UUID FK size_options.id
locale VARCHAR NOT NULL
name VARCHAR NOT NULL
description TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Constraints:

```text
UNIQUE(size_option_id, locale)
```

---

### 10.12 `product_available_options`

Purpose: Define which options are available for each product.

Fields:

```text
id UUID PK
product_id UUID FK products.id
wood_type_id UUID FK wood_types.id NULL
finish_option_id UUID FK finish_options.id NULL
size_option_id UUID FK size_options.id NULL
image_url TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Recommended implementation for Ver 0.1:

```text
Store availability separately by option type.
```

Alternative simpler approach:

```text
product_wood_types
product_finish_options
product_size_options
```

For Ver 0.1, the simpler separate-table approach is easier to implement and query.

Recommended tables:

```text
product_wood_types(product_id, wood_type_id)
product_finish_options(product_id, finish_option_id, image_url)
product_size_options(product_id, size_option_id)
```

---

### 10.13 `inventory_items`

Purpose: Track stock.

Fields:

```text
id UUID PK
product_id UUID FK products.id UNIQUE
total_qty INT NOT NULL DEFAULT 0
reserved_qty INT NOT NULL DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

Available quantity should be calculated:

```text
available_qty = total_qty - reserved_qty
```

Do not store `available_qty` as an independent mutable field unless there is a strong reason. Duplicated state is where bugs go to retire.

---

### 10.14 `orders`

Purpose: Store customer orders.

Fields:

```text
id UUID PK
order_code VARCHAR UNIQUE NOT NULL

customer_name VARCHAR NOT NULL
customer_phone VARCHAR NOT NULL
customer_email VARCHAR NULL
shipping_address TEXT NOT NULL
note TEXT NULL

subtotal_vnd INT NOT NULL
shipping_fee_vnd INT DEFAULT 0
total_vnd INT NOT NULL
currency VARCHAR DEFAULT 'VND'

order_status OrderStatus NOT NULL
payment_status PaymentStatus NOT NULL
payment_method PaymentMethod NOT NULL

created_at TIMESTAMP
updated_at TIMESTAMP
```

---

### 10.15 `order_items`

Purpose: Store order item snapshot.

Fields:

```text
id UUID PK
order_id UUID FK orders.id
product_id UUID FK products.id

product_name_snapshot VARCHAR NOT NULL
product_sku_snapshot VARCHAR NOT NULL

selected_options_snapshot JSONB NOT NULL
unit_price_vnd INT NOT NULL
quantity INT NOT NULL
line_total_vnd INT NOT NULL

created_at TIMESTAMP
updated_at TIMESTAMP
```

Example `selected_options_snapshot`:

```json
{
  "woodType": {
    "code": "walnut",
    "label": "Gỗ óc chó",
    "priceDeltaVnd": 2500000
  },
  "finish": {
    "code": "matte",
    "label": "Sơn mờ",
    "priceDeltaVnd": 300000
  },
  "size": {
    "code": "large",
    "label": "Lớn",
    "priceDeltaVnd": 1200000
  }
}
```

---

## 11. Pricing Engine

### 11.1 Pricing Rules

Backend must calculate final price.

Formula for Ver 0.1:

```text
unit_price_vnd =
  product.base_price_vnd
  + wood_type.price_delta_vnd
  + finish_option.price_delta_vnd
  + size_option.price_delta_vnd
```

Then:

```text
line_total_vnd = unit_price_vnd * quantity
cart_total_vnd = sum(line_total_vnd)
```

### 11.2 Validation Rules

Pricing request must validate:

1. Product exists.
2. Product is active.
3. Wood type exists and is active.
4. Finish option exists and is active.
5. Size option exists and is active.
6. Selected options are available for the product.
7. Quantity is greater than 0.
8. Price must be returned as integer VND.

---

## 12. Backend API Spec

Base prefix:

```text
/api/v1
```

---

## 13. Public APIs

### 13.1 Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

### 13.2 Get Product Catalog

```http
GET /api/v1/products
```

Query params:

```text
locale=vi | zh-CN
room=living-room
woodType=oak
minPrice=1000000
maxPrice=10000000
page=1
pageSize=12
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "sku": "CHAIR_001",
      "name": "Ghế gỗ sồi",
      "slug": "ghe-go-soi",
      "shortDescription": "Ghế gỗ tự nhiên cho phòng ăn",
      "basePriceVnd": 3200000,
      "primaryImageUrl": "/images/products/chair-001.jpg",
      "room": {
        "code": "dining_room",
        "name": "Phòng ăn"
      }
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 30
}
```

---

### 13.3 Get Product Detail

```http
GET /api/v1/products/{slug}
```

Query params:

```text
locale=vi
```

Response:

```json
{
  "id": "uuid",
  "sku": "TABLE_001",
  "name": "Bàn ăn gỗ óc chó",
  "slug": "ban-an-go-oc-cho",
  "description": "Bàn ăn gỗ tự nhiên...",
  "specifications": {
    "material": "Gỗ óc chó",
    "warranty": "12 tháng"
  },
  "basePriceVnd": 12000000,
  "primaryImageUrl": "/images/products/table-001.jpg",
  "availableOptions": {
    "woodTypes": [
      {
        "code": "walnut",
        "name": "Gỗ óc chó",
        "priceDeltaVnd": 2500000
      }
    ],
    "finishes": [
      {
        "code": "matte",
        "name": "Sơn mờ",
        "priceDeltaVnd": 300000,
        "imageUrl": "/images/products/table-001-matte.jpg"
      }
    ],
    "sizes": [
      {
        "code": "large",
        "name": "Lớn",
        "widthCm": 180,
        "depthCm": 90,
        "heightCm": 75,
        "priceDeltaVnd": 1200000
      }
    ]
  }
}
```

---

### 13.4 Get Pricing Quote

```http
POST /api/v1/pricing/quote
```

Request:

```json
{
  "productId": "uuid",
  "quantity": 1,
  "selectedOptions": {
    "woodType": "walnut",
    "finish": "matte",
    "size": "large"
  }
}
```

Response:

```json
{
  "productId": "uuid",
  "quantity": 1,
  "unitPriceVnd": 16000000,
  "lineTotalVnd": 16000000,
  "breakdown": {
    "basePriceVnd": 12000000,
    "woodTypeDeltaVnd": 2500000,
    "finishDeltaVnd": 300000,
    "sizeDeltaVnd": 1200000
  }
}
```

---

### 13.5 Hydrate Cart

```http
POST /api/v1/cart/hydrate
```

Request:

```json
{
  "locale": "vi",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "selectedOptions": {
        "woodType": "walnut",
        "finish": "matte",
        "size": "large"
      }
    }
  ]
}
```

Response:

```json
{
  "items": [
    {
      "productId": "uuid",
      "sku": "TABLE_001",
      "name": "Bàn ăn gỗ óc chó",
      "imageUrl": "/images/products/table-001.jpg",
      "quantity": 1,
      "selectedOptions": {
        "woodType": {
          "code": "walnut",
          "label": "Gỗ óc chó"
        },
        "finish": {
          "code": "matte",
          "label": "Sơn mờ"
        },
        "size": {
          "code": "large",
          "label": "Lớn"
        }
      },
      "unitPriceVnd": 16000000,
      "lineTotalVnd": 16000000
    }
  ],
  "subtotalVnd": 16000000,
  "totalVnd": 16000000,
  "currency": "VND"
}
```

---

### 13.6 Create Order

```http
POST /api/v1/orders
```

Request:

```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0900000000",
  "customerEmail": "a@example.com",
  "shippingAddress": "Hà Nội",
  "note": "Giao giờ hành chính",
  "paymentMethod": "COD",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "selectedOptions": {
        "woodType": "walnut",
        "finish": "matte",
        "size": "large"
      }
    }
  ]
}
```

Backend must:

1. Validate customer fields.
2. Recalculate all prices.
3. Validate stock availability.
4. Create order.
5. Create order item snapshots.
6. Increment `reserved_qty`.
7. Return order code.

Initial status rules:

```text
COD:
  order_status = PROCESSING
  payment_status = PENDING

BANK_TRANSFER:
  order_status = PENDING_PAYMENT
  payment_status = PENDING

MOCK_PROVIDER:
  order_status = PAID
  payment_status = PAID
```

Response:

```json
{
  "orderCode": "ORD-2026-000001",
  "orderStatus": "PROCESSING",
  "paymentStatus": "PENDING",
  "totalVnd": 16000000,
  "currency": "VND"
}
```

---

### 13.7 Get Order Summary

```http
GET /api/v1/orders/{orderCode}
```

Response:

```json
{
  "orderCode": "ORD-2026-000001",
  "customerName": "Nguyễn Văn A",
  "orderStatus": "PROCESSING",
  "paymentStatus": "PENDING",
  "paymentMethod": "COD",
  "items": [],
  "totalVnd": 16000000,
  "currency": "VND",
  "createdAt": "2026-01-01T10:00:00"
}
```

---

# Part B: Admin Backend APIs

## 14. Admin Auth

### 14.1 Login

```http
POST /api/v1/admin/auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "bearer"
}
```

All admin APIs require:

```http
Authorization: Bearer <token>
```

---

## 15. Admin Product APIs

### 15.1 List Products

```http
GET /api/v1/admin/products
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "sku": "TABLE_001",
      "nameVi": "Bàn ăn gỗ óc chó",
      "basePriceVnd": 12000000,
      "status": "ACTIVE",
      "inventory": {
        "totalQty": 20,
        "reservedQty": 2,
        "availableQty": 18
      }
    }
  ]
}
```

---

### 15.2 Create Product

```http
POST /api/v1/admin/products
```

Request:

```json
{
  "sku": "TABLE_001",
  "roomCategoryCode": "dining_room",
  "basePriceVnd": 12000000,
  "primaryImageUrl": "/images/products/table-001.jpg",
  "status": "ACTIVE",
  "translations": {
    "vi": {
      "name": "Bàn ăn gỗ óc chó",
      "slug": "ban-an-go-oc-cho",
      "shortDescription": "Bàn ăn gỗ tự nhiên",
      "description": "Mô tả chi tiết",
      "specifications": {
        "material": "Gỗ óc chó",
        "warranty": "12 tháng"
      }
    },
    "zh-CN": {
      "name": "胡桃木餐桌",
      "slug": "hu-tao-mu-can-zhuo",
      "shortDescription": "天然木餐桌",
      "description": "详细描述",
      "specifications": {}
    }
  },
  "optionCodes": {
    "woodTypes": ["walnut", "oak"],
    "finishes": ["natural", "matte"],
    "sizes": ["medium", "large"]
  },
  "inventory": {
    "totalQty": 20
  }
}
```

Validation:

```text
Vietnamese translation is required.
Chinese translation is optional.
Slug must be unique per locale.
SKU must be unique.
Base price must be >= 0.
```

---

### 15.3 Update Product

```http
PATCH /api/v1/admin/products/{productId}
```

Allow update:

```text
sku
room category
base price
primary image URL
status
translations
available option codes
inventory total quantity
```

---

## 16. Admin Inventory APIs

### 16.1 List Inventory

```http
GET /api/v1/admin/inventory
```

Response:

```json
{
  "items": [
    {
      "productId": "uuid",
      "sku": "TABLE_001",
      "nameVi": "Bàn ăn gỗ óc chó",
      "totalQty": 20,
      "reservedQty": 2,
      "availableQty": 18
    }
  ]
}
```

---

### 16.2 Update Inventory

```http
PATCH /api/v1/admin/inventory/{productId}
```

Request:

```json
{
  "totalQty": 30
}
```

Rules:

```text
totalQty must be >= reservedQty.
reservedQty should not be manually edited in Ver 0.1 except through order transitions.
```

---

## 17. Admin Order APIs

### 17.1 List Orders

```http
GET /api/v1/admin/orders
```

Query params:

```text
orderStatus
paymentStatus
paymentMethod
page
pageSize
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "orderCode": "ORD-2026-000001",
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0900000000",
      "totalVnd": 16000000,
      "orderStatus": "PROCESSING",
      "paymentStatus": "PENDING",
      "paymentMethod": "COD",
      "createdAt": "2026-01-01T10:00:00"
    }
  ]
}
```

---

### 17.2 Get Order Detail

```http
GET /api/v1/admin/orders/{orderId}
```

Response includes:

```text
customer info
shipping address
note
items
selected option snapshots
order status
payment status
payment method
total
created time
```

---

### 17.3 Update Order Status

```http
PATCH /api/v1/admin/orders/{orderId}/status
```

Request:

```json
{
  "orderStatus": "SHIPPING",
  "paymentStatus": "PAID"
}
```

Rules:

```text
orderStatus can be updated independently.
paymentStatus can be updated independently.
```

Inventory transition rules:

```text
When order is created:
  increment reserved_qty.

When order becomes CANCELLED:
  decrement reserved_qty.

When order becomes DELIVERED:
  decrement total_qty.
  decrement reserved_qty.
```

Implementation note:

```text
Order transition should be idempotent enough for Ver 0.1.
Do not decrement inventory twice if the same status is submitted again.
```

---

## 18. Admin Dashboard API

```http
GET /api/v1/admin/dashboard/summary
```

Response:

```json
{
  "totalOrders": 30,
  "totalRevenueVnd": 120000000,
  "pendingOrders": 5,
  "paidOrders": 20,
  "lowStockProducts": 3
}
```

Revenue rule for Ver 0.1:

```text
Revenue = sum(total_vnd) where payment_status = PAID
```

---

# Part C: Frontend Spec

## 19. Frontend Directory Structure

```text
frontend/
  app/
    [locale]/
      page.tsx

      products/
        page.tsx
        [slug]/
          page.tsx

      cart/
        page.tsx

      checkout/
        page.tsx

      success/
        page.tsx

      admin/
        login/
          page.tsx

        dashboard/
          page.tsx

        products/
          page.tsx

        products/
          new/
            page.tsx

        products/
          [id]/
            edit/
              page.tsx

        orders/
          page.tsx

        orders/
          [id]/
            page.tsx

        inventory/
          page.tsx

  components/
    product/
      ProductCard.tsx
      ProductGrid.tsx
      ProductFilters.tsx
      ProductOptionSelector.tsx
      PriceBreakdown.tsx

    cart/
      CartItem.tsx
      CartSummary.tsx

    checkout/
      CheckoutForm.tsx

    admin/
      AdminSidebar.tsx
      AdminHeader.tsx
      ProductForm.tsx
      OrderStatusEditor.tsx
      InventoryTable.tsx

    layout/
      Header.tsx
      Footer.tsx

    ui/

  features/
    cart/
      cart.store.ts
      cart.types.ts
      cart.api.ts

    product/
      product.api.ts
      product.types.ts

    checkout/
      checkout.api.ts
      checkout.types.ts

    admin/
      admin.api.ts
      admin.types.ts

  messages/
    vi.json
    zh-CN.json

  lib/
    api.ts
    format-currency.ts
    i18n.ts
    auth.ts
```

---

## 20. Frontend Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_LOCALE=vi
```

---

## 21. Internationalization

Use route-based locale:

```text
/vi
/vi/products
/vi/products/[slug]
/zh-CN
/zh-CN/products
/zh-CN/products/[slug]
```

Default locale:

```text
vi
```

Fallback rule:

```text
If zh-CN translation is missing, backend should fallback to Vietnamese.
```

Frontend message files:

```text
messages/vi.json
messages/zh-CN.json
```

Use message files for static UI labels only:

```text
Cart
Checkout
Add to cart
Product details
Admin login
```

Use database translations for dynamic content:

```text
Product name
Product slug
Product description
Category name
Wood type label
Finish label
Size label
Specifications
```

---

## 22. Customer Pages

### 22.1 Homepage

Route:

```text
/[locale]
```

Required sections:

```text
Hero section
Featured products
Room categories
CTA to product catalog
```

Data:

```text
Fetch featured products from /api/v1/products?locale=vi&pageSize=6
```

---

### 22.2 Product Catalog Page

Route:

```text
/[locale]/products
```

Features:

```text
Product grid
Room filter
Wood type filter
Price range filter
Pagination
```

Filtering must use query params:

```text
/vi/products?room=dining-room&woodType=oak&minPrice=1000000&maxPrice=10000000
```

Frontend behavior:

```text
Changing filter updates URL query params.
Page fetches products based on query params.
URL must be shareable.
```

---

### 22.3 Product Detail Page

Route:

```text
/[locale]/products/[slug]
```

Features:

```text
Product images
Localized product info
Specifications
Wood type selector
Finish selector
Size selector
Dynamic price display
Add to cart button
```

Pricing behavior:

```text
When selected options change:
  call POST /api/v1/pricing/quote
  update price from backend response
```

Image behavior for Ver 0.1:

```text
Use 2D image swaps only.
No 3D.
No AR.
```

---

## 23. Cart

### 23.1 Zustand Store

Cart item structure:

```ts
type CartItem = {
  productId: string;
  quantity: number;
  selectedOptions: {
    woodType: string;
    finish: string;
    size: string;
  };
};
```

Store actions:

```ts
addItem(item)
removeItem(key)
updateQuantity(key, quantity)
clearCart()
getItems()
```

Cart key rule:

```text
Same productId + same selectedOptions = same cart line.
Same productId + different selectedOptions = different cart line.
```

### 23.2 localStorage Rule

Only store this:

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "selectedOptions": {
        "woodType": "walnut",
        "finish": "matte",
        "size": "large"
      }
    }
  ]
}
```

Do not store:

```text
product name
localized label
price
image URL
description
```

Because stale cart data is how small ecommerce apps become haunted houses.

---

### 23.3 Cart Page

Route:

```text
/[locale]/cart
```

Behavior:

```text
Read cart items from Zustand/localStorage.
Call POST /api/v1/cart/hydrate.
Render localized product names, option labels, current prices.
Allow quantity update.
Allow remove item.
Show subtotal and total.
CTA to checkout.
```

---

## 24. Checkout

Route:

```text
/[locale]/checkout
```

Form fields:

```text
Customer name
Phone
Email
Shipping address
Note
Payment method
```

Payment methods:

```text
COD
BANK_TRANSFER
MOCK_PROVIDER
```

Submit behavior:

```text
Read cart from Zustand.
Send cart + customer info to POST /api/v1/orders.
Backend recalculates price.
Backend creates order.
Frontend clears cart.
Frontend redirects to /[locale]/success?orderCode=...
```

Validation:

```text
customerName required
customerPhone required
shippingAddress required
paymentMethod required
email optional but must be valid if provided
cart must not be empty
```

---

## 25. Success Page

Route:

```text
/[locale]/success?orderCode=ORD-2026-000001
```

Behavior:

```text
Call GET /api/v1/orders/{orderCode}
Display order code
Display order status
Display payment status
Display order items
Display total VND
CTA back to catalog
```

---

# Part D: Admin Frontend Spec

## 26. Admin Login

Route:

```text
/[locale]/admin/login
```

Behavior:

```text
Admin enters email/password.
Call POST /api/v1/admin/auth/login.
Store JWT token in localStorage for Ver 0.1.
Redirect to admin dashboard.
```

Note:

```text
For production, prefer httpOnly cookie.
For Ver 0.1 internal MVP, localStorage token is acceptable.
```

---

## 27. Admin Layout

Admin routes:

```text
/[locale]/admin/dashboard
/[locale]/admin/products
/[locale]/admin/products/new
/[locale]/admin/products/[id]/edit
/[locale]/admin/orders
/[locale]/admin/orders/[id]
/[locale]/admin/inventory
```

Admin layout must include:

```text
Sidebar navigation
Header
Logout button
Protected route behavior
```

Protected route behavior:

```text
If JWT is missing:
  redirect to /[locale]/admin/login
```

---

## 28. Admin Dashboard

Route:

```text
/[locale]/admin/dashboard
```

Widgets:

```text
Total orders
Revenue VND
Pending orders
Paid orders
Low stock products
```

Data source:

```text
GET /api/v1/admin/dashboard/summary
```

---

## 29. Admin Products

### 29.1 Product List

Route:

```text
/[locale]/admin/products
```

Columns:

```text
SKU
Vietnamese name
Base price
Status
Total qty
Reserved qty
Available qty
Actions
```

Actions:

```text
Create product
Edit product
```

---

### 29.2 Product Form

Used for:

```text
Create product
Edit product
```

Fields:

```text
SKU
Room category
Base price VND
Primary image URL
Status

Vietnamese name
Vietnamese slug
Vietnamese short description
Vietnamese description
Vietnamese specifications

Chinese name optional
Chinese slug optional
Chinese short description optional
Chinese description optional
Chinese specifications optional

Available wood types
Available finishes
Available sizes
Initial inventory total quantity
```

Validation:

```text
Vietnamese name required
Vietnamese slug required
SKU required
Base price >= 0
At least one wood type
At least one finish
At least one size
Inventory total quantity >= 0
```

---

## 30. Admin Orders

### 30.1 Order List

Route:

```text
/[locale]/admin/orders
```

Columns:

```text
Order code
Customer name
Phone
Total VND
Order status
Payment status
Payment method
Created at
Actions
```

Filters:

```text
Order status
Payment status
Payment method
```

---

### 30.2 Order Detail

Route:

```text
/[locale]/admin/orders/[id]
```

Sections:

```text
Customer information
Shipping address
Order items
Selected option snapshots
Payment method
Order status editor
Payment status editor
Total VND
```

Important UI rule:

```text
Order status editor and payment status editor must be visually separate.
```

This avoids the classic bug where someone marks an unpaid order as shipped because the UI decided concepts are decorative.

---

## 31. Admin Inventory

Route:

```text
/[locale]/admin/inventory
```

Columns:

```text
SKU
Product name
Total quantity
Reserved quantity
Available quantity
```

Actions:

```text
Update total quantity
```

Rules:

```text
reserved quantity is read-only in Ver 0.1
available quantity is calculated
```

---

# Part E: Seed Data

## 32. Required Seed Data

Create seed script:

```text
backend/app/seed.py
```

Seed:

```text
1 admin user
5 room categories
4 wood types
4 finish options
3 size options
8-12 products
inventory for each product
Vietnamese translations for all required data
Optional Chinese translations for 30-50% of products
```

Example admin:

```text
email: admin@example.com
password: admin123
```

Example categories:

```text
living_room
bedroom
dining_room
office
outdoor
```

Example products:

```text
Bàn ăn gỗ óc chó
Ghế gỗ sồi
Tủ đầu giường
Kệ sách gỗ tự nhiên
Bàn làm việc gỗ
Giường gỗ cao su
Bàn trà phòng khách
Tủ quần áo gỗ
```

---

# Part F: Validation and Error Handling

## 33. Common Error Format

All backend errors should use:

```json
{
  "error": {
    "code": "INVALID_SELECTED_OPTION",
    "message": "Selected wood type is not available for this product.",
    "details": {}
  }
}
```

Common error codes:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
PRODUCT_NOT_FOUND
PRODUCT_INACTIVE
INVALID_SELECTED_OPTION
INSUFFICIENT_STOCK
ORDER_NOT_FOUND
DUPLICATE_SLUG
DUPLICATE_SKU
```

---

## 34. Backend Validation Checklist

Product:

```text
SKU unique
Base price >= 0
Vietnamese translation required
Slug unique per locale
Product must have at least one wood type, finish, and size
```

Pricing:

```text
Product exists
Product active
Options valid
Options available for selected product
Quantity > 0
```

Checkout:

```text
Cart not empty
Customer name required
Phone required
Shipping address required
Payment method valid
Stock available
Prices recalculated on backend
```

Inventory:

```text
total_qty >= reserved_qty
reserved_qty cannot go below 0
available_qty cannot go below 0
```

Order status:

```text
Order status and payment status updated independently
Inventory transition must not double-apply
```

---

# Part G: Testing Spec

## 35. Backend Unit Tests

Test:

```text
Pricing formula
Invalid product ID
Invalid option code
Option not available for product
Cart hydration
Order creation
Stock reservation on order creation
Release stock on cancellation
Reduce stock on delivery
Admin login
JWT protected routes
```

---

## 36. Backend Integration Tests

Test full flows:

```text
Create product
List product catalog
View product detail
Quote price
Hydrate cart
Create order
Admin updates payment status
Admin updates order status
```

---

## 37. Frontend Manual QA

Customer flow:

```text
Open homepage
Open product catalog
Filter by room
Filter by wood type
Open product detail
Select options
See price update
Add to cart
Open cart
Refresh page and cart persists
Checkout
Success page shows order code and total
```

Admin flow:

```text
Login
Open dashboard
Create product
Edit product
View inventory
View order
Update order status
Update payment status
Logout
```

---

# Part H: Implementation Plan

## 38. Milestone 1: Project Setup

Backend:

```text
Create FastAPI app
Configure PostgreSQL
Configure SQLAlchemy
Configure Alembic
Add Docker Compose
Add health endpoint
```

Frontend:

```text
Create Next.js app
Install Tailwind
Install Shadcn/UI
Install next-intl
Install Zustand
Configure locale routing
Configure API client
```

Done when:

```text
Frontend runs on localhost:3000
Backend runs on localhost:8000
PostgreSQL runs locally
GET /health returns ok
```

---

## 39. Milestone 2: Database and Seed

Implement:

```text
SQLAlchemy models
Alembic migrations
Enums
Seed script
Admin user seed
Product seed data
Option seed data
Inventory seed data
```

Done when:

```text
Database can be migrated from empty state.
Seed script inserts usable demo data.
```

---

## 40. Milestone 3: Public Product APIs

Implement:

```text
Product catalog API
Product detail API
Filtering by room, wood type, price
Localized response
Vietnamese fallback for missing Chinese translation
```

Done when:

```text
Catalog page can fetch products.
Product detail page can fetch detail by localized slug.
```

---

## 41. Milestone 4: Pricing and Cart APIs

Implement:

```text
Pricing quote API
Cart hydration API
Selected option validation
Price breakdown
```

Done when:

```text
Frontend can select options and receive backend-calculated price.
Cart page can hydrate localStorage items.
```

---

## 42. Milestone 5: Customer Frontend

Implement:

```text
Homepage
Catalog page
Filter UI using query params
Product detail page
Option selectors
Price display
Add to cart
Cart page
```

Done when:

```text
Customer can browse, customize, add item to cart, refresh page, and still see cart.
```

---

## 43. Milestone 6: Checkout and Order

Implement:

```text
Checkout form
Create order API
Order item snapshots
Inventory reservation on order creation
Success page
```

Done when:

```text
Customer can complete checkout and see order success page.
Admin can see created order in database/API.
```

---

## 44. Milestone 7: Admin Auth and Admin UI

Implement:

```text
Admin login API
JWT generation
JWT middleware/dependency
Admin protected APIs
Admin frontend login
Admin protected layout
```

Done when:

```text
Admin can login and access dashboard.
Unauthenticated user is redirected to login.
```

---

## 45. Milestone 8: Admin Product, Order, Inventory

Implement:

```text
Admin dashboard
Product list
Product create/edit
Inventory list/update
Order list
Order detail
Order/payment status update
```

Done when:

```text
Admin can manage core business data needed for Ver 0.1.
```

---

## 46. Milestone 9: QA and Bug Fixing

Run:

```text
Backend tests
Frontend manual QA
Full end-to-end customer flow
Full admin flow
```

Fix:

```text
Pricing mismatch
Cart hydration mismatch
i18n missing fallback
Inventory negative bugs
Order/payment status confusion
```

Done when:

```text
Ver 0.1 success criteria are met.
```

---

# Part I: Acceptance Criteria

## 47. Customer Acceptance Criteria

Ver 0.1 is accepted when:

```text
User can open homepage.
User can browse product catalog.
User can filter catalog by room, wood type, and price through URL query params.
User can open product detail.
User can select wood type, finish, and size.
User sees backend-calculated price.
User can add customized product to cart.
Cart persists after refresh.
Cart only stores product IDs and option codes in localStorage.
Cart page hydrates product labels and prices from backend.
User can checkout with name, phone, email, address, note, and payment method.
User sees success page with order code and total VND.
```

---

## 48. Admin Acceptance Criteria

Admin side is accepted when:

```text
Admin can login with pre-seeded account.
Admin can view dashboard summary.
Admin can create product with Vietnamese translation.
Admin can optionally add Chinese translation.
Admin can edit product.
Admin can view inventory total/reserved/available quantities.
Admin can update total inventory.
Admin can view order list.
Admin can view order detail.
Admin can update order status.
Admin can update payment status separately.
```

---

## 49. Technical Acceptance Criteria

Technical implementation is accepted when:

```text
Database supports localized product/category/option content.
Pricing is calculated by backend.
Frontend does not trust client-side price.
Product filtering works through query params.
JWT protects admin APIs.
OrderStatus and PaymentStatus are separate fields.
Money is stored as integer VND.
Seed script can create demo data.
Backend tests pass.
No Ver 0.2+ features are accidentally implemented.
```

---

# Part J: Suggested Coding Order for AI Coding Assistant

Use this order:

```text
1. Create backend skeleton.
2. Add database config and SQLAlchemy session.
3. Add enums and models.
4. Add Alembic migrations.
5. Add seed data.
6. Add public product APIs.
7. Add pricing service.
8. Add cart hydration API.
9. Add order creation API.
10. Add admin auth.
11. Add admin APIs.
12. Create frontend skeleton.
13. Configure next-intl.
14. Build customer homepage/catalog/detail.
15. Build Zustand cart.
16. Build cart and checkout.
17. Build success page.
18. Build admin login/layout.
19. Build admin dashboard/products/orders/inventory.
20. Run QA and fix edge cases.
```

---

## 50. Definition of Done for Ver 0.1

Ver 0.1 is done when this demo works from start to finish:

```text
1. Customer opens /vi/products.
2. Customer filters products.
3. Customer opens one product.
4. Customer chooses wood type, finish, and size.
5. Backend returns updated price.
6. Customer adds product to cart.
7. Customer refreshes browser and cart remains.
8. Customer checks out using COD or bank transfer.
9. Customer sees order success page.
10. Admin logs in.
11. Admin sees the order.
12. Admin updates payment status separately from order status.
13. Admin checks inventory.
```

No hard-coded checkout. No fake cart labels stored forever. No frontend-only pricing. No status soup. Humanity may continue.
