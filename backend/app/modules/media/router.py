from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.dependencies import require_admin
from app.modules.media import service
from app.modules.media.schemas import UpdateProductImageRequest

router = APIRouter(tags=["admin-media"])


@router.post("/uploads/image")
async def upload_image_generic(
    file: UploadFile = File(...),
    prefix: str = Form("uploads"),
    _: dict = Depends(require_admin),
):
    data = await file.read()
    return await service.upload_image_file(data, file.content_type, prefix)


@router.post("/products/{product_id}/images")
async def upload_image(
    product_id: str,
    file: UploadFile = File(...),
    altText: Optional[str] = Form(None),
    linkedFinishCode: Optional[str] = Form(None),
    isPrimary: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    data = await file.read()
    return await service.upload_product_image(
        db, product_id, data, file.content_type,
        alt_text=altText, linked_finish_code=linkedFinishCode, is_primary=isPrimary,
    )


@router.get("/products/{product_id}/images")
async def list_images(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    items = await service.list_product_images(db, product_id)
    return {"items": [i.model_dump() for i in items]}


@router.patch("/products/{product_id}/images/{image_id}")
async def update_image(
    product_id: str,
    image_id: str,
    body: UpdateProductImageRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.update_product_image(db, product_id, image_id, body)


@router.delete("/products/{product_id}/images/{image_id}", status_code=204)
async def delete_image(
    product_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.delete_product_image(db, product_id, image_id)
