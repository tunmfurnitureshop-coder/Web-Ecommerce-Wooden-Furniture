from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, PlainTextResponse
from app.core.config import settings
from app.core.exceptions import AppException
from app.modules.auth.router import router as auth_router
from app.modules.product.router import router as product_router, admin_router as admin_product_router
from app.modules.pricing.router import router as pricing_router
from app.modules.cart.router import router as cart_router
from app.modules.order.router import router as order_router, admin_router as admin_order_router
from app.modules.inventory.router import router as admin_inventory_router
from app.modules.admin.router import router as admin_dashboard_router
from app.modules.payment.router import router as admin_payment_router
from app.modules.webhook.router import router as webhook_router
from app.modules.media.router import router as admin_media_router
from app.modules.customer_auth.router import router as customer_auth_router
from app.modules.customer.router import router as customer_router
from app.modules.wishlist.router import router as wishlist_router
from app.modules.review.router import router as review_router, admin_router as admin_review_router
from app.modules.taxonomy.router import router as taxonomy_router, admin_router as admin_taxonomy_router
from app.modules.collection.router import router as collection_router, admin_router as admin_collection_router
from app.modules.content.router import router as content_router, admin_router as admin_content_router
from app.modules.discovery.router import router as discovery_router, admin_router as admin_discovery_router
from app.modules.promotion.router import router as promotion_router
from app.modules.campaign.router import router as campaign_router, admin_router as admin_campaign_router
from app.modules.events.router import router as events_router
from app.modules.cart_recovery.router import router as cart_recovery_router
# Ensure all models are imported so SQLAlchemy can resolve string-based relationships
import app.modules.customer.models  # noqa: F401
import app.modules.wishlist.models  # noqa: F401
import app.modules.review.models  # noqa: F401
import app.modules.taxonomy.models  # noqa: F401
import app.modules.collection.models  # noqa: F401
import app.modules.content.models  # noqa: F401
import app.modules.discovery.models  # noqa: F401
import app.modules.promotion.models  # noqa: F401
import app.modules.promotion.idempotency  # noqa: F401
import app.modules.campaign.models  # noqa: F401
import app.modules.events.models  # noqa: F401
import app.modules.cart_recovery.models  # noqa: F401

app = FastAPI(title=settings.APP_NAME, version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    base = settings.SITE_BASE_URL.rstrip("/")
    lines = [
        "User-agent: *",
        "Disallow: /vi/admin/",
        "Disallow: /zh-CN/admin/",
        "Disallow: /vi/account/",
        "Disallow: /zh-CN/account/",
        "Disallow: /vi/cart",
        "Disallow: /zh-CN/cart",
        "Disallow: /vi/checkout/",
        "Disallow: /zh-CN/checkout/",
        "Disallow: /vi/success",
        "Disallow: /zh-CN/success",
        f"Sitemap: {base}/sitemap.xml",
    ]
    return "\n".join(lines)


@app.get("/sitemap.xml")
async def sitemap_xml(request: Request):
    from datetime import datetime, timezone
    from sqlalchemy import select, and_
    from app.core.database import get_db as _get_db
    from app.modules.product.models import Product, ProductTranslation
    from app.modules.product.models import RoomCategory, RoomCategoryTranslation
    from app.modules.collection.models import Collection, CollectionTranslation
    from app.modules.taxonomy.models import Tag, TagTranslation
    from app.modules.content.models import ContentPost, ContentPostTranslation
    from app.shared.enums import ProductStatus, CollectionStatus, ContentStatus

    base = settings.SITE_BASE_URL.rstrip("/")
    locales = ["vi", "zh-CN"]
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    async for db in _get_db():
        urls: list[str] = []

        def _url(loc: str, lastmod: str, priority: str, changefreq: str = "weekly", alts: list = []) -> str:
            alt_tags = "".join(
                f'<xhtml:link rel="alternate" hreflang="{lang}" href="{href}"/>'
                for lang, href in alts
            )
            return (
                f"<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod>"
                f"<changefreq>{changefreq}</changefreq><priority>{priority}</priority>"
                f"{alt_tags}</url>"
            )

        # Active products
        products = (await db.execute(
            select(Product).where(Product.status == ProductStatus.ACTIVE)
        )).scalars().all()
        for p in products:
            alts = []
            for locale in locales:
                t = (await db.execute(
                    select(ProductTranslation).where(
                        ProductTranslation.product_id == p.id,
                        ProductTranslation.locale == locale,
                    )
                )).scalar_one_or_none()
                if t:
                    alts.append((locale, f"{base}/{locale}/products/{t.slug}"))
            if alts:
                lastmod = p.updated_at.strftime("%Y-%m-%d") if p.updated_at else today
                urls.append(_url(alts[0][1], lastmod, "0.8", alts=alts))

        # Categories
        cats = (await db.execute(select(RoomCategory).where(RoomCategory.is_active == True))).scalars().all()  # noqa: E712
        for cat in cats:
            alts = []
            for locale in locales:
                t = (await db.execute(
                    select(RoomCategoryTranslation).where(
                        RoomCategoryTranslation.category_id == cat.id,
                        RoomCategoryTranslation.locale == locale,
                    )
                )).scalar_one_or_none()
                if t:
                    alts.append((locale, f"{base}/{locale}/room/{t.slug}"))
            if alts:
                urls.append(_url(alts[0][1], today, "0.7", alts=alts))

        # Collections
        cols = (await db.execute(
            select(Collection).where(Collection.status == CollectionStatus.PUBLISHED)
        )).scalars().all()
        for col in cols:
            alts = []
            for locale in locales:
                t = (await db.execute(
                    select(CollectionTranslation).where(
                        CollectionTranslation.collection_id == col.id,
                        CollectionTranslation.locale == locale,
                    )
                )).scalar_one_or_none()
                if t:
                    alts.append((locale, f"{base}/{locale}/collections/{t.slug}"))
            if alts:
                lm = col.updated_at.strftime("%Y-%m-%d") if col.updated_at else today
                urls.append(_url(alts[0][1], lm, "0.7", alts=alts))

        # Material tags
        material_tags = (await db.execute(
            select(Tag).where(Tag.type == "MATERIAL", Tag.is_active == True)  # noqa: E712
        )).scalars().all()
        for tag in material_tags:
            alts = []
            for locale in locales:
                t = (await db.execute(
                    select(TagTranslation).where(
                        TagTranslation.tag_id == tag.id,
                        TagTranslation.locale == locale,
                    )
                )).scalar_one_or_none()
                if t:
                    alts.append((locale, f"{base}/{locale}/material/{t.slug}"))
            if alts:
                urls.append(_url(alts[0][1], today, "0.6", alts=alts))

        # Content/guides
        posts = (await db.execute(
            select(ContentPost).where(
                ContentPost.status == ContentStatus.PUBLISHED,
                ContentPost.published_at <= now,
            )
        )).scalars().all()
        for post in posts:
            alts = []
            for locale in locales:
                t = (await db.execute(
                    select(ContentPostTranslation).where(
                        ContentPostTranslation.content_post_id == post.id,
                        ContentPostTranslation.locale == locale,
                    )
                )).scalar_one_or_none()
                if t:
                    alts.append((locale, f"{base}/{locale}/guides/{t.slug}"))
            if alts:
                lm = post.updated_at.strftime("%Y-%m-%d") if post.updated_at else today
                urls.append(_url(alts[0][1], lm, "0.6", alts=alts))

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
            ' xmlns:xhtml="http://www.w3.org/1999/xhtml">'
            + "".join(urls)
            + "</urlset>"
        )
        return Response(content=xml, media_type="application/xml")


API_PREFIX = "/api/v1"

app.include_router(product_router, prefix=API_PREFIX)
app.include_router(pricing_router, prefix=API_PREFIX)
app.include_router(cart_router, prefix=API_PREFIX)
app.include_router(order_router, prefix=API_PREFIX)
app.include_router(webhook_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(admin_product_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_order_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_inventory_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_dashboard_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_payment_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_media_router, prefix=f"{API_PREFIX}/admin")
app.include_router(customer_auth_router, prefix=API_PREFIX)
app.include_router(customer_router, prefix=API_PREFIX)
app.include_router(wishlist_router, prefix=f"{API_PREFIX}/customer")
app.include_router(review_router, prefix=API_PREFIX)
app.include_router(admin_review_router, prefix=f"{API_PREFIX}/admin")
app.include_router(taxonomy_router, prefix=API_PREFIX)
app.include_router(admin_taxonomy_router, prefix=f"{API_PREFIX}/admin")
app.include_router(collection_router, prefix=API_PREFIX)
app.include_router(admin_collection_router, prefix=f"{API_PREFIX}/admin")
app.include_router(content_router, prefix=API_PREFIX)
app.include_router(admin_content_router, prefix=f"{API_PREFIX}/admin")
app.include_router(discovery_router, prefix=API_PREFIX)
app.include_router(admin_discovery_router, prefix=f"{API_PREFIX}/admin")
app.include_router(promotion_router, prefix=API_PREFIX)
app.include_router(campaign_router, prefix=API_PREFIX)
app.include_router(admin_campaign_router, prefix=f"{API_PREFIX}/admin")
app.include_router(events_router, prefix=API_PREFIX)
app.include_router(cart_recovery_router, prefix=API_PREFIX)
