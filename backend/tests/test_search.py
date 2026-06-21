import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio


async def test_search_product_by_name(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&q=bàn")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["query"] == "bàn"
    assert any("Bàn" in item["name"] for item in data["items"])


async def test_search_no_match_returns_empty(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&q=xyzabc999notfound")
    assert res.status_code == 200
    assert res.json()["total"] == 0
    assert res.json()["items"] == []


async def test_search_by_category(client: AsyncClient, seeded_db):
    # slug "phong-an" is the vi translation slug for category code "dining_room"
    res = await client.get("/api/v1/products?locale=vi&room=phong-an")
    assert res.status_code == 200
    assert res.json()["total"] >= 1


async def test_search_by_wood_type(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&woodType=oak")
    assert res.status_code == 200
    assert res.json()["total"] >= 1


async def test_search_with_price_filter(client: AsyncClient, seeded_db):
    res_match = await client.get("/api/v1/products?locale=vi&minPrice=10000000&maxPrice=15000000")
    assert res_match.status_code == 200
    assert res_match.json()["total"] >= 1

    res_no_match = await client.get("/api/v1/products?locale=vi&maxPrice=1000")
    assert res_no_match.status_code == 200
    assert res_no_match.json()["total"] == 0


async def test_sort_price_ascending(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&sort=price_asc")
    assert res.status_code == 200
    items = res.json()["items"]
    if len(items) > 1:
        prices = [i["basePriceVnd"] for i in items]
        assert prices == sorted(prices)


async def test_sort_price_descending(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&sort=price_desc")
    assert res.status_code == 200
    items = res.json()["items"]
    if len(items) > 1:
        prices = [i["basePriceVnd"] for i in items]
        assert prices == sorted(prices, reverse=True)


async def test_sort_newest(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&sort=newest")
    assert res.status_code == 200
    assert res.json()["total"] >= 1


async def test_suggestion_query_length_less_than_2_returns_empty(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products/suggestions?q=b&locale=vi")
    assert res.status_code == 200
    data = res.json()
    assert data["products"] == []
    assert data["categories"] == []
    assert data["woodTypes"] == []


async def test_search_suggestion_returns_results(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products/suggestions?q=bàn&locale=vi")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["products"], list)
    assert isinstance(data["categories"], list)
    assert isinstance(data["woodTypes"], list)


async def test_query_params_in_response(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&q=bàn&sort=price_asc&room=dining_room")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "bàn"
    assert data["appliedFilters"]["sort"] == "price_asc"
    assert data["appliedFilters"]["room"] == "dining_room"
