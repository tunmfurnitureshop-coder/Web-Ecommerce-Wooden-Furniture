import pytest
from httpx import AsyncClient
from helpers import customer_login

pytestmark = pytest.mark.asyncio

ADDRESS_BODY = {
    "recipientName": "Nguyễn Văn A",
    "phone": "0900000000",
    "fullAddress": "123 Đường Lê Lợi, Hà Nội",
}


async def test_create_address(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.post("/api/v1/customer/addresses", json=ADDRESS_BODY, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["recipientName"] == "Nguyễn Văn A"
    assert data["isDefault"] is True  # first address becomes default


async def test_cannot_edit_another_customer_address(client: AsyncClient, seeded_db):
    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    token_b = await customer_login(client, "b@example.com", "PasswordB1")

    create_res = await client.post(
        "/api/v1/customer/addresses", json=ADDRESS_BODY,
        headers={"Authorization": f"Bearer {token_a}"},
    )
    addr_id = create_res.json()["id"]

    # Customer B tries to update Customer A's address
    res = await client.patch(
        f"/api/v1/customer/addresses/{addr_id}",
        json={"fullAddress": "Hacked address"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 404


async def test_set_default_address(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    addr1 = (await client.post("/api/v1/customer/addresses", json=ADDRESS_BODY, headers=headers)).json()
    addr2_body = {**ADDRESS_BODY, "fullAddress": "456 Đường Nguyễn Huệ, TP HCM"}
    addr2 = (await client.post("/api/v1/customer/addresses", json=addr2_body, headers=headers)).json()

    res = await client.post(
        f"/api/v1/customer/addresses/{addr2['id']}/set-default", headers=headers
    )
    assert res.status_code == 200

    list_res = await client.get("/api/v1/customer/addresses", headers=headers)
    addresses = list_res.json()
    defaults = [a for a in addresses if a["isDefault"]]
    assert len(defaults) == 1
    assert defaults[0]["id"] == addr2["id"]


async def test_only_one_default_per_customer(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    for i in range(3):
        body = {**ADDRESS_BODY, "fullAddress": f"Address {i}"}
        await client.post("/api/v1/customer/addresses", json=body, headers=headers)

    # Set the last created address as default
    list_res = await client.get("/api/v1/customer/addresses", headers=headers)
    last_id = list_res.json()[-1]["id"]
    await client.post(f"/api/v1/customer/addresses/{last_id}/set-default", headers=headers)

    list_res2 = await client.get("/api/v1/customer/addresses", headers=headers)
    defaults = [a for a in list_res2.json() if a["isDefault"]]
    assert len(defaults) == 1


async def test_delete_address(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    addr = (await client.post("/api/v1/customer/addresses", json=ADDRESS_BODY, headers=headers)).json()
    del_res = await client.delete(f"/api/v1/customer/addresses/{addr['id']}", headers=headers)
    assert del_res.status_code == 204

    list_res = await client.get("/api/v1/customer/addresses", headers=headers)
    assert list_res.json() == []
