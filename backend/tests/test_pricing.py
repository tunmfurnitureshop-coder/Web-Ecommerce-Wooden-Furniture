import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_pricing_quote_success(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/pricing/quote", json={
        "productId": "prod1",
        "quantity": 2,
        "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["unitPriceVnd"] == 12000000
    assert data["lineTotalVnd"] == 24000000
    assert data["breakdown"]["basePriceVnd"] == 12000000
    assert data["breakdown"]["woodTypeDeltaVnd"] == 0


async def test_pricing_invalid_product(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/pricing/quote", json={
        "productId": "nonexistent",
        "quantity": 1,
        "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"},
    })
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "PRODUCT_NOT_FOUND"


async def test_pricing_invalid_option_code(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/pricing/quote", json={
        "productId": "prod1",
        "quantity": 1,
        "selectedOptions": {"woodType": "unicorn_wood", "finish": "natural", "size": "medium"},
    })
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "INVALID_SELECTED_OPTION"


async def test_pricing_option_not_available_for_product(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/pricing/quote", json={
        "productId": "prod1",
        "quantity": 1,
        "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "small"},
    })
    assert res.status_code == 422
    assert "INVALID_SELECTED_OPTION" in res.json()["error"]["code"]


async def test_pricing_zero_quantity(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/pricing/quote", json={
        "productId": "prod1",
        "quantity": 0,
        "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"},
    })
    assert res.status_code == 422
