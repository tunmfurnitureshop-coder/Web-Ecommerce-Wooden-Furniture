import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
import uuid

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db_session():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def seeded_db(db_session: AsyncSession):
    from app.modules.auth.models import AdminUser
    from app.modules.product.models import RoomCategory, RoomCategoryTranslation, Product, ProductTranslation
    from app.modules.inventory.models import (
        WoodType, WoodTypeTranslation, FinishOption, FinishOptionTranslation,
        SizeOption, SizeOptionTranslation, InventoryItem,
        ProductWoodType, ProductFinishOption, ProductSizeOption,
    )
    from datetime import datetime, timezone

    def uid(): return str(uuid.uuid4())
    def now(): return datetime.now(timezone.utc)

    admin = AdminUser(id=uid(), email="admin@example.com", password_hash=hash_password("admin123"), role="ADMIN", is_active=True, created_at=now(), updated_at=now())
    db_session.add(admin)

    cat = RoomCategory(id="cat1", code="dining_room", sort_order=1, created_at=now(), updated_at=now())
    db_session.add(cat)
    db_session.add(RoomCategoryTranslation(id=uid(), category_id="cat1", locale="vi", name="Phòng ăn", slug="phong-an", created_at=now(), updated_at=now()))

    wt = WoodType(id="wt1", code="oak", price_delta_vnd=0, is_active=True, created_at=now(), updated_at=now())
    db_session.add(wt)
    db_session.add(WoodTypeTranslation(id=uid(), wood_type_id="wt1", locale="vi", name="Gỗ sồi", created_at=now(), updated_at=now()))

    fo = FinishOption(id="fo1", code="natural", price_delta_vnd=0, is_active=True, created_at=now(), updated_at=now())
    db_session.add(fo)
    db_session.add(FinishOptionTranslation(id=uid(), finish_option_id="fo1", locale="vi", name="Tự nhiên", created_at=now(), updated_at=now()))

    so = SizeOption(id="so1", code="medium", width_cm=120, depth_cm=60, height_cm=75, price_delta_vnd=0, is_active=True, created_at=now(), updated_at=now())
    db_session.add(so)
    db_session.add(SizeOptionTranslation(id=uid(), size_option_id="so1", locale="vi", name="Vừa", created_at=now(), updated_at=now()))

    product = Product(id="prod1", sku="TABLE_001", room_category_id="cat1", base_price_vnd=12000000, status="ACTIVE", created_at=now(), updated_at=now())
    db_session.add(product)
    db_session.add(ProductTranslation(id=uid(), product_id="prod1", locale="vi", name="Bàn ăn", slug="ban-an", created_at=now(), updated_at=now()))
    db_session.add(ProductWoodType(id=uid(), product_id="prod1", wood_type_id="wt1"))
    db_session.add(ProductFinishOption(id=uid(), product_id="prod1", finish_option_id="fo1"))
    db_session.add(ProductSizeOption(id=uid(), product_id="prod1", size_option_id="so1"))
    db_session.add(InventoryItem(id=uid(), product_id="prod1", total_qty=20, reserved_qty=0, created_at=now(), updated_at=now()))

    await db_session.commit()
    return {"admin": admin, "product": product, "wt": wt, "fo": fo, "so": so}
