"""Seed a demonstrable scoped campaign — run after `python -m app.seed`:
    python -m app.seed_campaign

Creates a CATEGORY-scoped AUTOMATIC promotion (bedroom, 10% off) and a campaign
targeting the same category, then links them through the validated path. Lets you
reproduce the full flow: carousel -> /products?campaign=slug -> auto-applied discount.
Idempotent via fixed ids.
"""
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.product.models import RoomCategory
from app.modules.promotion.models import Promotion, PromotionTranslation, PromotionCategoryTarget
from app.modules.campaign.models import Campaign, CampaignTranslation
from app.modules.campaign import service as campaign_service
# Imported so SQLAlchemy resolves relationships
from app.modules.inventory import models as _inv  # noqa: F401

PROMO_ID = "promo-seed-bedroom10-v06"
CAMPAIGN_ID = "campaign-seed-bedroom-v06"
SLUG = "uu-dai-phong-ngu"


def _utc(y, m, d):
    return datetime(y, m, d, tzinfo=timezone.utc)


async def seed_campaign():
    async with AsyncSessionLocal() as db:
        if await db.get(Campaign, CAMPAIGN_ID):
            print(f"Skip: campaign {CAMPAIGN_ID} already exists")
            return

        bedroom = (await db.execute(
            select(RoomCategory).where(RoomCategory.code == "bedroom")
        )).scalar_one_or_none()
        if not bedroom:
            print("Skip: bedroom category not found (run app.seed first)")
            return

        print("Seeding bedroom AUTOMATIC promotion (10%, CATEGORY scope)...")
        db.add(Promotion(
            id=PROMO_ID, trigger="AUTOMATIC", scope_type="CATEGORY", status="ACTIVE",
            discount_type="PERCENTAGE", discount_percentage_bps=1000,
            priority=90, starts_at=_utc(2026, 6, 1), ends_at=_utc(2026, 12, 31),
        ))
        db.add(PromotionTranslation(
            promotion_id=PROMO_ID, locale="vi",
            name="Ưu đãi phòng ngủ", description="Giảm 10% toàn bộ sản phẩm phòng ngủ",
            badge_label="Giảm 10%",
        ))
        db.add(PromotionCategoryTarget(promotion_id=PROMO_ID, room_category_id=bedroom.id))

        print("Seeding campaign (target = bedroom category)...")
        db.add(Campaign(
            id=CAMPAIGN_ID, code="BEDROOM10", status="ACTIVE", placement="HOME_HERO",
            target_type="CATEGORY", target_id=bedroom.id,
            hero_image_url=bedroom.image_url, mobile_hero_image_url=bedroom.image_url,
            display_priority=10, starts_at=_utc(2026, 6, 1), ends_at=_utc(2026, 12, 31),
        ))
        db.add(CampaignTranslation(
            campaign_id=CAMPAIGN_ID, locale="vi", name="Ưu đãi phòng ngủ", slug=SLUG,
            short_description="Giảm 10% cho toàn bộ nội thất phòng ngủ",
        ))
        db.add(CampaignTranslation(
            campaign_id=CAMPAIGN_ID, locale="zh-CN", name="卧室优惠", slug="wo-shi-you-hui",
            short_description="卧室家具全场 9 折",
        ))
        await db.commit()

        # Link through the validated path (proves AUTOMATIC + scope match).
        await campaign_service.admin_add_campaign_promotion(db, CAMPAIGN_ID, PROMO_ID)
        print(f"Linked promotion. Campaign slug: /{SLUG}")
        print("Campaign seed complete.")


if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(seed_campaign())
