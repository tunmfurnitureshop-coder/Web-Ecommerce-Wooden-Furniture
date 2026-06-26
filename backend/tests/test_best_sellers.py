"""Best-sellers endpoint: ranking by paid units, paid-only, fallback, bounds."""
import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from app.modules.order.models import Order, OrderItem
from app.modules.product.models import Product, ProductTranslation

pytestmark = pytest.mark.asyncio


def _uid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


def _add_product(db, pid, name, slug, price=1000000, status="ACTIVE"):
    db.add(Product(id=pid, sku=pid.upper(), room_category_id="cat1",
                   base_price_vnd=price, status=status, created_at=_now(), updated_at=_now()))
    db.add(ProductTranslation(id=_uid(), product_id=pid, locale="vi",
                              name=name, slug=slug, created_at=_now(), updated_at=_now()))


def _add_order(db, product_id, quantity, payment_status="PAID"):
    oid = _uid()
    total = quantity * 1000000
    db.add(Order(
        id=oid, order_code=f"ORD-{oid[:8]}",
        customer_name="Buyer", customer_phone="0900000000",
        shipping_address="HCM", subtotal_vnd=total, total_vnd=total,
        order_status="PAID", payment_status=payment_status, payment_method="COD",
        merchandise_subtotal_vnd=total, created_at=_now(), updated_at=_now(),
    ))
    db.add(OrderItem(
        id=_uid(), order_id=oid, product_id=product_id,
        product_name_snapshot="x", product_sku_snapshot="x",
        selected_options_snapshot={}, unit_price_vnd=1000000,
        quantity=quantity, line_total_vnd=total, created_at=_now(), updated_at=_now(),
    ))


async def test_best_sellers_ranks_by_units_sold(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    _add_product(db_session, "p_a", "Sản phẩm A", "san-pham-a")
    _add_product(db_session, "p_b", "Sản phẩm B", "san-pham-b")
    _add_order(db_session, "p_a", 2)
    _add_order(db_session, "p_b", 9)
    await db_session.commit()

    res = await client.get("/api/v1/products/best-sellers?locale=vi&limit=12")
    assert res.status_code == 200
    ids = [i["id"] for i in res.json()["items"]]
    assert ids.index("p_b") < ids.index("p_a")  # 9 units before 2 units


async def test_best_sellers_counts_paid_only(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    _add_product(db_session, "p_paid", "Đã TT", "da-tt")
    _add_product(db_session, "p_unpaid", "Chưa TT", "chua-tt")
    _add_order(db_session, "p_paid", 1, payment_status="PAID")
    _add_order(db_session, "p_unpaid", 50, payment_status="UNPAID")
    await db_session.commit()

    ids = [i["id"] for i in (await client.get("/api/v1/products/best-sellers")).json()["items"]]
    # Unpaid units don't rank; paid product must precede the unpaid one (fallback).
    assert ids.index("p_paid") < ids.index("p_unpaid")


async def test_best_sellers_fallback_never_empty(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products/best-sellers")
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(i["id"] == "prod1" for i in items)  # seeded active product fills in


async def test_best_sellers_limit_bounds(client: AsyncClient, seeded_db):
    assert (await client.get("/api/v1/products/best-sellers?limit=0")).status_code == 422
    assert (await client.get("/api/v1/products/best-sellers?limit=999")).status_code == 422
