"""Seed script — run with: python -m app.seed"""
import asyncio
import uuid
from datetime import datetime, timezone
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.models import AdminUser
from app.modules.product.models import RoomCategory, RoomCategoryTranslation, Product, ProductTranslation
from app.modules.inventory.models import (
    WoodType, WoodTypeTranslation, FinishOption, FinishOptionTranslation,
    SizeOption, SizeOptionTranslation, InventoryItem,
    ProductWoodType, ProductFinishOption, ProductSizeOption,
)
from sqlalchemy import select
from app.modules.promotion.models import Promotion, PromotionTranslation
from app.shared.enums import (
    PromotionStatus, PromotionTrigger, PromotionScopeType, DiscountType,
)

PROMO_SUMMER10_ID = "promo-seed-summer10-v05"
PROMO_AUTO_500K_ID = "promo-seed-auto-500k-v05"


def uid() -> str:
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


ROOM_CATEGORIES = [
    {"code": "living_room", "sort_order": 1, "vi": {"name": "Phòng khách", "slug": "phong-khach"}},
    {"code": "bedroom", "sort_order": 2, "vi": {"name": "Phòng ngủ", "slug": "phong-ngu"}},
    {"code": "dining_room", "sort_order": 3, "vi": {"name": "Phòng ăn", "slug": "phong-an"}},
    {"code": "office", "sort_order": 4, "vi": {"name": "Văn phòng", "slug": "van-phong"}},
    {"code": "outdoor", "sort_order": 5, "vi": {"name": "Ngoài trời", "slug": "ngoai-troi"}},
]

WOOD_TYPES = [
    {"code": "oak", "price_delta_vnd": 0, "vi": {"name": "Gỗ sồi", "description": "Gỗ sồi tự nhiên bền chắc"}},
    {"code": "walnut", "price_delta_vnd": 2500000, "vi": {"name": "Gỗ óc chó", "description": "Gỗ óc chó cao cấp"}},
    {"code": "ash", "price_delta_vnd": 500000, "vi": {"name": "Gỗ tần bì", "description": "Gỗ tần bì nhập khẩu"}},
    {"code": "rubberwood", "price_delta_vnd": -500000, "vi": {"name": "Gỗ cao su", "description": "Gỗ cao su thân thiện môi trường"}},
]

FINISH_OPTIONS = [
    {"code": "natural", "price_delta_vnd": 0, "vi": {"name": "Tự nhiên", "description": "Bề mặt tự nhiên, không sơn"}},
    {"code": "matte", "price_delta_vnd": 300000, "vi": {"name": "Sơn mờ", "description": "Sơn mờ bảo vệ bề mặt"}},
    {"code": "dark_brown", "price_delta_vnd": 200000, "vi": {"name": "Nâu đậm", "description": "Màu nâu đậm sang trọng"}},
    {"code": "walnut_tone", "price_delta_vnd": 400000, "vi": {"name": "Tông óc chó", "description": "Màu óc chó ấm áp"}},
]

SIZE_OPTIONS = [
    {"code": "small", "width_cm": 80, "depth_cm": 40, "height_cm": 75, "price_delta_vnd": -1000000, "vi": {"name": "Nhỏ", "description": "Kích thước nhỏ gọn"}},
    {"code": "medium", "width_cm": 120, "depth_cm": 60, "height_cm": 75, "price_delta_vnd": 0, "vi": {"name": "Vừa", "description": "Kích thước tiêu chuẩn"}},
    {"code": "large", "width_cm": 180, "depth_cm": 90, "height_cm": 75, "price_delta_vnd": 1200000, "vi": {"name": "Lớn", "description": "Kích thước lớn"}},
]

PRODUCTS = [
    {
        "sku": "TABLE_DIN_001",
        "room": "dining_room",
        "base_price_vnd": 12000000,
        "vi": {
            "name": "Bàn ăn gỗ óc chó",
            "slug": "ban-an-go-oc-cho",
            "short_description": "Bàn ăn gỗ tự nhiên cao cấp",
            "description": "Bàn ăn làm từ gỗ óc chó nguyên khối, thiết kế hiện đại phù hợp không gian ăn uống gia đình.",
            "specifications": {"material": "Gỗ óc chó", "origin": "Việt Nam", "warranty": "24 tháng"},
        },
        "zh_cn": {
            "name": "胡桃木餐桌",
            "slug": "hu-tao-mu-can-zhuo",
            "short_description": "天然实木餐桌",
            "description": "胡桃木实木餐桌，现代设计",
            "specifications": {"material": "胡桃木", "warranty": "24个月"},
        },
        "wood_types": ["oak", "walnut", "ash"],
        "finishes": ["natural", "matte", "walnut_tone"],
        "sizes": ["medium", "large"],
        "inventory": 15,
    },
    {
        "sku": "CHAIR_DIN_001",
        "room": "dining_room",
        "base_price_vnd": 3200000,
        "vi": {
            "name": "Ghế ăn gỗ sồi",
            "slug": "ghe-an-go-soi",
            "short_description": "Ghế ăn gỗ sồi tự nhiên",
            "description": "Ghế ăn thiết kế tối giản từ gỗ sồi, khung chắc chắn, đệm êm ái.",
            "specifications": {"material": "Gỗ sồi", "weight_capacity": "120kg", "warranty": "12 tháng"},
        },
        "wood_types": ["oak", "rubberwood"],
        "finishes": ["natural", "matte", "dark_brown"],
        "sizes": ["small", "medium"],
        "inventory": 30,
    },
    {
        "sku": "BED_001",
        "room": "bedroom",
        "base_price_vnd": 18000000,
        "vi": {
            "name": "Giường ngủ gỗ cao su",
            "slug": "giuong-ngu-go-cao-su",
            "short_description": "Giường ngủ gỗ cao su thân thiện môi trường",
            "description": "Giường gỗ cao su bền đẹp, thiết kế hiện đại với đầu giường chạm khắc tinh tế.",
            "specifications": {"material": "Gỗ cao su", "size": "Queen 1m6", "warranty": "24 tháng"},
        },
        "wood_types": ["rubberwood", "oak"],
        "finishes": ["natural", "dark_brown", "walnut_tone"],
        "sizes": ["medium", "large"],
        "inventory": 10,
    },
    {
        "sku": "NIGHT_001",
        "room": "bedroom",
        "base_price_vnd": 3500000,
        "vi": {
            "name": "Tủ đầu giường gỗ sồi",
            "slug": "tu-dau-giuong-go-soi",
            "short_description": "Tủ đầu giường nhỏ gọn",
            "description": "Tủ đầu giường gỗ sồi với 2 ngăn kéo, phù hợp mọi không gian phòng ngủ.",
            "specifications": {"material": "Gỗ sồi", "drawers": "2", "warranty": "12 tháng"},
        },
        "zh_cn": {
            "name": "橡木床头柜",
            "slug": "xiang-mu-chuang-tou-gui",
            "short_description": "小巧床头柜",
            "description": "橡木床头柜，两个抽屉",
            "specifications": {"material": "橡木", "drawers": "2"},
        },
        "wood_types": ["oak", "rubberwood"],
        "finishes": ["natural", "matte"],
        "sizes": ["small", "medium"],
        "inventory": 20,
    },
    {
        "sku": "SHELF_001",
        "room": "living_room",
        "base_price_vnd": 5500000,
        "vi": {
            "name": "Kệ sách gỗ tự nhiên",
            "slug": "ke-sach-go-tu-nhien",
            "short_description": "Kệ sách nhiều tầng gỗ sồi",
            "description": "Kệ sách 5 tầng từ gỗ sồi tự nhiên, thiết kế mở thoáng đãng.",
            "specifications": {"material": "Gỗ sồi", "levels": "5", "warranty": "12 tháng"},
        },
        "wood_types": ["oak", "ash", "rubberwood"],
        "finishes": ["natural", "matte", "dark_brown"],
        "sizes": ["medium", "large"],
        "inventory": 12,
    },
    {
        "sku": "DESK_001",
        "room": "office",
        "base_price_vnd": 8500000,
        "vi": {
            "name": "Bàn làm việc gỗ sồi",
            "slug": "ban-lam-viec-go-soi",
            "short_description": "Bàn làm việc rộng rãi, nhiều ngăn",
            "description": "Bàn làm việc từ gỗ sồi nguyên tấm, có 3 ngăn kéo bên phải, thiết kế tối giản.",
            "specifications": {"material": "Gỗ sồi", "drawers": "3", "warranty": "18 tháng"},
        },
        "zh_cn": {
            "name": "橡木工作桌",
            "slug": "xiang-mu-gong-zuo-zhuo",
            "short_description": "宽敞办公桌",
            "description": "橡木实木办公桌，三个抽屉",
            "specifications": {"material": "橡木"},
        },
        "wood_types": ["oak", "walnut", "ash"],
        "finishes": ["natural", "matte", "walnut_tone"],
        "sizes": ["medium", "large"],
        "inventory": 8,
    },
    {
        "sku": "COFFEE_001",
        "room": "living_room",
        "base_price_vnd": 6800000,
        "vi": {
            "name": "Bàn trà phòng khách",
            "slug": "ban-tra-phong-khach",
            "short_description": "Bàn trà gỗ sồi chân sắt",
            "description": "Bàn trà phòng khách kết hợp mặt gỗ sồi và chân sắt đen, phong cách công nghiệp hiện đại.",
            "specifications": {"material": "Gỗ sồi + sắt", "warranty": "12 tháng"},
        },
        "wood_types": ["oak", "walnut"],
        "finishes": ["natural", "dark_brown", "walnut_tone"],
        "sizes": ["small", "medium"],
        "inventory": 18,
    },
    {
        "sku": "WARDROBE_001",
        "room": "bedroom",
        "base_price_vnd": 22000000,
        "vi": {
            "name": "Tủ quần áo gỗ sồi",
            "slug": "tu-quan-ao-go-soi",
            "short_description": "Tủ quần áo 3 cánh gỗ sồi",
            "description": "Tủ quần áo 3 cánh từ gỗ sồi tự nhiên, bên trong thiết kế thông minh với nhiều ngăn.",
            "specifications": {"material": "Gỗ sồi", "doors": "3", "warranty": "24 tháng"},
        },
        "wood_types": ["oak", "rubberwood"],
        "finishes": ["natural", "matte", "dark_brown"],
        "sizes": ["medium", "large"],
        "inventory": 6,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        print("Seeding admin user...")
        existing_admin = await db.get(AdminUser, "admin-seed-id")
        if not existing_admin:
            db.add(AdminUser(
                id="admin-seed-id",
                email="admin@example.com",
                password_hash=hash_password("admin123"),
                role="ADMIN",
                is_active=True,
                created_at=now(),
                updated_at=now(),
            ))

        print("Seeding room categories...")
        room_ids: dict[str, str] = {}
        for rc in ROOM_CATEGORIES:
            rc_id = uid()
            room_ids[rc["code"]] = rc_id
            db.add(RoomCategory(id=rc_id, code=rc["code"], sort_order=rc["sort_order"], created_at=now(), updated_at=now()))
            db.add(RoomCategoryTranslation(
                id=uid(), category_id=rc_id, locale="vi",
                name=rc["vi"]["name"], slug=rc["vi"]["slug"],
                created_at=now(), updated_at=now(),
            ))

        print("Seeding wood types...")
        wood_ids: dict[str, str] = {}
        for wt in WOOD_TYPES:
            wt_id = uid()
            wood_ids[wt["code"]] = wt_id
            db.add(WoodType(id=wt_id, code=wt["code"], price_delta_vnd=wt["price_delta_vnd"], created_at=now(), updated_at=now()))
            db.add(WoodTypeTranslation(
                id=uid(), wood_type_id=wt_id, locale="vi",
                name=wt["vi"]["name"], description=wt["vi"]["description"],
                created_at=now(), updated_at=now(),
            ))

        print("Seeding finish options...")
        finish_ids: dict[str, str] = {}
        for fo in FINISH_OPTIONS:
            fo_id = uid()
            finish_ids[fo["code"]] = fo_id
            db.add(FinishOption(id=fo_id, code=fo["code"], price_delta_vnd=fo["price_delta_vnd"], created_at=now(), updated_at=now()))
            db.add(FinishOptionTranslation(
                id=uid(), finish_option_id=fo_id, locale="vi",
                name=fo["vi"]["name"], description=fo["vi"]["description"],
                created_at=now(), updated_at=now(),
            ))

        print("Seeding size options...")
        size_ids: dict[str, str] = {}
        for so in SIZE_OPTIONS:
            so_id = uid()
            size_ids[so["code"]] = so_id
            db.add(SizeOption(
                id=so_id, code=so["code"],
                width_cm=so["width_cm"], depth_cm=so["depth_cm"], height_cm=so["height_cm"],
                price_delta_vnd=so["price_delta_vnd"],
                created_at=now(), updated_at=now(),
            ))
            db.add(SizeOptionTranslation(
                id=uid(), size_option_id=so_id, locale="vi",
                name=so["vi"]["name"], description=so["vi"]["description"],
                created_at=now(), updated_at=now(),
            ))

        print("Seeding products...")
        for p in PRODUCTS:
            p_id = uid()
            db.add(Product(
                id=p_id, sku=p["sku"],
                room_category_id=room_ids[p["room"]],
                base_price_vnd=p["base_price_vnd"],
                status="ACTIVE",
                created_at=now(), updated_at=now(),
            ))
            vi = p["vi"]
            db.add(ProductTranslation(
                id=uid(), product_id=p_id, locale="vi",
                name=vi["name"], slug=vi["slug"],
                short_description=vi.get("short_description"),
                description=vi.get("description"),
                specifications=vi.get("specifications"),
                created_at=now(), updated_at=now(),
            ))
            if "zh_cn" in p:
                zh = p["zh_cn"]
                db.add(ProductTranslation(
                    id=uid(), product_id=p_id, locale="zh-CN",
                    name=zh["name"], slug=zh["slug"],
                    short_description=zh.get("short_description"),
                    description=zh.get("description"),
                    specifications=zh.get("specifications"),
                    created_at=now(), updated_at=now(),
                ))
            for wt_code in p["wood_types"]:
                db.add(ProductWoodType(id=uid(), product_id=p_id, wood_type_id=wood_ids[wt_code]))
            for fo_code in p["finishes"]:
                db.add(ProductFinishOption(id=uid(), product_id=p_id, finish_option_id=finish_ids[fo_code]))
            for so_code in p["sizes"]:
                db.add(ProductSizeOption(id=uid(), product_id=p_id, size_option_id=size_ids[so_code]))
            db.add(InventoryItem(
                id=uid(), product_id=p_id,
                total_qty=p["inventory"], reserved_qty=0,
                created_at=now(), updated_at=now(),
            ))

        print("Seeding promotions...")
        starts = datetime(2026, 6, 1, tzinfo=timezone.utc)
        ends = datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        with db.no_autoflush:
            result = await db.execute(select(Promotion).where(Promotion.id == PROMO_SUMMER10_ID))
            existing_promo = result.scalar_one_or_none()

        if not existing_promo:
            db.add(Promotion(
                id=PROMO_SUMMER10_ID,
                code="SUMMER10",
                code_normalized="SUMMER10",
                trigger=PromotionTrigger.COUPON,
                scope_type=PromotionScopeType.CART,
                status=PromotionStatus.ACTIVE,
                discount_type=DiscountType.PERCENTAGE,
                discount_percentage_bps=1000,
                max_discount_vnd=1000000,
                min_order_value_vnd=5000000,
                usage_limit_total=500,
                usage_limit_per_customer=1,
                priority=100,
                starts_at=starts,
                ends_at=ends,
                created_at=now(),
                updated_at=now(),
            ))
            db.add(PromotionTranslation(
                id=uid(),
                promotion_id=PROMO_SUMMER10_ID,
                locale="vi",
                name="Giảm giá mùa hè",
                description="Giảm 10% cho đơn hàng từ 5.000.000 VND",
                badge_label="Giảm 10%",
                created_at=now(),
                updated_at=now(),
            ))

            db.add(Promotion(
                id=PROMO_AUTO_500K_ID,
                code=None,
                code_normalized=None,
                trigger=PromotionTrigger.AUTOMATIC,
                scope_type=PromotionScopeType.CART,
                status=PromotionStatus.ACTIVE,
                discount_type=DiscountType.FIXED_AMOUNT,
                discount_amount_vnd=500000,
                min_order_value_vnd=10000000,
                priority=50,
                starts_at=starts,
                ends_at=ends,
                created_at=now(),
                updated_at=now(),
            ))
            db.add(PromotionTranslation(
                id=uid(),
                promotion_id=PROMO_AUTO_500K_ID,
                locale="vi",
                name="Giảm 500.000 VND đơn hàng lớn",
                description="Tự động giảm 500.000 VND cho đơn hàng từ 10.000.000 VND",
                badge_label="Giảm 500K",
                created_at=now(),
                updated_at=now(),
            ))

        await db.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
