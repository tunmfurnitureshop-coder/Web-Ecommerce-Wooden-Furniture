# Implementation Spec: Vin Furniture E-commerce Platform Ver 0.5

## 1. Version Name

```text
Ver 0.5 — Promotion, Campaign & Conversion Optimization
```

---

## 2. Version Goal

Ver 0.5 transforms the platform from a store that can sell products into a store that can run controlled commercial campaigns and measure purchase-conversion behavior.

Current customer journey:

```text
Discovery
→ Product detail
→ Cart
→ Checkout
→ Payment
→ Order
```

Ver 0.5 target journey:

```text
Campaign / Collection / Product
→ Add to cart
→ Promotion evaluation
→ Discount breakdown
→ Checkout
→ Payment
→ Attribution + conversion events
→ Reminder if cart is abandoned
```

Primary business goals:

```text
1. Increase conversion rate.
2. Increase average order value.
3. Enable controlled coupons and automatic promotions.
4. Enable campaign landing pages and room-set offers.
5. Track core commerce funnel events.
6. Recover eligible abandoned carts through email reminders.
7. Keep all pricing and discount calculations authoritative on the backend.
```

---

## 3. Scope

### 3.1 Included Features

```text
1. Commerce analytics event foundation
2. Anonymous/session/customer attribution model
3. Coupon code engine
4. Automatic promotion engine
5. Product/category/collection promotion eligibility
6. Basic room-set and bundle promotion rules
7. Promotion validation in cart and checkout
8. Promotion redemption lifecycle
9. Promotion and campaign admin management
10. Campaign landing pages
11. Discount breakdown in cart and checkout
12. Checkout idempotency
13. Cart recovery session tracking
14. Abandoned-cart reminder email
15. Promotion/campaign operational metrics
16. Shared domain schemas, API contracts, validation schemas, and UI view models
```

---

## 4. Out of Scope

Do not implement these in Ver 0.5:

```text
- Promotion stacking across multiple promotions
- Buy X Get Y
- Tiered multi-step discount rules
- Referral program
- Affiliate system
- Loyalty points
- Gift cards
- Store credit
- Dynamic customer-specific pricing
- AI-generated discounts
- Price-drop notification
- Back-in-stock notification
- Wishlist reminder emails
- Multi-step marketing journey builder
- Advanced campaign inventory allocation
- Full BI dashboard
- Customer segmentation engine
- Personalized recommendation ranking
- Shipping-provider fee calculation
```

These can be introduced later once promotion rules, analytics events, and operational inventory flows are stable.

---

# Part A: Product and Business Rules

## 5. Promotion Model Decision

Ver 0.5 supports two promotion triggers:

```text
COUPON
AUTOMATIC
```

### 5.1 Coupon Promotion

Customer enters a code manually.

Examples:

```text
SUMMER10
WELCOME500K
DINING2026
```

Supported benefits:

```text
Percentage discount
Fixed VND discount
```

### 5.2 Automatic Promotion

Backend automatically evaluates an active promotion based on cart eligibility.

Examples:

```text
10% off all dining tables
500,000 VND off walnut products
Discount for products in a specific collection
Room-set bundle discount
```

---

## 6. Promotion Selection Rule

To keep Ver 0.5 reliable, the platform supports:

```text
Maximum one applied promotion per order.
```

Promotion engine behavior:

```text
1. Evaluate submitted coupon if provided.
2. Evaluate all eligible automatic promotions.
3. Calculate discount value for each candidate.
4. Select the promotion with the highest valid discount.
5. If discount values are equal:
   - select higher priority promotion
   - if still equal, prefer coupon promotion
6. Return rejected coupon reason if a better automatic promotion was selected.
```

Do not implement promotion stacking in Ver 0.5.

Example:

```text
Coupon SUMMER10 = 800,000 VND discount
Automatic Dining Campaign = 1,000,000 VND discount

Result:
Automatic Dining Campaign is applied.
Coupon is marked as valid but not selected.
```

---

## 7. Bundle Rule

Ver 0.5 supports simple fixed bundle requirements.

Example:

```text
Buy:
- 1 dining table
- 4 dining chairs

Receive:
- 10% discount on eligible bundle subtotal
```

Bundle rules:

```text
- Bundle remains composed of individual products.
- Cart stores normal product items.
- No bundle SKU is created.
- Product customization remains attached to individual cart items.
- Inventory remains controlled per original product item.
- Bundle discount is calculated by backend.
- Bundle may require exact minimum quantity per product.
- Bundle cannot contain optional branching rules in Ver 0.5.
```

Do not support:

```text
Choose 1 of 3 chairs
Build-your-own bundle
Nested bundles
Bundle-specific inventory
Bundle-specific checkout item type
```

---

## 8. Promotion Eligibility Rules

Promotion eligibility can be restricted by:

```text
- Product
- Room category
- Collection
- Minimum order value
- Payment method
- Active date range
- Total usage limit
- Usage limit per customer
- Usage limit per guest email
- Bundle requirement
```

Promotion eligibility is evaluated only by backend.

Frontend must never:

```text
- calculate final promotion discount
- mark coupon as valid permanently
- trust local discount value
- assume campaign discount without backend quote
```

---

# Part B: Data Model

## 9. New Enums

```text
PromotionStatus:
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED

PromotionTrigger:
  COUPON
  AUTOMATIC

PromotionScopeType:
  CART
  PRODUCT
  CATEGORY
  COLLECTION
  BUNDLE

DiscountType:
  PERCENTAGE
  FIXED_AMOUNT

PromotionRedemptionStatus:
  RESERVED
  REDEEMED
  RELEASED

CampaignStatus:
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED

CampaignPlacement:
  HOME_HERO
  HOME_SECTION
  COLLECTION_SECTION
  PRODUCT_PAGE
  CART
  CHECKOUT

CommerceEventName:
  PRODUCT_VIEWED
  SEARCH_PERFORMED
  SEARCH_RESULT_CLICKED
  PRODUCT_ADDED_TO_CART
  PRODUCT_REMOVED_FROM_CART
  CART_VIEWED
  CHECKOUT_STARTED
  PAYMENT_INITIATED
  PAYMENT_COMPLETED
  PURCHASE_COMPLETED
  PROMOTION_APPLIED
  PROMOTION_REJECTED
  WISHLIST_ADDED
  WISHLIST_REMOVED

CommerceEventSource:
  CLIENT
  SERVER

CartRecoveryStatus:
  ACTIVE
  CHECKOUT_STARTED
  ABANDONED
  PURCHASED
  EXPIRED
```

---

## 10. Table: `promotions`

Purpose:

```text
Store all coupon and automatic promotion definitions.
```

Schema:

```text
id UUID PK

code VARCHAR NULL
code_normalized VARCHAR NULL UNIQUE

trigger PromotionTrigger NOT NULL
scope_type PromotionScopeType NOT NULL
status PromotionStatus NOT NULL DEFAULT DRAFT

discount_type DiscountType NOT NULL
discount_percentage_bps INT NULL
discount_amount_vnd INT NULL
max_discount_vnd INT NULL

min_order_value_vnd INT NULL

usage_limit_total INT NULL
usage_limit_per_customer INT NULL

priority INT NOT NULL DEFAULT 100

starts_at TIMESTAMP NOT NULL
ends_at TIMESTAMP NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Validation:

```text
- code required when trigger = COUPON.
- code must be null when trigger = AUTOMATIC.
- code_normalized must be uppercase.
- percentage discount must be > 0 and <= 10000 bps.
- fixed discount must be > 0.
- max_discount_vnd is valid only for percentage discount.
- ends_at must be greater than starts_at.
- min_order_value_vnd must be >= 0.
- usage limits must be positive if provided.
```

Examples:

```text
Coupon:
trigger = COUPON
scope_type = CART
discount_type = PERCENTAGE
discount_percentage_bps = 1000
max_discount_vnd = 1000000

Automatic:
trigger = AUTOMATIC
scope_type = COLLECTION
discount_type = FIXED_AMOUNT
discount_amount_vnd = 500000
```

---

## 11. Table: `promotion_translations`

Purpose:

```text
Store localized promotion display data.
```

Schema:

```text
id UUID PK
promotion_id UUID FK promotions.id NOT NULL
locale VARCHAR NOT NULL

name VARCHAR NOT NULL
description TEXT NULL
badge_label VARCHAR NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Constraints:

```text
UNIQUE(promotion_id, locale)
```

Vietnamese translation is mandatory for active promotions.

---

## 12. Table: `promotion_product_targets`

Purpose:

```text
Restrict a promotion to specific products.
```

Schema:

```text
promotion_id UUID FK promotions.id NOT NULL
product_id UUID FK products.id NOT NULL
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(promotion_id, product_id)
```

---

## 13. Table: `promotion_category_targets`

Purpose:

```text
Restrict a promotion to selected room categories.
```

Schema:

```text
promotion_id UUID FK promotions.id NOT NULL
room_category_id UUID FK room_categories.id NOT NULL
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(promotion_id, room_category_id)
```

---

## 14. Table: `promotion_collection_targets`

Purpose:

```text
Restrict a promotion to selected collections.
```

Schema:

```text
promotion_id UUID FK promotions.id NOT NULL
collection_id UUID FK collections.id NOT NULL
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(promotion_id, collection_id)
```

---

## 15. Table: `promotion_payment_method_targets`

Purpose:

```text
Restrict promotion availability by payment method.
```

Schema:

```text
promotion_id UUID FK promotions.id NOT NULL
payment_method VARCHAR NOT NULL
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(promotion_id, payment_method)
```

Rule:

```text
If no payment-method target exists, the promotion applies to all supported payment methods.
```

---

## 16. Table: `promotion_bundle_requirements`

Purpose:

```text
Define simple product combinations required for a bundle promotion.
```

Schema:

```text
id UUID PK
promotion_id UUID FK promotions.id NOT NULL
product_id UUID FK products.id NOT NULL
minimum_quantity INT NOT NULL
created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(promotion_id, product_id)
```

Rules:

```text
- Valid only when promotion.scope_type = BUNDLE.
- Bundle eligibility requires every row to be satisfied.
- minimum_quantity must be >= 1.
```

---

## 17. Table: `promotion_redemptions`

Purpose:

```text
Track coupon/promotion usage and enforce limits.
```

Schema:

```text
id UUID PK

promotion_id UUID FK promotions.id NOT NULL
order_id UUID FK orders.id NOT NULL

customer_id UUID FK customers.id NULL
guest_email_hash VARCHAR NULL

status PromotionRedemptionStatus NOT NULL

discount_vnd INT NOT NULL
currency VARCHAR NOT NULL DEFAULT 'VND'

reserved_at TIMESTAMP NOT NULL
redeemed_at TIMESTAMP NULL
released_at TIMESTAMP NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Constraints:

```text
UNIQUE(promotion_id, order_id)
```

Rules:

```text
- At order creation: status = RESERVED.
- When payment/order reaches accepted paid state: status = REDEEMED.
- When order is cancelled: status = RELEASED.
- Released redemption does not count toward usage limit.
- Redeemed and reserved redemptions count toward usage limit.
```

---

## 18. Table: `order_promotions`

Purpose:

```text
Store immutable promotion snapshot for completed orders.
```

Schema:

```text
id UUID PK

order_id UUID FK orders.id NOT NULL
promotion_id UUID FK promotions.id NULL

promotion_code_snapshot VARCHAR NULL
promotion_name_snapshot VARCHAR NOT NULL

trigger_snapshot PromotionTrigger NOT NULL
scope_type_snapshot PromotionScopeType NOT NULL
discount_type_snapshot DiscountType NOT NULL

discount_vnd INT NOT NULL
allocation_snapshot JSONB NOT NULL

created_at TIMESTAMP NOT NULL
```

Example `allocation_snapshot`:

```json
{
  "eligibleSubtotalVnd": 16000000,
  "lineAllocations": [
    {
      "orderItemId": "uuid",
      "discountVnd": 1000000
    }
  ]
}
```

---

## 19. Update `orders`

Add fields:

```text
merchandise_subtotal_vnd INT NOT NULL DEFAULT 0
promotion_discount_vnd INT NOT NULL DEFAULT 0
shipping_discount_vnd INT NOT NULL DEFAULT 0
total_discount_vnd INT NOT NULL DEFAULT 0

campaign_id UUID FK campaigns.id NULL
attribution_snapshot JSONB NULL
cart_recovery_session_id UUID NULL
```

Rules:

```text
total_discount_vnd =
  promotion_discount_vnd
  + shipping_discount_vnd

total_vnd =
  merchandise_subtotal_vnd
  - total_discount_vnd
  + shipping_fee_vnd
```

For Ver 0.5:

```text
shipping_discount_vnd remains 0 because shipping fee calculation is deferred.
```

---

## 20. Update `order_items`

Add fields:

```text
promotion_discount_vnd INT NOT NULL DEFAULT 0
final_line_total_vnd INT NOT NULL DEFAULT 0
```

Rules:

```text
line_total_vnd:
  original configured line amount before discount

promotion_discount_vnd:
  discount allocated to this line

final_line_total_vnd:
  line_total_vnd - promotion_discount_vnd
```

---

## 21. Table: `campaigns`

Purpose:

```text
Store commercial campaign configuration.
```

Schema:

```text
id UUID PK

code VARCHAR UNIQUE NOT NULL
status CampaignStatus NOT NULL DEFAULT DRAFT

hero_image_url TEXT NULL
mobile_hero_image_url TEXT NULL
placement CampaignPlacement NULL
display_priority INT NOT NULL DEFAULT 100

starts_at TIMESTAMP NOT NULL
ends_at TIMESTAMP NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Rules:

```text
- code must be lowercase snake_case.
- ends_at must be greater than starts_at.
- active campaign must have at least one localized translation.
```

---

## 22. Table: `campaign_translations`

Purpose:

```text
Store localized campaign landing-page content.
```

Schema:

```text
id UUID PK
campaign_id UUID FK campaigns.id NOT NULL
locale VARCHAR NOT NULL

name VARCHAR NOT NULL
slug VARCHAR NOT NULL
short_description TEXT NULL
description_markdown TEXT NULL

meta_title VARCHAR(180) NULL
meta_description VARCHAR(320) NULL
og_title VARCHAR(180) NULL
og_description VARCHAR(320) NULL
og_image_url TEXT NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Constraints:

```text
UNIQUE(campaign_id, locale)
UNIQUE(locale, slug)
```

---

## 23. Table: `campaign_promotions`

Purpose:

```text
Link campaign landing pages with promotions.
```

Schema:

```text
campaign_id UUID FK campaigns.id NOT NULL
promotion_id UUID FK promotions.id NOT NULL
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(campaign_id, promotion_id)
```

---

## 24. Table: `campaign_products`

Purpose:

```text
Link campaigns with featured products.
```

Schema:

```text
campaign_id UUID FK campaigns.id NOT NULL
product_id UUID FK products.id NOT NULL
sort_order INT NOT NULL DEFAULT 0
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(campaign_id, product_id)
```

---

## 25. Table: `campaign_collections`

Purpose:

```text
Link campaigns with featured collections.
```

Schema:

```text
campaign_id UUID FK campaigns.id NOT NULL
collection_id UUID FK collections.id NOT NULL
sort_order INT NOT NULL DEFAULT 0
created_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(campaign_id, collection_id)
```

---

## 26. Table: `commerce_events`

Purpose:

```text
Store customer-funnel events.
```

Schema:

```text
id UUID PK

event_name CommerceEventName NOT NULL
event_source CommerceEventSource NOT NULL

customer_id UUID FK customers.id NULL
anonymous_id VARCHAR NULL
session_id VARCHAR NULL

product_id UUID FK products.id NULL
order_id UUID FK orders.id NULL
promotion_id UUID FK promotions.id NULL
campaign_id UUID FK campaigns.id NULL

locale VARCHAR NULL
source_page TEXT NULL
referrer TEXT NULL

payload JSONB NOT NULL DEFAULT '{}'

occurred_at TIMESTAMP NOT NULL
created_at TIMESTAMP NOT NULL
```

Indexes:

```text
INDEX(event_name, occurred_at)
INDEX(customer_id, occurred_at)
INDEX(anonymous_id, occurred_at)
INDEX(session_id, occurred_at)
INDEX(product_id, occurred_at)
INDEX(order_id, occurred_at)
INDEX(campaign_id, occurred_at)
```

Security rules:

```text
- Never store raw payment payload.
- Never store password, token, or reset token.
- Never store full shipping address in event payload.
- Customer identity is stored through customer_id where available.
- Anonymous users are represented by anonymous_id and session_id.
```

---

## 27. Table: `cart_recovery_sessions`

Purpose:

```text
Store recoverable cart state for abandoned-cart reminders.
```

Schema:

```text
id UUID PK

customer_id UUID FK customers.id NULL
anonymous_id VARCHAR NULL
session_id VARCHAR NULL

email VARCHAR NULL
email_hash VARCHAR NULL
marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE

locale VARCHAR NOT NULL DEFAULT 'vi'

cart_snapshot JSONB NOT NULL
cart_value_vnd INT NOT NULL DEFAULT 0

status CartRecoveryStatus NOT NULL DEFAULT ACTIVE

recovery_token_hash VARCHAR NULL
recovery_token_expires_at TIMESTAMP NULL

last_activity_at TIMESTAMP NOT NULL
checkout_started_at TIMESTAMP NULL
purchased_at TIMESTAMP NULL
abandoned_at TIMESTAMP NULL
reminder_sent_at TIMESTAMP NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Indexes:

```text
INDEX(customer_id, status)
INDEX(anonymous_id, status)
INDEX(email_hash, status)
INDEX(status, last_activity_at)
```

Rules:

```text
- Cart snapshot stores IDs, selected option codes, and quantities only.
- Do not treat stored quote/cart amount as source of truth.
- Cart must be rehydrated and re-quoted when customer reopens it.
- Reminder can be sent only when email exists and marketing_opt_in = true.
- Recovery link uses opaque random token.
- Persist only token hash.
```

---

## 28. Table: `idempotency_keys`

Purpose:

```text
Prevent duplicate order/payment creation due to retry, double click, or unstable network.
```

Schema:

```text
id UUID PK

scope VARCHAR NOT NULL
idempotency_key VARCHAR NOT NULL
request_hash VARCHAR NOT NULL

customer_id UUID FK customers.id NULL
anonymous_id VARCHAR NULL

resource_id UUID NULL
response_status_code INT NULL
response_body JSONB NULL

status VARCHAR NOT NULL
expires_at TIMESTAMP NOT NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
```

Constraint:

```text
UNIQUE(scope, idempotency_key)
```

Supported status:

```text
IN_PROGRESS
COMPLETED
FAILED
```

For Ver 0.5:

```text
scope = ORDER_CREATE
```

---

# Part C: Pricing and Promotion Engine

## 29. Promotion Evaluation Pipeline

Existing product-price pipeline:

```text
Base price
+ wood type delta
+ finish delta
+ size delta
= configured product price
```

Ver 0.5 cart-price pipeline:

```text
1. Validate cart items.
2. Recalculate configured item prices.
3. Calculate merchandise subtotal.
4. Evaluate coupon candidate.
5. Evaluate automatic promotion candidates.
6. Calculate candidate discounts.
7. Select best eligible promotion.
8. Allocate discount across eligible order lines.
9. Return cart quote.
10. Re-evaluate within order creation transaction.
11. Create immutable order promotion snapshot.
```

---

## 30. Cart Quote Endpoint

```http
POST /api/v1/cart/quote
```

Request:

```json
{
  "locale": "vi",
  "paymentMethod": "PAYOS",
  "couponCode": "SUMMER10",
  "campaignCode": "summer_dining",
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

Rules:

```text
- campaignCode is optional.
- campaignCode is used only for attribution and active-campaign validation.
- Backend does not trust any client-provided discount.
- Coupon code is normalized before evaluation.
```

Response:

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "unitPriceVnd": 16000000,
      "lineTotalVnd": 16000000,
      "promotionDiscountVnd": 1000000,
      "finalLineTotalVnd": 15000000
    }
  ],
  "merchandiseSubtotalVnd": 16000000,
  "promotionDiscountVnd": 1000000,
  "shippingFeeVnd": 0,
  "shippingDiscountVnd": 0,
  "totalDiscountVnd": 1000000,
  "totalVnd": 15000000,
  "appliedPromotion": {
    "id": "uuid",
    "code": "SUMMER10",
    "name": "Giảm 10% mùa hè",
    "trigger": "COUPON",
    "discountType": "PERCENTAGE",
    "discountVnd": 1000000,
    "selectionReason": "BEST_ELIGIBLE_PROMOTION"
  },
  "coupon": {
    "submittedCode": "SUMMER10",
    "status": "APPLIED",
    "message": "Mã giảm giá đã được áp dụng."
  }
}
```

Coupon result statuses:

```text
APPLIED
VALID_BUT_NOT_SELECTED
INVALID
EXPIRED
NOT_STARTED
USAGE_LIMIT_REACHED
CUSTOMER_USAGE_LIMIT_REACHED
MIN_ORDER_NOT_REACHED
PAYMENT_METHOD_NOT_ELIGIBLE
PRODUCT_NOT_ELIGIBLE
CAMPAIGN_NOT_ELIGIBLE
```

---

## 31. Discount Allocation Rules

### Percentage Discount

```text
line_discount =
  floor(line_eligible_total * discount_percentage)
```

Remaining rounding amount:

```text
Allocate to the highest-priced eligible line.
```

### Fixed Discount

```text
1. Determine eligible line subtotal.
2. Cap discount at eligible line subtotal.
3. Allocate proportionally across eligible lines.
4. Assign remaining rounding difference to highest-priced eligible line.
```

### Bundle Discount

```text
1. Validate all product requirements.
2. Determine matching eligible cart lines.
3. Apply discount only to bundle-matching lines.
4. Do not discount unrelated lines.
```

Rules:

```text
- Discount cannot make final line total negative.
- Discount cannot exceed eligible subtotal.
- Monetary values must remain integer VND.
```

---

## 32. Promotion Evaluation Pseudocode

```text
quoteCart(cart, couponCode, paymentMethod, customerContext):

  validatedItems = validateAndPriceCartItems(cart)

  candidates = []

  if couponCode exists:
    coupon = findCouponByCode(couponCode)
    couponResult = evaluatePromotion(coupon, validatedItems, paymentMethod, customerContext)

    if couponResult.eligible:
      candidates.append(couponResult)

  automaticPromotions = findActiveAutomaticPromotions()

  for promotion in automaticPromotions:
    result = evaluatePromotion(promotion, validatedItems, paymentMethod, customerContext)

    if result.eligible:
      candidates.append(result)

  selectedPromotion =
    candidates
      .sortBy(discountVnd DESC, priority ASC, couponPreferred DESC)
      .firstOrNull()

  return buildCartQuote(validatedItems, selectedPromotion)
```

---

## 33. Checkout Order Creation Update

Update endpoint:

```http
POST /api/v1/orders
```

Required header:

```http
Idempotency-Key: <uuid>
```

Request:

```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0900000000",
  "customerEmail": "customer@example.com",
  "shippingAddress": "Hà Nội",
  "note": "Giao giờ hành chính",
  "paymentMethod": "PAYOS",
  "couponCode": "SUMMER10",
  "campaignCode": "summer_dining",
  "cartRecoverySessionId": "uuid-or-null",
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

Backend flow:

```text
1. Validate Idempotency-Key.
2. Create or lock idempotency record.
3. Recalculate cart and promotion quote.
4. Revalidate coupon usage limit.
5. Revalidate inventory.
6. Create order.
7. Create order items with discount allocation snapshots.
8. Create order_promotions snapshot if applicable.
9. Create promotion_redemptions record with RESERVED status.
10. Reserve inventory.
11. Create payment transaction if required.
12. Attach campaign attribution snapshot.
13. Mark cart recovery session as CHECKOUT_STARTED or PURCHASED depending on payment flow.
14. Persist order response in idempotency record.
15. Return response.
```

If the same idempotency key is reused with identical request:

```text
Return previously saved response.
```

If the same key is reused with a different request:

```text
Return HTTP 409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST.
```

---

## 34. Promotion Redemption Lifecycle

### Order Created

```text
promotion_redemption.status = RESERVED
```

### Payment Successful

```text
promotion_redemption.status = REDEEMED
promotion_redemption.redeemed_at = now()
```

### Order Cancelled

```text
promotion_redemption.status = RELEASED
promotion_redemption.released_at = now()
```

### Duplicate Webhook or Duplicate Status Update

```text
Do not change redemption state twice.
Do not decrement or increment usage counts twice.
```

---

# Part D: Campaign Management

## 35. Campaign Rules

Campaign is a presentation and attribution layer.

Campaign may include:

```text
- Hero banner
- Localized landing content
- Featured products
- Featured collections
- Linked promotions
- Campaign attribution code
- SEO metadata
```

Campaign does not directly calculate discount.

Discount comes only from linked promotion records evaluated by backend.

---

## 36. Public Campaign APIs

### List Active Campaigns

```http
GET /api/v1/campaigns?locale=vi&placement=HOME_HERO
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "code": "summer_dining",
      "name": "Mùa hè phòng ăn",
      "slug": "mua-he-phong-an",
      "heroImageUrl": "https://assets.example.com/...",
      "mobileHeroImageUrl": "https://assets.example.com/...",
      "startsAt": "2026-06-01T00:00:00",
      "endsAt": "2026-06-30T23:59:59"
    }
  ]
}
```

### Campaign Detail

```http
GET /api/v1/campaigns/{slug}?locale=vi
```

Response includes:

```text
Campaign information
Hero content
Featured products
Featured collections
Visible promotion message
SEO metadata
Breadcrumbs
```

Public rules:

```text
Only ACTIVE campaigns within the active date range are visible.
```

---

## 37. Campaign Attribution

When customer lands on a campaign page:

```text
1. Frontend stores campaign code in cookie/local storage.
2. Attribution expiration is 7 days.
3. Frontend sends campaignCode with cart quote and order request.
4. Backend validates that campaign is active.
5. Backend stores campaign_id in order and attribution_snapshot.
```

Attribution snapshot example:

```json
{
  "campaignCode": "summer_dining",
  "utmSource": "facebook",
  "utmMedium": "paid_social",
  "utmCampaign": "summer_2026",
  "landingPath": "/vi/campaigns/mua-he-phong-an"
}
```

Rules:

```text
- Do not trust campaign ID from browser.
- Resolve campaign through server-side code lookup.
- Ignore expired or inactive campaign code.
- Do not block checkout if attribution is invalid.
```

---

# Part E: Commerce Event Foundation

## 38. Client Event API

```http
POST /api/v1/events
```

Request:

```json
{
  "eventName": "PRODUCT_ADDED_TO_CART",
  "anonymousId": "anon_123",
  "sessionId": "session_456",
  "locale": "vi",
  "sourcePage": "/vi/products/ban-an-go-oc-cho",
  "productId": "uuid",
  "campaignCode": "summer_dining",
  "payload": {
    "quantity": 1,
    "selectedOptions": {
      "woodType": "walnut",
      "finish": "matte",
      "size": "large"
    }
  }
}
```

Allowed client-originated events:

```text
PRODUCT_VIEWED
SEARCH_PERFORMED
SEARCH_RESULT_CLICKED
PRODUCT_ADDED_TO_CART
PRODUCT_REMOVED_FROM_CART
CART_VIEWED
CHECKOUT_STARTED
WISHLIST_ADDED
WISHLIST_REMOVED
```

Server-generated events:

```text
PAYMENT_INITIATED
PAYMENT_COMPLETED
PURCHASE_COMPLETED
PROMOTION_APPLIED
PROMOTION_REJECTED
```

---

## 39. Event Validation Rules

```text
- eventName must be allowlisted.
- payload size maximum: 8 KB.
- sourcePage maximum: 500 characters.
- referrer maximum: 500 characters.
- anonymousId maximum: 128 characters.
- sessionId maximum: 128 characters.
- unknown event name returns validation error.
- event ingestion failure must not block customer UI.
- client event endpoint must be rate-limited.
```

Recommended rate limit:

```text
60 events per minute per anonymous_id or IP.
```

---

## 40. Anonymous and Session Identity

Frontend must initialize:

```text
anonymousId:
  persistent browser identifier

sessionId:
  browser-session identifier
```

Storage:

```text
anonymousId:
  localStorage or first-party cookie

sessionId:
  sessionStorage or session cookie
```

Rules:

```text
- Do not use device fingerprinting.
- Do not create hidden tracking methods.
- Do not include raw email inside event payload.
- Logged-in customer events include customer_id server-side.
```

---

# Part F: Cart Recovery and Reminder Automation

## 41. Cart Recovery Tracking

Frontend updates cart-recovery session when:

```text
- Product added to cart
- Product removed from cart
- Quantity changed
- Cart opened
- Checkout started
- Customer email becomes known
```

Endpoint:

```http
POST /api/v1/cart/recovery/session
```

Request:

```json
{
  "anonymousId": "anon_123",
  "sessionId": "session_456",
  "locale": "vi",
  "email": "customer@example.com",
  "marketingOptIn": true,
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
  "cartRecoverySessionId": "uuid"
}
```

Rules:

```text
- Cart recovery session upsert must identify same anonymous/session/customer context.
- Cart items store only IDs, option codes, and quantity.
- Current price is recalculated on recovery.
- Invalid products are ignored during recovery hydration.
```

---

## 42. Abandoned Cart Definition

A cart becomes abandoned when:

```text
- Cart has at least one valid item.
- Customer has not completed purchase.
- Customer has not returned activity within configured delay.
- Customer email exists.
- Customer gave marketing consent.
- Reminder was not sent previously for same cart session.
```

Default delay:

```text
120 minutes
```

---

## 43. Recovery Email Flow

```text
Cart session active
→ no activity for 120 minutes
→ worker marks cart as ABANDONED
→ create opaque recovery token
→ queue email job
→ send abandoned cart email
→ persist email log
```

Recovery email contains:

```text
- Greeting
- Cart item summary
- CTA to resume cart
- Recovery link
- Promotion message only if still valid
- Unsubscribe / preference management link
```

Recovery link format:

```text
/[locale]/cart?recovery=<opaque-token>
```

Rules:

```text
- Never include customer email in URL.
- Recovery token expires after 7 days.
- Recovery token is stored hashed.
- Recovery link does not trust historical price.
- Customer must rehydrate cart and receive a fresh quote.
```

---

## 44. Recovery Endpoint

```http
POST /api/v1/cart/recovery/restore
```

Request:

```json
{
  "token": "opaque-recovery-token",
  "locale": "vi"
}
```

Response:

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

Frontend behavior:

```text
1. Restore valid cart IDs/options into Zustand cart.
2. Call cart hydration or cart quote API.
3. Show any unavailable items clearly.
4. Show current promotion and current total.
```

---

# Part G: Background Jobs

## 45. Background Worker Architecture

Use:

```text
Arq + Redis
```

Architecture:

```text
FastAPI API
→ Redis queue
→ Arq worker
→ Email provider
→ Email logs / retry status
```

Add Docker services:

```text
redis
worker
```

Required environment variables:

```env
REDIS_URL=redis://redis:6379/0
ARQ_QUEUE_NAME=vin_furniture_jobs

ABANDONED_CART_DELAY_MINUTES=120
ABANDONED_CART_TOKEN_TTL_HOURS=168
ABANDONED_CART_SCAN_INTERVAL_MINUTES=15
```

---

## 46. Background Jobs

Required jobs:

```text
evaluate_abandoned_carts
send_abandoned_cart_email
retry_failed_noncritical_email
expire_cart_recovery_sessions
```

Optional future jobs:

```text
send_back_in_stock_notification
send_price_drop_notification
send_wishlist_reminder
generate_daily_campaign_summary
```

---

## 47. Job Idempotency Rules

Every job must use a stable deduplication key.

Examples:

```text
abandoned_cart:{cart_recovery_session_id}
abandoned_cart_email:{cart_recovery_session_id}
promotion_redemption:{order_id}:{promotion_id}
```

Rules:

```text
- Job retries must not send email twice.
- Job retries must not create duplicate event records.
- Job retries must not modify order total.
- Worker failure must not affect checkout completion.
```

---

# Part H: Admin APIs

## 48. Promotion Management APIs

```http
GET    /api/v1/admin/promotions
POST   /api/v1/admin/promotions
GET    /api/v1/admin/promotions/{promotionId}
PATCH  /api/v1/admin/promotions/{promotionId}
DELETE /api/v1/admin/promotions/{promotionId}
```

Create request:

```json
{
  "code": "SUMMER10",
  "trigger": "COUPON",
  "scopeType": "CART",
  "status": "DRAFT",
  "discountType": "PERCENTAGE",
  "discountPercentageBps": 1000,
  "maxDiscountVnd": 1000000,
  "minOrderValueVnd": 5000000,
  "usageLimitTotal": 500,
  "usageLimitPerCustomer": 1,
  "priority": 100,
  "startsAt": "2026-07-01T00:00:00",
  "endsAt": "2026-07-31T23:59:59",
  "translations": {
    "vi": {
      "name": "Giảm giá mùa hè",
      "description": "Giảm 10% cho đơn hàng từ 5.000.000 VND",
      "badgeLabel": "Giảm 10%"
    }
  }
}
```

---

## 49. Promotion Target APIs

```http
POST   /api/v1/admin/promotions/{promotionId}/products
DELETE /api/v1/admin/promotions/{promotionId}/products/{productId}

POST   /api/v1/admin/promotions/{promotionId}/categories
DELETE /api/v1/admin/promotions/{promotionId}/categories/{categoryId}

POST   /api/v1/admin/promotions/{promotionId}/collections
DELETE /api/v1/admin/promotions/{promotionId}/collections/{collectionId}

POST   /api/v1/admin/promotions/{promotionId}/payment-methods
DELETE /api/v1/admin/promotions/{promotionId}/payment-methods/{paymentMethod}

POST   /api/v1/admin/promotions/{promotionId}/bundle-requirements
DELETE /api/v1/admin/promotions/{promotionId}/bundle-requirements/{requirementId}
```

---

## 50. Promotion Publish Validation

Promotion can become ACTIVE only if:

```text
- Vietnamese translation exists.
- startsAt is valid.
- endsAt is valid if provided.
- benefit value is valid.
- code exists for coupon promotion.
- code is absent for automatic promotion.
- at least one bundle requirement exists when scopeType = BUNDLE.
- target products/categories/collections exist for scoped promotions.
```

---

## 51. Campaign Management APIs

```http
GET    /api/v1/admin/campaigns
POST   /api/v1/admin/campaigns
GET    /api/v1/admin/campaigns/{campaignId}
PATCH  /api/v1/admin/campaigns/{campaignId}
DELETE /api/v1/admin/campaigns/{campaignId}
```

Create request:

```json
{
  "code": "summer_dining",
  "status": "DRAFT",
  "heroImageUrl": "https://assets.example.com/campaigns/summer.webp",
  "mobileHeroImageUrl": "https://assets.example.com/campaigns/summer-mobile.webp",
  "placement": "HOME_HERO",
  "displayPriority": 10,
  "startsAt": "2026-07-01T00:00:00",
  "endsAt": "2026-07-31T23:59:59",
  "translations": {
    "vi": {
      "name": "Mùa hè phòng ăn",
      "slug": "mua-he-phong-an",
      "shortDescription": "Ưu đãi nội thất phòng ăn",
      "descriptionMarkdown": "..."
    }
  }
}
```

Relation APIs:

```http
POST   /api/v1/admin/campaigns/{campaignId}/promotions
DELETE /api/v1/admin/campaigns/{campaignId}/promotions/{promotionId}

POST   /api/v1/admin/campaigns/{campaignId}/products
DELETE /api/v1/admin/campaigns/{campaignId}/products/{productId}

POST   /api/v1/admin/campaigns/{campaignId}/collections
DELETE /api/v1/admin/campaigns/{campaignId}/collections/{collectionId}
```

---

## 52. Promotion Metrics API

```http
GET /api/v1/admin/promotions/{promotionId}/metrics?from=2026-07-01&to=2026-07-31
```

Response:

```json
{
  "promotionId": "uuid",
  "usageReserved": 42,
  "usageRedeemed": 30,
  "usageReleased": 12,
  "discountTotalVnd": 18000000,
  "revenueAfterDiscountVnd": 320000000,
  "averageOrderValueVnd": 10666666
}
```

---

## 53. Campaign Metrics API

```http
GET /api/v1/admin/campaigns/{campaignId}/metrics?from=2026-07-01&to=2026-07-31
```

Response:

```json
{
  "campaignId": "uuid",
  "productViews": 1200,
  "addToCartCount": 130,
  "checkoutStartedCount": 48,
  "purchaseCompletedCount": 30,
  "campaignRevenueVnd": 320000000,
  "conversionRate": 0.025
}
```

Definition:

```text
conversionRate =
purchaseCompletedCount / productViews
```

If productViews is zero:

```text
conversionRate = 0
```

---

# Part I: Frontend Implementation

## 54. New Routes

```text
/[locale]/campaigns/[slug]

/[locale]/admin/promotions
/[locale]/admin/promotions/new
/[locale]/admin/promotions/[id]/edit

/[locale]/admin/campaigns
/[locale]/admin/campaigns/new
/[locale]/admin/campaigns/[id]/edit
```

---

## 55. New Frontend Features

Add:

```text
frontend/features/
  promotion/
    promotion.api.ts
    promotion.types.ts
    promotion.mappers.ts

  campaign/
    campaign.api.ts
    campaign.types.ts
    campaign.mappers.ts

  analytics/
    analytics.client.ts
    analytics.types.ts

  cart-recovery/
    cartRecovery.api.ts
    cartRecovery.types.ts
```

---

## 56. New Design-System Components

Create:

```text
frontend/design-system/
  commerce/
    PromotionBadge.tsx
    PromotionSummary.tsx
    CouponInput.tsx
    DiscountBreakdown.tsx
    BundleSuggestionCard.tsx
    CampaignHero.tsx
    CampaignProductSection.tsx

  admin/
    PromotionStatusBadge.tsx
    PromotionForm.tsx
    PromotionTargetSelector.tsx
    BundleRequirementEditor.tsx
    CampaignForm.tsx
    CampaignMetricsCards.tsx

  conversion/
    CheckoutSubmitButton.tsx
    CartRecoveryBanner.tsx
```

---

## 57. Cart Page Update

Add to cart page:

```text
- Coupon input
- Apply coupon button
- Coupon validation message
- Applied promotion badge
- Discount breakdown
- Original subtotal
- Final total
- Bundle suggestions
- Cross-sell product suggestions
- Cart recovery tracking heartbeat
```

Cart UI rules:

```text
- Show promotion calculation result from backend quote only.
- Show original subtotal separately.
- Show discount amount clearly.
- Do not allow customer to manually edit discount.
- Re-quote after quantity/options/coupon/payment method change.
```

---

## 58. Checkout Page Update

Add:

```text
- Promotion summary
- Current discount breakdown
- Marketing-consent checkbox
- Idempotent submit behavior
- Cart recovery session update after valid email input
- Campaign attribution preservation
```

Marketing-consent copy example:

```text
Tôi đồng ý nhận email về giỏ hàng, ưu đãi và sản phẩm liên quan.
```

Rules:

```text
- Consent checkbox must default to unchecked.
- Customer can checkout without marketing consent.
- Transactional order/payment email remains separate from marketing reminder email.
```

---

## 59. Campaign Landing Page

Route:

```text
/[locale]/campaigns/[slug]
```

Page structure:

```text
Breadcrumb
→ Campaign hero
→ Campaign description
→ Visible promotion information
→ Featured collections
→ Featured products
→ Bundle suggestions
→ Related guides
→ Recently viewed products
```

SEO:

```text
- localized metadata
- canonical URL
- Open Graph image
- campaign breadcrumb JSON-LD
```

---

## 60. Cart Recovery UI

When customer opens recovery link:

```text
1. Restore valid cart items.
2. Show message that price and promotion may have changed.
3. Call cart quote API.
4. Show unavailable/changed items.
5. Prompt customer to continue checkout.
```

Message example:

```text
Giỏ hàng của bạn đã được khôi phục. Giá và ưu đãi hiện tại sẽ được cập nhật trước khi thanh toán.
```

---

# Part J: Shared Packages

## 61. Add Domain Schemas

Add to `@vin/domain`:

```text
PromotionSchema
PromotionTranslationSchema
PromotionQuoteSchema
PromotionCandidateSchema
PromotionEligibilitySchema
PromotionRedemptionSchema
OrderPromotionSchema

CampaignSchema
CampaignTranslationSchema
CampaignLandingViewModel
CampaignMetricSchema

CommerceEventSchema
CommerceEventNameSchema
CampaignAttributionSchema

CartRecoverySessionSchema
CartRecoveryRestoreSchema

IdempotencyKeySchema
```

---

## 62. Add View Models

```text
CartQuoteViewModel
PromotionSummaryViewModel
CouponValidationViewModel
CampaignCardViewModel
CampaignLandingViewModel
PromotionAdminListItemViewModel
PromotionMetricViewModel
AbandonedCartRecoveryViewModel
```

---

## 63. API Contract Generation

All newly added FastAPI endpoints must be exposed through OpenAPI.

Regenerate types:

```bash
cd packages/api-contracts
npx openapi-typescript openapi/openapi.json -o src/generated/schema.ts
```

Rules:

```text
- Do not handwrite duplicate API DTO interfaces in frontend.
- Convert generated API contracts through @vin/domain mappers.
- UI components must consume view models, not raw backend DTOs.
```

Expected flow:

```text
FastAPI Pydantic schema
→ OpenAPI specification
→ generated TypeScript type
→ @vin/domain schema and mapper
→ frontend view model
→ design-system component
```

---

# Part K: Environment Variables

## 64. New Backend Environment Variables

```env
REDIS_URL=redis://redis:6379/0
ARQ_QUEUE_NAME=vin_furniture_jobs

PROMOTION_TIMEZONE=Asia/Ho_Chi_Minh

ABANDONED_CART_DELAY_MINUTES=120
ABANDONED_CART_SCAN_INTERVAL_MINUTES=15
ABANDONED_CART_TOKEN_TTL_HOURS=168

PROMOTION_MAX_ACTIVE_PER_ORDER=1
PROMOTION_MAX_COUPON_CODE_LENGTH=40
```

---

## 65. New Docker Services

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"

worker:
  build:
    context: ./backend
  command: python -m app.worker
  depends_on:
    - postgres
    - redis
  env_file:
    - ./backend/.env
```

---

# Part L: Error Handling

## 66. New Error Codes

```text
INVALID_COUPON
PROMOTION_NOT_FOUND
PROMOTION_NOT_ACTIVE
PROMOTION_EXPIRED
PROMOTION_NOT_STARTED
PROMOTION_USAGE_LIMIT_REACHED
PROMOTION_CUSTOMER_USAGE_LIMIT_REACHED
PROMOTION_MIN_ORDER_NOT_REACHED
PROMOTION_PAYMENT_METHOD_NOT_ELIGIBLE
PROMOTION_PRODUCT_NOT_ELIGIBLE
PROMOTION_BUNDLE_REQUIREMENTS_NOT_MET
PROMOTION_NO_LONGER_AVAILABLE
PROMOTION_ALREADY_RESERVED

CAMPAIGN_NOT_FOUND
CAMPAIGN_NOT_ACTIVE
CAMPAIGN_EXPIRED

INVALID_IDEMPOTENCY_KEY
IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST
ORDER_ALREADY_PROCESSING

CART_RECOVERY_NOT_FOUND
CART_RECOVERY_TOKEN_EXPIRED
CART_RECOVERY_NOT_ELIGIBLE
```

---

## 67. Common Promotion Error Response

```json
{
  "error": {
    "code": "PROMOTION_MIN_ORDER_NOT_REACHED",
    "message": "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng ưu đãi.",
    "details": {
      "minimumOrderValueVnd": 5000000,
      "currentEligibleSubtotalVnd": 3200000
    }
  }
}
```

---

# Part M: Security and Integrity Rules

## 68. Pricing Integrity

```text
- Promotion calculation is backend-only.
- Checkout re-evaluates promotion in database transaction.
- Client-provided discount fields are ignored.
- Historical promotion snapshot is immutable after order creation.
- Line-level discount allocation is stored in order item snapshots.
```

---

## 69. Coupon Abuse Protection

```text
- Coupon code normalized server-side.
- Coupon usage limit checked inside transaction.
- Per-customer limit uses customer_id for logged-in customers.
- Guest usage limit uses hashed normalized email.
- Coupon code endpoint is rate-limited.
- Repeated invalid coupon attempts are rate-limited.
```

Suggested rate limits:

```text
Coupon quote attempts:
20 per minute per anonymous_id or IP

Order creation:
5 per minute per anonymous_id/customer

Cart recovery restore:
10 per hour per token/IP
```

---

## 70. Event Privacy Rules

```text
- No password in analytics events.
- No raw refresh token in analytics events.
- No raw payment data in analytics events.
- No full shipping address in analytics events.
- Do not use fingerprinting.
- Do not use analytics events for authorization or payment validation.
```

---

## 71. Marketing Consent Rules

```text
- Marketing consent defaults to false.
- Transactional emails do not depend on marketing consent.
- Abandoned-cart reminder requires explicit marketing consent.
- Customer can update marketing preference later.
- Guest consent is attached only to recovery session.
```

---

# Part N: Testing Specification

## 72. Promotion Engine Tests

```text
- Valid percentage coupon.
- Valid fixed VND coupon.
- Maximum percentage discount cap.
- Minimum order value failure.
- Promotion before start date.
- Promotion after end date.
- Coupon usage limit reached.
- Per-customer usage limit reached.
- Guest-email usage limit reached.
- Product-target promotion.
- Category-target promotion.
- Collection-target promotion.
- Payment-method restriction.
- Automatic promotion selection.
- Coupon versus automatic promotion selection.
- Priority tie-breaking.
- Bundle requirement success.
- Bundle requirement failure.
- Discount cannot exceed line total.
- Discount allocation rounding.
- One promotion per order rule.
```

---

## 73. Checkout and Redemption Tests

```text
- Checkout re-evaluates promotion.
- Client-provided discount is ignored.
- Promotion redemption created as RESERVED.
- Paid order changes redemption to REDEEMED.
- Cancelled order changes redemption to RELEASED.
- Duplicate webhook does not redeem twice.
- Duplicate cancellation does not release twice.
- Coupon usage remains protected under concurrent checkout attempts.
- Order snapshot stores correct promotion details.
- Order item discount allocation is correct.
```

---

## 74. Idempotency Tests

```text
- Same Idempotency-Key and same payload returns cached order response.
- Same Idempotency-Key and changed payload returns HTTP 409.
- Double-click simulation creates one order only.
- Duplicate request creates one payment transaction only.
- Duplicate request reserves inventory once.
```

---

## 75. Campaign Tests

```text
- Draft campaign not visible publicly.
- Active campaign visible during date range.
- Expired campaign hidden publicly.
- Campaign slug unique by locale.
- Campaign attribution attached to order.
- Inactive campaign code ignored without blocking checkout.
- Campaign metrics aggregate events and orders correctly.
```

---

## 76. Commerce Event Tests

```text
- Valid client event accepted.
- Unknown event rejected.
- Payload larger than allowed rejected.
- Product view stores product reference.
- Server-generated payment event is created after payment confirmation.
- Purchase event created once per paid order.
- Duplicate webhook does not create duplicate purchase event.
- Event endpoint rate limit works.
```

---

## 77. Cart Recovery Tests

```text
- Cart session upsert stores IDs/options only.
- No reminder without email.
- No reminder without marketing consent.
- Cart becomes abandoned after configured delay.
- Abandoned-cart email queued once.
- Recovery token is stored hashed.
- Expired recovery token rejected.
- Recovery restores valid cart items.
- Inactive product skipped during restore.
- Purchase marks recovery session as PURCHASED.
- Purchased cart does not receive reminder.
```

---

## 78. Frontend Manual QA

```text
- Coupon applies successfully in cart.
- Coupon validation message is localized.
- Better automatic promotion replaces weaker coupon transparently.
- Cart displays original subtotal, discount, and final total.
- Changing quantity triggers re-quote.
- Changing options triggers re-quote.
- Changing payment method triggers re-quote.
- Checkout button prevents duplicate submit.
- Campaign landing page preserves attribution.
- Campaign promotion applies in cart.
- Bundle suggestion appears when partially eligible.
- Cart recovery email opens correct restore flow.
- Restored cart rehydrates from backend.
- Restored cart displays changed price/promotion warning.
- Admin can create, pause, activate, and archive promotion.
- Admin can create campaign and attach promotion/products/collections.
- Admin metrics render correctly.
- Existing checkout/payment/customer flows do not regress.
```

---

# Part O: Implementation Milestones

## 79. Milestone 1: Promotion Data Foundation

Implement:

```text
Promotion enums
Promotion models
Promotion translations
Promotion targets
Bundle requirements
Promotion redemptions
Order promotion snapshots
Order and order-item discount fields
Alembic migrations
Seed sample promotions
```

Done when:

```text
Backend can persist coupon and automatic promotion data.
```

---

## 80. Milestone 2: Promotion Evaluation Engine

Implement:

```text
Promotion evaluator service
Eligibility validation
Candidate selection
Discount allocation
Cart quote endpoint
Coupon validation response
```

Done when:

```text
Cart quote returns authoritative discount breakdown.
```

---

## 81. Milestone 3: Checkout Integration and Idempotency

Implement:

```text
Idempotency key service
Order creation update
Promotion snapshot creation
Redemption reservation
Order item discount allocation
Promotion lifecycle transition hooks
```

Done when:

```text
Customer can checkout with one valid promotion safely.
```

---

## 82. Milestone 4: Campaign Module

Implement:

```text
Campaign model
Campaign translations
Campaign-to-promotion relation
Campaign products and collections
Public campaign API
Admin campaign CRUD
Campaign landing page
Campaign attribution storage
```

Done when:

```text
Admin can create a campaign page connected to a valid promotion.
```

---

## 83. Milestone 5: Event Foundation

Implement:

```text
Commerce event model
Client event ingestion endpoint
Anonymous ID and session ID client utility
Server event dispatch service
Campaign attribution capture
Basic metrics queries
```

Done when:

```text
Product, cart, checkout, payment, purchase, and promotion events are recorded.
```

---

## 84. Milestone 6: Cart Recovery and Worker

Implement:

```text
Redis service
Arq worker
Cart recovery sessions
Recovery token generation
Abandonment scan
Queued email delivery
Restore-cart endpoint
Cart recovery frontend flow
```

Done when:

```text
Eligible abandoned carts receive one recoverable email reminder.
```

---

## 85. Milestone 7: Admin UI and Metrics

Implement:

```text
Promotion list
Promotion create/edit form
Target selectors
Bundle requirement editor
Campaign list
Campaign create/edit form
Campaign product/collection selection
Promotion metrics cards
Campaign metrics cards
```

Done when:

```text
Admin can operate promotions and campaigns without direct database edits.
```

---

## 86. Milestone 8: Contract, Test, and Regression Quality

Implement:

```text
OpenAPI endpoints
Generated API contracts
Zod schemas
Domain mappers
Backend unit tests
Backend integration tests
Domain-package tests
Manual checkout and campaign QA
```

Done when:

```text
All pricing, promotion, campaign, event, and recovery paths pass regression testing.
```

---

# Part P: Acceptance Criteria

Ver 0.5 is complete when:

```text
1. Admin can create coupon and automatic promotions.
2. Promotion eligibility supports date, product, category, collection, order value, payment method, and usage limit rules.
3. Backend selects exactly one best eligible promotion per order.
4. Cart and checkout show backend-calculated promotion breakdown.
5. Checkout re-evaluates promotion before creating order.
6. Order and order-item discount snapshots are immutable.
7. Promotion redemption is reserved, redeemed, and released safely.
8. Duplicate checkout requests do not create duplicate orders or payment links.
9. Admin can create campaign landing pages with products, collections, and linked promotions.
10. Campaign attribution is stored with eligible orders.
11. Core commerce events are captured without blocking customer experience.
12. Paid order creates one purchase-completed event.
13. Eligible abandoned carts receive one reminder email through background worker.
14. Recovery link restores cart configuration but re-quotes current price.
15. Promotion and campaign metrics are available in admin.
16. Existing payment, inventory, customer, wishlist, review, content, and SEO flows remain functional.
```

---

# Part Q: Definition of Done

Ver 0.5 is done when this full flow works:

```text
1. Admin creates coupon SUMMER10.
2. Admin configures 10% discount, maximum 1,000,000 VND.
3. Admin restricts coupon to dining-table collection.
4. Admin creates “Summer Dining” campaign.
5. Admin links campaign to collection, products, and coupon.
6. Customer opens campaign landing page.
7. Customer adds customized dining table to cart.
8. Customer enters SUMMER10.
9. Backend validates eligibility and calculates discount.
10. Cart displays original subtotal, discount, and final total.
11. Customer starts checkout.
12. Checkout request includes Idempotency-Key.
13. Backend creates one order, one payment transaction, one promotion redemption.
14. payOS webhook confirms payment.
15. Backend marks redemption as REDEEMED.
16. Backend creates PAYMENT_COMPLETED and PURCHASE_COMPLETED events.
17. Admin sees promotion redemption and campaign revenue metrics.
18. A separate customer abandons eligible cart after checkout starts.
19. Worker sends one reminder email.
20. Customer uses recovery link.
21. Cart restores product configuration and receives fresh price/promotion quote.
```

Ver 0.5 should make discounting controlled, measurable, and reversible. It must not become a permissive “coupon text box plus hope” system, because that is how a store accidentally sells a walnut dining table for the price of a nervous sandwich.