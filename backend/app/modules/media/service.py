import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.media.models import ProductImage
from app.modules.product.models import Product
from app.modules.media.schemas import ProductImageOut, UpdateProductImageRequest
from app.core.config import settings
from app.core.exceptions import AppException, not_found

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024
EXT_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def _get_storage():
    from app.modules.media.r2_storage import R2Storage
    return R2Storage()


async def upload_image_file(
    file_data: bytes, content_type: str, prefix: str = "uploads"
) -> dict:
    """Generic admin image upload to object storage. Returns the public URL +
    storage key; does not persist any DB row (caller stores the URL where needed,
    e.g. a campaign hero image)."""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise AppException(422, "MEDIA_INVALID_FILE_TYPE", f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}")
    if len(file_data) > MAX_FILE_SIZE:
        raise AppException(422, "MEDIA_FILE_TOO_LARGE", "File too large. Max 5MB.")
    safe_prefix = "".join(c for c in prefix if c.isalnum() or c in "-_") or "uploads"
    ext = EXT_MAP.get(content_type, "jpg")
    key = f"{safe_prefix}/{uuid.uuid4().hex}.{ext}"
    storage = _get_storage()
    try:
        url = await storage.upload(key, file_data, content_type)
    except Exception as e:
        raise AppException(500, "MEDIA_UPLOAD_FAILED", f"Upload failed: {str(e)}")
    return {"url": url, "key": key}


def _map_image(img: ProductImage) -> ProductImageOut:
    return ProductImageOut(
        id=img.id, productId=img.product_id, imageUrl=img.image_url,
        storageKey=img.storage_key, altText=img.alt_text, sortOrder=img.sort_order,
        isPrimary=img.is_primary, linkedFinishCode=img.linked_finish_code,
    )


async def upload_product_image(
    db: AsyncSession, product_id: str, file_data: bytes, content_type: str,
    alt_text: Optional[str] = None, linked_finish_code: Optional[str] = None,
    is_primary: bool = False,
) -> ProductImageOut:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise AppException(422, "MEDIA_INVALID_FILE_TYPE", f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}")
    if len(file_data) > MAX_FILE_SIZE:
        raise AppException(422, "MEDIA_FILE_TOO_LARGE", "File too large. Max 5MB.")
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not product:
        raise not_found("Product")
    ext = EXT_MAP.get(content_type, "jpg")
    image_id = str(uuid.uuid4())
    storage_key = f"products/{product_id}/{image_id[:8]}.{ext}"
    storage = _get_storage()
    try:
        image_url = await storage.upload(storage_key, file_data, content_type)
    except Exception as e:
        raise AppException(500, "MEDIA_UPLOAD_FAILED", f"Upload failed: {str(e)}")
    if is_primary:
        all_imgs = (await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )).scalars().all()
        for img in all_imgs:
            img.is_primary = False
    image = ProductImage(
        id=image_id, product_id=product_id, image_url=image_url,
        storage_key=storage_key, bucket_name=settings.R2_BUCKET_NAME,
        alt_text=alt_text, sort_order=0, is_primary=is_primary,
        linked_finish_code=linked_finish_code,
    )
    db.add(image)
    if is_primary:
        product.primary_image_url = image_url
    await db.commit()
    await db.refresh(image)
    return _map_image(image)


async def list_product_images(db: AsyncSession, product_id: str) -> List[ProductImageOut]:
    images = (await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id).order_by(ProductImage.sort_order)
    )).scalars().all()
    return [_map_image(i) for i in images]


async def update_product_image(
    db: AsyncSession, product_id: str, image_id: str, req: UpdateProductImageRequest
) -> ProductImageOut:
    image = (await db.execute(
        select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product_id)
    )).scalar_one_or_none()
    if not image:
        raise AppException(404, "MEDIA_IMAGE_NOT_FOUND", "Image not found.")
    if req.altText is not None:
        image.alt_text = req.altText
    if req.sortOrder is not None:
        image.sort_order = req.sortOrder
    if req.linkedFinishCode is not None:
        image.linked_finish_code = req.linkedFinishCode
    if req.isPrimary is True:
        all_imgs = (await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )).scalars().all()
        for img in all_imgs:
            img.is_primary = False
        image.is_primary = True
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if product:
            product.primary_image_url = image.image_url
    await db.commit()
    await db.refresh(image)
    return _map_image(image)


async def delete_product_image(db: AsyncSession, product_id: str, image_id: str):
    image = (await db.execute(
        select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product_id)
    )).scalar_one_or_none()
    if not image:
        raise AppException(404, "MEDIA_IMAGE_NOT_FOUND", "Image not found.")
    storage = _get_storage()
    try:
        await storage.delete(image.storage_key)
    except Exception:
        pass
    was_primary = image.is_primary
    await db.delete(image)
    await db.flush()
    if was_primary:
        next_img = (await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
            .order_by(ProductImage.sort_order).limit(1)
        )).scalar_one_or_none()
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if product:
            if next_img:
                next_img.is_primary = True
                product.primary_image_url = next_img.image_url
            else:
                product.primary_image_url = None
    await db.commit()
