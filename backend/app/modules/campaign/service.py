import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.campaign.models import Campaign, CampaignTranslation, CampaignProduct, CampaignCollection
from app.modules.campaign.schemas import (
    CampaignListItem, CampaignListResponse, CampaignDetailResponse,
    FeaturedProductItem, FeaturedCollectionItem,
    AdminCreateCampaignRequest, AdminPatchCampaignRequest,
)
from app.core.exceptions import AppException
from app.shared.enums import CampaignStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _trans(campaign: Campaign, locale: str) -> Optional[CampaignTranslation]:
    for t in campaign.translations:
        if t.locale == locale:
            return t
    return campaign.translations[0] if campaign.translations else None


def _is_active(campaign: Campaign) -> bool:
    if campaign.status != CampaignStatus.ACTIVE:
        return False
    now = _now()
    starts = campaign.starts_at
    if starts.tzinfo is None:
        starts = starts.replace(tzinfo=timezone.utc)
    if now < starts:
        return False
    if campaign.ends_at:
        ends = campaign.ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=timezone.utc)
        if now > ends:
            return False
    return True


async def get_active_campaigns(
    db: AsyncSession,
    locale: str = "vi",
    placement: Optional[str] = None,
) -> CampaignListResponse:
    query = select(Campaign).where(Campaign.status == CampaignStatus.ACTIVE)
    if placement:
        query = query.where(Campaign.placement == placement)
    query = query.order_by(Campaign.display_priority.asc())
    campaigns = (await db.execute(query)).scalars().all()

    items = []
    for c in campaigns:
        if not _is_active(c):
            continue
        t = _trans(c, locale)
        if not t:
            continue
        items.append(CampaignListItem(
            id=c.id, code=c.code, name=t.name, slug=t.slug,
            heroImageUrl=c.hero_image_url, mobileHeroImageUrl=c.mobile_hero_image_url,
            startsAt=c.starts_at, endsAt=c.ends_at,
        ))
    return CampaignListResponse(items=items)


async def get_campaign_by_slug(db: AsyncSession, slug: str, locale: str = "vi") -> CampaignDetailResponse:
    result = await db.execute(
        select(CampaignTranslation).where(
            CampaignTranslation.slug == slug,
            CampaignTranslation.locale == locale,
        )
    )
    trans = result.scalar_one_or_none()
    if not trans:
        raise AppException(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")
    campaign = (await db.execute(select(Campaign).where(Campaign.id == trans.campaign_id))).scalar_one_or_none()
    if not campaign or not _is_active(campaign):
        raise AppException(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")

    from app.modules.product.models import Product, ProductTranslation
    from app.modules.collection.models import Collection, CollectionTranslation
    products = []
    for cp in sorted(campaign.campaign_products, key=lambda x: x.sort_order):
        product = (await db.execute(select(Product).where(Product.id == cp.product_id))).scalar_one_or_none()
        if not product:
            continue
        pt = (await db.execute(select(ProductTranslation).where(
            ProductTranslation.product_id == product.id, ProductTranslation.locale == locale
        ))).scalar_one_or_none()
        if pt:
            products.append(FeaturedProductItem(
                id=product.id, name=pt.name, slug=pt.slug, basePriceVnd=product.base_price_vnd,
                heroImageUrl=pt.primary_image_url if hasattr(pt, "primary_image_url") else None,
            ))

    collections = []
    for cc in sorted(campaign.campaign_collections, key=lambda x: x.sort_order):
        col = (await db.execute(select(Collection).where(Collection.id == cc.collection_id))).scalar_one_or_none()
        if not col:
            continue
        ct = (await db.execute(select(CollectionTranslation).where(
            CollectionTranslation.collection_id == col.id, CollectionTranslation.locale == locale
        ))).scalar_one_or_none()
        if ct:
            collections.append(FeaturedCollectionItem(
                id=col.id, name=ct.name, slug=ct.slug,
                imageUrl=col.cover_image_url if hasattr(col, "cover_image_url") else None,
            ))

    return CampaignDetailResponse(
        id=campaign.id, code=campaign.code,
        name=trans.name, slug=trans.slug,
        shortDescription=trans.short_description,
        descriptionMarkdown=trans.description_markdown,
        heroImageUrl=campaign.hero_image_url,
        mobileHeroImageUrl=campaign.mobile_hero_image_url,
        startsAt=campaign.starts_at, endsAt=campaign.ends_at,
        products=products, collections=collections,
        metaTitle=trans.meta_title, metaDescription=trans.meta_description,
        ogTitle=trans.og_title, ogDescription=trans.og_description,
        ogImageUrl=trans.og_image_url,
    )


async def validate_campaign_code(db: AsyncSession, code: str) -> Optional[Campaign]:
    campaign = (await db.execute(
        select(Campaign).where(Campaign.code == code)
    )).scalar_one_or_none()
    if campaign and _is_active(campaign):
        return campaign
    return None


async def admin_list_campaigns(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    from sqlalchemy import func
    total = (await db.execute(select(func.count(Campaign.id)))).scalar_one()
    campaigns = (await db.execute(
        select(Campaign).order_by(Campaign.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [
            {"id": c.id, "code": c.code, "status": c.status, "placement": c.placement,
             "startsAt": c.starts_at, "endsAt": c.ends_at, "createdAt": c.created_at}
            for c in campaigns
        ],
        "page": page, "pageSize": page_size, "total": total,
    }


async def admin_create_campaign(db: AsyncSession, req: AdminCreateCampaignRequest) -> dict:
    campaign = Campaign(
        id=str(uuid.uuid4()), code=req.code, status=req.status,
        hero_image_url=req.heroImageUrl, mobile_hero_image_url=req.mobileHeroImageUrl,
        placement=req.placement, display_priority=req.displayPriority,
        starts_at=req.startsAt, ends_at=req.endsAt,
    )
    db.add(campaign)
    for t in req.translations:
        db.add(CampaignTranslation(
            campaign_id=campaign.id,
            locale=t.get("locale", "vi"),
            name=t.get("name", ""),
            slug=t.get("slug", ""),
            short_description=t.get("shortDescription"),
            description_markdown=t.get("descriptionMarkdown"),
            meta_title=t.get("metaTitle"),
            meta_description=t.get("metaDescription"),
            og_title=t.get("ogTitle"),
            og_description=t.get("ogDescription"),
            og_image_url=t.get("ogImageUrl"),
        ))
    await db.commit()
    return {"id": campaign.id, "code": campaign.code, "status": campaign.status}


async def admin_get_campaign(db: AsyncSession, campaign_id: str) -> dict:
    campaign = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not campaign:
        raise AppException(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")
    return {
        "id": campaign.id, "code": campaign.code, "status": campaign.status,
        "heroImageUrl": campaign.hero_image_url, "mobileHeroImageUrl": campaign.mobile_hero_image_url,
        "placement": campaign.placement, "displayPriority": campaign.display_priority,
        "startsAt": campaign.starts_at, "endsAt": campaign.ends_at, "createdAt": campaign.created_at,
        "translations": [
            {"locale": t.locale, "name": t.name, "slug": t.slug,
             "shortDescription": t.short_description, "descriptionMarkdown": t.description_markdown}
            for t in campaign.translations
        ],
    }


async def admin_patch_campaign(db: AsyncSession, campaign_id: str, req: AdminPatchCampaignRequest) -> dict:
    campaign = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not campaign:
        raise AppException(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")
    # exclude_unset (not exclude_none) so an explicit null can clear a nullable
    # field such as ends_at; only fields present in the request body are applied.
    for field, value in req.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        if hasattr(campaign, snake):
            setattr(campaign, snake, value)
    await db.commit()
    return {"id": campaign.id, "code": campaign.code, "status": campaign.status}


async def admin_delete_campaign(db: AsyncSession, campaign_id: str) -> None:
    campaign = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not campaign:
        raise AppException(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")
    await db.delete(campaign)
    await db.commit()


async def admin_add_campaign_promotion(db: AsyncSession, campaign_id: str, promotion_id: str) -> dict:
    from app.modules.campaign.models import CampaignPromotion
    db.add(CampaignPromotion(campaign_id=campaign_id, promotion_id=promotion_id))
    await db.commit()
    return {"campaignId": campaign_id, "promotionId": promotion_id}


async def admin_remove_campaign_promotion(db: AsyncSession, campaign_id: str, promotion_id: str) -> None:
    from app.modules.campaign.models import CampaignPromotion
    t = (await db.execute(select(CampaignPromotion).where(
        CampaignPromotion.campaign_id == campaign_id,
        CampaignPromotion.promotion_id == promotion_id,
    ))).scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()


async def admin_add_campaign_product(db: AsyncSession, campaign_id: str, product_id: str, sort_order: int = 0) -> dict:
    db.add(CampaignProduct(campaign_id=campaign_id, product_id=product_id, sort_order=sort_order))
    await db.commit()
    return {"campaignId": campaign_id, "productId": product_id}


async def admin_remove_campaign_product(db: AsyncSession, campaign_id: str, product_id: str) -> None:
    t = (await db.execute(select(CampaignProduct).where(
        CampaignProduct.campaign_id == campaign_id,
        CampaignProduct.product_id == product_id,
    ))).scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()


async def admin_add_campaign_collection(db: AsyncSession, campaign_id: str, collection_id: str, sort_order: int = 0) -> dict:
    db.add(CampaignCollection(campaign_id=campaign_id, collection_id=collection_id, sort_order=sort_order))
    await db.commit()
    return {"campaignId": campaign_id, "collectionId": collection_id}


async def admin_remove_campaign_collection(db: AsyncSession, campaign_id: str, collection_id: str) -> None:
    t = (await db.execute(select(CampaignCollection).where(
        CampaignCollection.campaign_id == campaign_id,
        CampaignCollection.collection_id == collection_id,
    ))).scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()


async def get_campaign_metrics(
    db: AsyncSession,
    campaign_id: str,
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
) -> dict:
    from sqlalchemy import func
    from app.modules.events.models import CommerceEvent
    from app.modules.order.models import Order
    from app.shared.enums import CommerceEventName

    def _event_count(event_name: str) -> "select":
        q = select(func.count()).where(
            CommerceEvent.campaign_id == campaign_id,
            CommerceEvent.event_name == event_name,
        )
        if from_dt:
            q = q.where(CommerceEvent.occurred_at >= from_dt)
        if to_dt:
            q = q.where(CommerceEvent.occurred_at <= to_dt)
        return q

    product_views = (await db.execute(_event_count(CommerceEventName.PRODUCT_VIEWED))).scalar_one()
    add_to_cart = (await db.execute(_event_count(CommerceEventName.PRODUCT_ADDED_TO_CART))).scalar_one()
    checkout_started = (await db.execute(_event_count(CommerceEventName.CHECKOUT_STARTED))).scalar_one()
    purchase_completed = (await db.execute(_event_count(CommerceEventName.PURCHASE_COMPLETED))).scalar_one()

    revenue_q = select(func.coalesce(func.sum(Order.total_vnd), 0)).where(Order.campaign_id == campaign_id)
    if from_dt:
        revenue_q = revenue_q.where(Order.created_at >= from_dt)
    if to_dt:
        revenue_q = revenue_q.where(Order.created_at <= to_dt)
    revenue = (await db.execute(revenue_q)).scalar_one()

    conversion_rate = round(purchase_completed / product_views, 6) if product_views else 0.0

    return {
        "campaignId": campaign_id,
        "productViews": product_views,
        "addToCartCount": add_to_cart,
        "checkoutStartedCount": checkout_started,
        "purchaseCompletedCount": purchase_completed,
        "campaignRevenueVnd": revenue,
        "conversionRate": conversion_rate,
    }
