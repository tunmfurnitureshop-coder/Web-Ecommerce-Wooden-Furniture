import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from helpers import customer_login, admin_login

pytestmark = pytest.mark.asyncio

ORDER_PAYLOAD = {
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0900000001",
    "customerEmail": "a@example.com",
    "shippingAddress": "Hà Nội",
    "paymentMethod": "COD",
    "items": [{"productId": "prod1", "quantity": 1, "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"}}],
}


async def _seed_delivered_order(db_session: AsyncSession, customer_id: str) -> str:
    """Creates a DELIVERED order belonging to customer_id, returns order id."""
    from app.modules.order.models import Order, OrderItem
    now = datetime.now(timezone.utc)
    order_id = str(uuid.uuid4())
    item_id = str(uuid.uuid4())
    order = Order(
        id=order_id, order_code=f"ORD-TEST-{order_id[:6]}", customer_name="Test",
        customer_phone="0900000001", shipping_address="HN",
        subtotal_vnd=12000000, shipping_fee_vnd=0, total_vnd=12000000,
        order_status="DELIVERED", payment_status="PAID", payment_method="COD",
        customer_id=customer_id, created_at=now, updated_at=now,
    )
    item = OrderItem(
        id=item_id, order_id=order_id, product_id="prod1",
        product_name_snapshot="Bàn ăn", product_sku_snapshot="TABLE_001",
        selected_options_snapshot={
            "woodType": {"code": "oak", "label": "Gỗ sồi", "priceDeltaVnd": 0},
            "finish": {"code": "natural", "label": "Tự nhiên", "priceDeltaVnd": 0},
            "size": {"code": "medium", "label": "Vừa", "priceDeltaVnd": 0},
        },
        unit_price_vnd=12000000, quantity=1, line_total_vnd=12000000,
        created_at=now, updated_at=now,
    )
    db_session.add_all([order, item])
    await db_session.commit()
    return order_id


async def test_customer_sees_only_own_orders(client: AsyncClient, seeded_db):
    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    token_b = await customer_login(client, "b@example.com", "PasswordB1")

    await client.post("/api/v1/orders", json={**ORDER_PAYLOAD, "customerEmail": "a@example.com"})

    res_a = await client.get("/api/v1/customer/orders", headers={"Authorization": f"Bearer {token_a}"})
    res_b = await client.get("/api/v1/customer/orders", headers={"Authorization": f"Bearer {token_b}"})

    assert res_a.status_code == 200
    assert res_b.status_code == 200
    # Customer A has an order (by email match), Customer B has none
    assert res_b.json()["total"] == 0


async def test_guest_order_hidden_before_claim(client: AsyncClient, seeded_db):
    # Guest order (no customer_id, but email matches cust_a)
    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.get("/api/v1/customer/orders", headers={"Authorization": f"Bearer {token_a}"})
    # Guest orders don't appear until claimed
    assert res.json()["total"] == 0


async def test_verified_customer_claims_guest_orders(client: AsyncClient, db_session: AsyncSession, seeded_db):
    from app.modules.customer_auth.models import CustomerAuthToken
    from app.modules.customer_auth.service import create_one_time_token
    from app.shared.enums import CustomerTokenType

    # Place a guest order with cust_a's email
    await client.post("/api/v1/orders", json={**ORDER_PAYLOAD, "customerEmail": "a@example.com"})

    # Trigger email verification which claims guest orders
    raw_token = await create_one_time_token(db_session, "cust_a", CustomerTokenType.EMAIL_VERIFICATION, 1)
    await db_session.commit()
    verify_res = await client.post("/api/v1/customer/auth/verify-email", json={"token": raw_token})
    assert verify_res.status_code == 200

    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.get("/api/v1/customer/orders", headers={"Authorization": f"Bearer {token_a}"})
    assert res.json()["total"] >= 1


async def test_reorder_returns_valid_items(client: AsyncClient, db_session: AsyncSession, seeded_db):
    order_id = await _seed_delivered_order(db_session, "cust_a")
    from app.modules.order.models import Order
    from sqlalchemy import select
    order = (await db_session.execute(select(Order).where(Order.id == order_id))).scalar_one()

    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        f"/api/v1/customer/orders/{order.order_code}/reorder",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["productId"] == "prod1"


async def test_reorder_flags_inactive_product(client: AsyncClient, db_session: AsyncSession, seeded_db):
    from app.modules.product.models import Product
    from sqlalchemy import select

    order_id = await _seed_delivered_order(db_session, "cust_a")
    from app.modules.order.models import Order
    order = (await db_session.execute(select(Order).where(Order.id == order_id))).scalar_one()

    prod = (await db_session.execute(select(Product).where(Product.id == "prod1"))).scalar_one()
    prod.status = "INACTIVE"
    await db_session.commit()

    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        f"/api/v1/customer/orders/{order.order_code}/reorder",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    unavailable = res.json()["unavailableItems"]
    assert len(unavailable) == 1
    assert unavailable[0]["reason"] == "PRODUCT_INACTIVE"


async def test_reorder_recalculates_current_price(client: AsyncClient, db_session: AsyncSession, seeded_db):
    from app.modules.product.models import Product
    from sqlalchemy import select

    order_id = await _seed_delivered_order(db_session, "cust_a")
    from app.modules.order.models import Order
    order = (await db_session.execute(select(Order).where(Order.id == order_id))).scalar_one()

    prod = (await db_session.execute(select(Product).where(Product.id == "prod1"))).scalar_one()
    prod.base_price_vnd = 15000000
    await db_session.commit()

    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        f"/api/v1/customer/orders/{order.order_code}/reorder",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    items = res.json()["items"]
    assert items[0]["currentUnitPriceVnd"] == 15000000
