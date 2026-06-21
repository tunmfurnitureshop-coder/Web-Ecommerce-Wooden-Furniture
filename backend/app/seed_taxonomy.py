"""Taxonomy seed — run with: python -m app.seed_taxonomy

Seeds initial tags with Vietnamese translations.
Safe to re-run (skips existing codes).
"""
import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.taxonomy.models import Tag, TagTranslation


def uid() -> str:
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


SEED_TAGS = [
    {
        "code": "scandinavian",
        "type": "STYLE",
        "sort_order": 1,
        "vi": {"name": "Bắc Âu", "slug": "bac-au", "description": "Phong cách Bắc Âu tối giản"},
        "zh_cn": {"name": "北欧风格", "slug": "bei-ou-feng-ge", "description": "简约北欧风"},
    },
    {
        "code": "minimalist",
        "type": "STYLE",
        "sort_order": 2,
        "vi": {"name": "Tối giản", "slug": "toi-gian", "description": "Thiết kế tối giản hiện đại"},
        "zh_cn": {"name": "极简主义", "slug": "ji-jian-zhu-yi", "description": "现代极简设计"},
    },
    {
        "code": "industrial",
        "type": "STYLE",
        "sort_order": 3,
        "vi": {"name": "Công nghiệp", "slug": "cong-nghiep", "description": "Phong cách công nghiệp hiện đại"},
    },
    {
        "code": "rustic",
        "type": "STYLE",
        "sort_order": 4,
        "vi": {"name": "Mộc mạc", "slug": "moc-mac", "description": "Phong cách mộc mạc gần gũi thiên nhiên"},
    },
    {
        "code": "walnut",
        "type": "MATERIAL",
        "sort_order": 1,
        "vi": {"name": "Gỗ óc chó", "slug": "go-oc-cho", "description": "Gỗ óc chó tự nhiên cao cấp"},
        "zh_cn": {"name": "胡桃木", "slug": "hu-tao-mu", "description": "天然胡桃木"},
    },
    {
        "code": "oak",
        "type": "MATERIAL",
        "sort_order": 2,
        "vi": {"name": "Gỗ sồi", "slug": "go-soi", "description": "Gỗ sồi nhập khẩu bền chắc"},
        "zh_cn": {"name": "橡木", "slug": "xiang-mu", "description": "进口橡木"},
    },
    {
        "code": "rubberwood",
        "type": "MATERIAL",
        "sort_order": 3,
        "vi": {"name": "Gỗ cao su", "slug": "go-cao-su", "description": "Gỗ cao su thân thiện môi trường"},
    },
    {
        "code": "ash_wood",
        "type": "MATERIAL",
        "sort_order": 4,
        "vi": {"name": "Gỗ tần bì", "slug": "go-tan-bi", "description": "Gỗ tần bì vân đẹp"},
    },
    {
        "code": "living_room",
        "type": "ROOM",
        "sort_order": 1,
        "vi": {"name": "Phòng khách", "slug": "phong-khach-tag"},
    },
    {
        "code": "dining_room",
        "type": "ROOM",
        "sort_order": 2,
        "vi": {"name": "Phòng ăn", "slug": "phong-an-tag"},
    },
    {
        "code": "bedroom",
        "type": "ROOM",
        "sort_order": 3,
        "vi": {"name": "Phòng ngủ", "slug": "phong-ngu-tag"},
    },
    {
        "code": "home_office",
        "type": "ROOM",
        "sort_order": 4,
        "vi": {"name": "Phòng làm việc", "slug": "phong-lam-viec-tag"},
    },
    {
        "code": "two_seats",
        "type": "CAPACITY",
        "sort_order": 1,
        "vi": {"name": "2 người", "slug": "2-nguoi"},
    },
    {
        "code": "four_seats",
        "type": "CAPACITY",
        "sort_order": 2,
        "vi": {"name": "4 người", "slug": "4-nguoi"},
    },
    {
        "code": "six_seats",
        "type": "CAPACITY",
        "sort_order": 3,
        "vi": {"name": "6 người", "slug": "6-nguoi"},
    },
    {
        "code": "premium",
        "type": "PRICE_TIER",
        "sort_order": 1,
        "vi": {"name": "Cao cấp", "slug": "cao-cap", "description": "Sản phẩm cao cấp, chất lượng vượt trội"},
    },
    {
        "code": "mid_range",
        "type": "PRICE_TIER",
        "sort_order": 2,
        "vi": {"name": "Tầm trung", "slug": "tam-trung", "description": "Sản phẩm chất lượng tốt, giá hợp lý"},
    },
    {
        "code": "made_to_order",
        "type": "AVAILABILITY",
        "sort_order": 1,
        "vi": {"name": "Đặt theo yêu cầu", "slug": "dat-theo-yeu-cau", "description": "Sản xuất theo đơn đặt hàng"},
    },
    {
        "code": "in_stock",
        "type": "AVAILABILITY",
        "sort_order": 2,
        "vi": {"name": "Có sẵn", "slug": "co-san", "description": "Sản phẩm có sẵn trong kho"},
    },
    {
        "code": "storage",
        "type": "FEATURE",
        "sort_order": 1,
        "vi": {"name": "Có ngăn chứa đồ", "slug": "co-ngan-chua-do"},
    },
    {
        "code": "extendable",
        "type": "FEATURE",
        "sort_order": 2,
        "vi": {"name": "Có thể mở rộng", "slug": "co-the-mo-rong"},
    },
]

SEED_SYNONYMS = [
    {"locale": "vi", "canonical_term": "bàn ăn", "synonym_term": "bàn cơm"},
    {"locale": "vi", "canonical_term": "tủ áo", "synonym_term": "tủ quần áo"},
    {"locale": "vi", "canonical_term": "ghế sofa", "synonym_term": "sofa"},
    {"locale": "vi", "canonical_term": "gỗ óc chó", "synonym_term": "óc chó"},
    {"locale": "vi", "canonical_term": "gỗ óc chó", "synonym_term": "walnut"},
    {"locale": "vi", "canonical_term": "gỗ sồi", "synonym_term": "oak"},
    {"locale": "vi", "canonical_term": "bàn làm việc", "synonym_term": "bàn học"},
]


async def seed_taxonomy():
    from app.modules.discovery.models import SearchSynonym

    async with AsyncSessionLocal() as db:
        print("Seeding tags...")
        for tag_data in SEED_TAGS:
            result = await db.execute(select(Tag).where(Tag.code == tag_data["code"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  skip tag: {tag_data['code']}")
                continue

            tag_id = uid()
            db.add(Tag(
                id=tag_id,
                code=tag_data["code"],
                type=tag_data["type"],
                is_active=True,
                sort_order=tag_data.get("sort_order", 0),
                created_at=now(),
                updated_at=now(),
            ))

            vi = tag_data["vi"]
            db.add(TagTranslation(
                id=uid(), tag_id=tag_id, locale="vi",
                name=vi["name"], slug=vi["slug"],
                description=vi.get("description"),
                created_at=now(), updated_at=now(),
            ))

            if "zh_cn" in tag_data:
                zh = tag_data["zh_cn"]
                db.add(TagTranslation(
                    id=uid(), tag_id=tag_id, locale="zh-CN",
                    name=zh["name"], slug=zh["slug"],
                    description=zh.get("description"),
                    created_at=now(), updated_at=now(),
                ))
            print(f"  added tag: {tag_data['code']}")

        print("Seeding search synonyms...")
        for syn_data in SEED_SYNONYMS:
            result = await db.execute(
                select(SearchSynonym).where(
                    SearchSynonym.locale == syn_data["locale"],
                    SearchSynonym.synonym_term == syn_data["synonym_term"],
                )
            )
            if result.scalar_one_or_none():
                print(f"  skip synonym: {syn_data['synonym_term']}")
                continue

            db.add(SearchSynonym(
                id=uid(),
                locale=syn_data["locale"],
                canonical_term=syn_data["canonical_term"],
                synonym_term=syn_data["synonym_term"],
                created_at=now(),
                updated_at=now(),
            ))
            print(f"  added synonym: {syn_data['synonym_term']} → {syn_data['canonical_term']}")

        await db.commit()
        print("Taxonomy seed complete.")


if __name__ == "__main__":
    asyncio.run(seed_taxonomy())
