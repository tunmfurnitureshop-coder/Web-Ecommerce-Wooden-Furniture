from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.discovery import service
from app.modules.discovery.schemas import (
    RecentlyViewedHydrateRequest,
    CategoryLandingOut, MaterialLandingOut,
    SynonymCreateRequest, SynonymUpdateRequest,
    SynonymOut, SynonymListResponse,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["discovery"])
admin_router = APIRouter(tags=["admin-discovery"])


@router.post("/discovery/recently-viewed/hydrate")
async def hydrate_recently_viewed(
    body: RecentlyViewedHydrateRequest,
    db: AsyncSession = Depends(get_db),
):
    items = await service.hydrate_recently_viewed(db, body)
    return {"items": [i.model_dump() for i in items]}


@router.get("/categories/{slug}", response_model=CategoryLandingOut)
async def category_landing(
    slug: str,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_category_landing(db, slug, locale)


@router.get("/materials/{slug}", response_model=MaterialLandingOut)
async def material_landing(
    slug: str,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_material_landing(db, slug, locale)


@admin_router.get("/synonyms", response_model=SynonymListResponse)
async def list_synonyms(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_synonyms(db)


@admin_router.post("/synonyms", response_model=SynonymOut, status_code=201)
async def create_synonym(
    body: SynonymCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_create_synonym(db, body)


@admin_router.patch("/synonyms/{synonym_id}", response_model=SynonymOut)
async def update_synonym(
    synonym_id: str,
    body: SynonymUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_update_synonym(db, synonym_id, body)


@admin_router.delete("/synonyms/{synonym_id}", status_code=204)
async def delete_synonym(
    synonym_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.admin_delete_synonym(db, synonym_id)
