"""Seed product images — downloads furniture photos and uploads them to R2.

Run AFTER `python -m app.seed` (products must already exist):
    python -m app.seed_images

Idempotent: products that already have images are skipped. Uses the real
media service (upload_product_image) so the full R2 + ProductImage flow is
exercised. First image per product becomes the primary.
"""
import asyncio
import httpx
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.modules.product.models import Product, RoomCategory
from app.modules.media.models import ProductImage
from app.modules.media.service import upload_product_image, upload_image_file
# Imported so SQLAlchemy can resolve Product's relationships (mapper config)
from app.modules.inventory import models as _inventory_models  # noqa: F401


def _unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w=1200&q=80"


# SKU -> [primary, gallery...] (verified Unsplash furniture photos)
PRODUCT_IMAGES: dict[str, list[str]] = {
    "TABLE_DIN_001": [
        _unsplash("1617806118233-18e1de247200"),
        _unsplash("1577140917170-285929fb55b7"),
        _unsplash("1611967164521-abae8fba4668"),
    ],
    "CHAIR_DIN_001": [
        _unsplash("1503602642458-232111445657"),
        _unsplash("1540574163026-643ea20ade25"),
        _unsplash("1549497538-303791108f95"),
    ],
    "BED_001": [
        _unsplash("1505693416388-ac5ce068fe85"),
        _unsplash("1505691938895-1758d7feb511"),
        _unsplash("1616486338812-3dadae4b4ace"),
    ],
    "NIGHT_001": [
        _unsplash("1532372320572-cda25653a26d"),
        _unsplash("1551298370-9d3d53740c72"),
        _unsplash("1581539250439-c96689b516dd"),
    ],
    "SHELF_001": [
        _unsplash("1594620302200-9a762244a156"),
        _unsplash("1524758631624-e2822e304c36"),
        _unsplash("1538099130811-745e64318258"),
    ],
    "DESK_001": [
        _unsplash("1518455027359-f3f8164ba6bd"),
        _unsplash("1497366216548-37526070297c"),
        _unsplash("1555041469-a586c61ea9bc"),
    ],
    "COFFEE_001": [
        _unsplash("1567016432779-094069958ea5"),
        _unsplash("1493663284031-b7e3aefcae8e"),
        _unsplash("1556228453-efd6c1ff04f6"),
    ],
    "WARDROBE_001": [
        _unsplash("1558997519-83ea9252edf8"),
        _unsplash("1538688525198-9b88f6f53126"),
        _unsplash("1604578762246-41134e37f9cc"),
    ],
}


# Room category code -> interior scene photo (verified Unsplash)
ROOM_IMAGES: dict[str, str] = {
    "living_room": _unsplash("1567016526105-22da7c13161a"),
    "bedroom": _unsplash("1616594039964-ae9021a400a0"),
    "dining_room": _unsplash("1615873968403-89e068629265"),
    "office": _unsplash("1497366811353-6870744d04b2"),
    "outdoor": _unsplash("1600210492493-0946911123ea"),
}


async def _download(client: httpx.AsyncClient, url: str) -> tuple[bytes, str] | None:
    try:
        resp = await client.get(url, follow_redirects=True, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ! download failed {url[:60]}: {e}")
        return None
    content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    if not content_type.startswith("image/"):
        content_type = "image/jpeg"
    return resp.content, content_type


async def seed_images():
    async with AsyncSessionLocal() as db, httpx.AsyncClient() as client:
        products = (await db.execute(select(Product))).scalars().all()
        sku_to_id = {p.sku: p.id for p in products}

        for sku, urls in PRODUCT_IMAGES.items():
            product_id = sku_to_id.get(sku)
            if not product_id:
                print(f"Skip {sku}: product not found (run app.seed first)")
                continue

            existing = (await db.execute(
                select(func.count()).select_from(ProductImage)
                .where(ProductImage.product_id == product_id)
            )).scalar_one()
            if existing > 0:
                print(f"Skip {sku}: already has {existing} image(s)")
                continue

            print(f"Seeding images for {sku}...")
            for idx, url in enumerate(urls):
                downloaded = await _download(client, url)
                if not downloaded:
                    continue
                data, content_type = downloaded
                await upload_product_image(
                    db=db, product_id=product_id,
                    file_data=data, content_type=content_type,
                    alt_text=f"{sku} image {idx + 1}",
                    is_primary=(idx == 0),
                )
                print(f"  + uploaded image {idx + 1} ({len(data) // 1024}KB)")

        print("Product image seed complete.")


async def seed_room_images():
    async with AsyncSessionLocal() as db, httpx.AsyncClient() as client:
        rooms = (await db.execute(select(RoomCategory))).scalars().all()
        code_to_room = {r.code: r for r in rooms}

        for code, url in ROOM_IMAGES.items():
            room = code_to_room.get(code)
            if not room:
                print(f"Skip room {code}: not found (run app.seed first)")
                continue
            if room.image_url:
                print(f"Skip room {code}: already has image")
                continue
            downloaded = await _download(client, url)
            if not downloaded:
                continue
            data, content_type = downloaded
            result = await upload_image_file(data, content_type, prefix="rooms")
            room.image_url = result["url"]
            print(f"  + room {code} image ({len(data) // 1024}KB)")
        await db.commit()
        print("Room image seed complete.")


async def seed_all():
    await seed_images()
    await seed_room_images()


if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(seed_all())
