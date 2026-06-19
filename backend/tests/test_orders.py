import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

ORDER_PAYLOAD = {
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0900000000",
    "customerEmail": "a@example.com",
    "shippingAddress": "Hà Nội",
    "note": None,
    "paymentMethod": "COD",
    "items": [
        {
            "productId": "prod1",
            "quantity": 1,
            "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"},
        }
    ],
}


async def test_create_order_cod(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    assert res.status_code == 200
    data = res.json()
    assert data["orderStatus"] == "PROCESSING"
    assert data["paymentStatus"] == "PENDING"
    assert "ORD-" in data["orderCode"]
    assert data["totalVnd"] == 12000000


async def test_create_order_mock_provider(client: AsyncClient, seeded_db):
    payload = {**ORDER_PAYLOAD, "paymentMethod": "MOCK_PROVIDER"}
    res = await client.post("/api/v1/orders", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["orderStatus"] == "PAID"
    assert data["paymentStatus"] == "PAID"


async def test_create_order_reserves_stock(client: AsyncClient, seeded_db, db_session):
    from app.modules.inventory.models import InventoryItem
    from sqlalchemy import select

    res = await client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    assert res.status_code == 200

    inv = (await db_session.execute(select(InventoryItem).where(InventoryItem.product_id == "prod1"))).scalar_one()
    assert inv.reserved_qty == 1


async def test_create_order_insufficient_stock(client: AsyncClient, seeded_db, db_session):
    from app.modules.inventory.models import InventoryItem
    from sqlalchemy import select

    inv = (await db_session.execute(select(InventoryItem).where(InventoryItem.product_id == "prod1"))).scalar_one()
    inv.total_qty = 0
    await db_session.commit()

    res = await client.post("/api/v1/orders", json={**ORDER_PAYLOAD, "items": [{**ORDER_PAYLOAD["items"][0], "quantity": 1}]})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "INSUFFICIENT_STOCK"


async def test_get_order_by_code(client: AsyncClient, seeded_db):
    create_res = await client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    order_code = create_res.json()["orderCode"]

    res = await client.get(f"/api/v1/orders/{order_code}")
    assert res.status_code == 200
    assert res.json()["orderCode"] == order_code


async def test_cancel_order_releases_stock(client: AsyncClient, seeded_db, db_session):
    from app.modules.inventory.models import InventoryItem
    from app.modules.order.models import Order
    from sqlalchemy import select

    create_res = await client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    order_code = create_res.json()["orderCode"]

    order = (await db_session.execute(select(Order).where(Order.order_code == order_code))).scalar_one()

    token_res = await client.post("/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = token_res.json()["accessToken"]

    status_res = await client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        json={"orderStatus": "CANCELLED"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_res.status_code == 200

    await db_session.refresh(order)
    inv = (await db_session.execute(select(InventoryItem).where(InventoryItem.product_id == "prod1"))).scalar_one()
    assert inv.reserved_qty == 0
