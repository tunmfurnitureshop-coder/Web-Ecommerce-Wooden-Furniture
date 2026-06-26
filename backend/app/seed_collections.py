"""Collection seed — run with: python -m app.seed_collections

Seeds sample published collections linked to existing products (by SKU).
Safe to re-run (skips existing collection IDs). Requires products from
`python -m app.seed` to already exist in the database.
"""
import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.collection.models import Collection, CollectionTranslation, CollectionProduct
from app.modules.product.models import Product
# Import so SQLAlchemy can resolve Product's relationships (InventoryItem, etc.)
from app.modules.inventory import models as _inventory_models  # noqa: F401
from app.shared.enums import CollectionStatus


def uid() -> str:
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


COLLECTION_LIVING_ID = "collection-seed-living-modern"
COLLECTION_BEDROOM_ID = "collection-seed-bedroom-cozy"

COLLECTIONS = [
    {
        "id": COLLECTION_LIVING_ID,
        "code": "phong_khach_hien_dai",
        "status": CollectionStatus.PUBLISHED,
        "is_featured": True,
        "sort_order": 1,
        "cover_image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
        "products": ["SHELF_001", "COFFEE_001"],
        "vi": {
            "name": "Phòng khách hiện đại",
            "slug": "phong-khach-hien-dai",
            "short_description": "Tuyển chọn nội thất phòng khách phong cách hiện đại",
            "description_markdown": "Bộ sưu tập nội thất gỗ tự nhiên cho không gian phòng khách hiện đại, tối giản và ấm cúng.",
        },
        "zh_cn": {
            "name": "现代客厅",
            "slug": "xian-dai-ke-ting",
            "short_description": "现代风格客厅家具精选",
        },
    },
    {
        "id": COLLECTION_BEDROOM_ID,
        "code": "phong_ngu_am_cung",
        "status": CollectionStatus.PUBLISHED,
        "is_featured": False,
        "sort_order": 2,
        "cover_image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
        "products": ["BED_001", "NIGHT_001", "WARDROBE_001"],
        "vi": {
            "name": "Phòng ngủ ấm cúng",
            "slug": "phong-ngu-am-cung",
            "short_description": "Trọn bộ nội thất phòng ngủ gỗ tự nhiên",
            "description_markdown": "Giường, tủ đầu giường và tủ quần áo gỗ tự nhiên cho không gian nghỉ ngơi thư thái.",
        },
    },
]


async def seed_collections(db) -> None:
    """Seed collections into the given session. Caller commits."""
    for c in COLLECTIONS:
        with db.no_autoflush:
            exists = (await db.execute(
                select(Collection).where(Collection.id == c["id"])
            )).scalar_one_or_none()
        if exists:
            print(f"  skip collection: {c['code']}")
            continue

        db.add(Collection(
            id=c["id"], code=c["code"],
            status=c["status"].value,
            cover_image_url=c.get("cover_image_url"),
            sort_order=c["sort_order"], is_featured=c["is_featured"],
            published_at=now() if c["status"] == CollectionStatus.PUBLISHED else None,
            created_at=now(), updated_at=now(),
        ))
        db.add(CollectionTranslation(
            id=uid(), collection_id=c["id"], locale="vi",
            name=c["vi"]["name"], slug=c["vi"]["slug"],
            short_description=c["vi"].get("short_description"),
            description_markdown=c["vi"].get("description_markdown"),
            created_at=now(), updated_at=now(),
        ))
        if "zh_cn" in c:
            zh = c["zh_cn"]
            db.add(CollectionTranslation(
                id=uid(), collection_id=c["id"], locale="zh-CN",
                name=zh["name"], slug=zh["slug"],
                short_description=zh.get("short_description"),
                description_markdown=zh.get("description_markdown"),
                created_at=now(), updated_at=now(),
            ))

        for idx, sku in enumerate(c["products"]):
            product = (await db.execute(
                select(Product).where(Product.sku == sku)
            )).scalar_one_or_none()
            if not product:
                print(f"  WARN: product {sku} not found, skipping link for {c['code']}")
                continue
            db.add(CollectionProduct(
                collection_id=c["id"], product_id=product.id,
                sort_order=idx, created_at=now(),
            ))
        print(f"  added collection: {c['code']} ({len(c['products'])} products)")


async def main():
    async with AsyncSessionLocal() as db:
        print("Seeding collections...")
        await seed_collections(db)
        await db.commit()
        print("Collection seed complete.")


if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        # psycopg async can't run on Windows' default ProactorEventLoop
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        # avoid cp1252 UnicodeEncodeError when printing Vietnamese output
        sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
