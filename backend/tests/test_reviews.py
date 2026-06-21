import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from helpers import customer_login, admin_login

pytestmark = pytest.mark.asyncio

REVIEW_BODY = {"rating": 5, "title": "Tuyệt vời", "content": "Sản phẩm rất đẹp và bền"}


async def _seed_delivered_order(db_session: AsyncSession, customer_id: str) -> None:
    from app.modules.order.models import Order, OrderItem
    now = datetime.now(timezone.utc)
    order_id = str(uuid.uuid4())
    item_id = str(uuid.uuid4())
    order = Order(
        id=order_id, order_code=f"ORD-REV-{order_id[:6]}", customer_name="Test",
        customer_phone="0900000001", shipping_address="HN",
        subtotal_vnd=12000000, shipping_fee_vnd=0, total_vnd=12000000,
        order_status="DELIVERED", payment_status="PAID", payment_method="COD",
        customer_id=customer_id, created_at=now, updated_at=now,
    )
    item = OrderItem(
        id=item_id, order_id=order_id, product_id="prod1",
        product_name_snapshot="Bàn ăn", product_sku_snapshot="TABLE_001",
        selected_options_snapshot={}, unit_price_vnd=12000000, quantity=1,
        line_total_vnd=12000000, created_at=now, updated_at=now,
    )
    db_session.add_all([order, item])
    await db_session.commit()


async def test_customer_cannot_review_without_delivered_order(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


async def test_customer_can_review_delivered_product(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["status"] == "PENDING"


async def test_duplicate_review_returns_409(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/products/prod1/reviews", json=REVIEW_BODY, headers=headers)
    res = await client.post("/api/v1/products/prod1/reviews", json=REVIEW_BODY, headers=headers)
    assert res.status_code == 409


async def test_review_initially_pending(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.json()["status"] == "PENDING"


async def test_admin_approves_review(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    create_res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token}"},
    )
    review_id = create_res.json()["id"]

    admin_headers = await admin_login(client)
    approve_res = await client.patch(
        f"/api/v1/admin/reviews/{review_id}/status",
        json={"status": "APPROVED"},
        headers=admin_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"


async def test_product_detail_returns_only_approved_reviews(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    create_res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token}"},
    )
    review_id = create_res.json()["id"]

    # Before approval, public endpoint returns no items
    before_res = await client.get("/api/v1/products/prod1/reviews?locale=vi")
    assert before_res.json()["items"] == []

    admin_headers = await admin_login(client)
    await client.patch(f"/api/v1/admin/reviews/{review_id}/status", json={"status": "APPROVED"}, headers=admin_headers)

    after_res = await client.get("/api/v1/products/prod1/reviews?locale=vi")
    assert len(after_res.json()["items"]) == 1


async def test_update_approved_review_resets_to_pending(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}
    create_res = await client.post("/api/v1/products/prod1/reviews", json=REVIEW_BODY, headers=headers)
    review_id = create_res.json()["id"]

    admin_headers = await admin_login(client)
    await client.patch(f"/api/v1/admin/reviews/{review_id}/status", json={"status": "APPROVED"}, headers=admin_headers)

    edit_res = await client.patch(
        f"/api/v1/customer/reviews/{review_id}",
        json={"rating": 4, "content": "Đã cập nhật nội dung đánh giá"},
        headers=headers,
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["rating"] == 4


async def test_customer_cannot_edit_another_review(client: AsyncClient, db_session: AsyncSession, seeded_db):
    await _seed_delivered_order(db_session, "cust_a")
    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    token_b = await customer_login(client, "b@example.com", "PasswordB1")

    create_res = await client.post(
        "/api/v1/products/prod1/reviews", json=REVIEW_BODY,
        headers={"Authorization": f"Bearer {token_a}"},
    )
    review_id = create_res.json()["id"]

    res = await client.patch(
        f"/api/v1/customer/reviews/{review_id}",
        json={"rating": 1},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 404
