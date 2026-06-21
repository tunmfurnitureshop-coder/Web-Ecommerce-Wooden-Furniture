import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.modules.taxonomy.models import Tag, TagTranslation, ProductTag
from app.modules.taxonomy.schemas import (
    TagCreateRequest, TagUpdateRequest,
    TagOut, TagAdminOut, TagTranslationOut,
    TagListResponse, TagAdminListResponse,
)
from app.core.exceptions import not_found, conflict, validation_error
from app.shared.enums import TagType


def _now():
    return datetime.now(timezone.utc)


def _get_translation(translations, locale: str, fallback: str = "vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def get_public_tags(
    db: AsyncSession,
    locale: str = "vi",
    type_filter: Optional[str] = None,
) -> TagListResponse:
    query = select(Tag).where(Tag.is_active == True).options(selectinload(Tag.translations))  # noqa: E712
    if type_filter:
        query = query.where(Tag.type == type_filter.upper())
    query = query.order_by(Tag.sort_order, Tag.code)
    result = await db.execute(query)
    tags = result.scalars().all()

    items = []
    for tag in tags:
        t = _get_translation(tag.translations, locale)
        if not t:
            continue
        items.append(TagOut(
            id=tag.id, code=tag.code, type=tag.type,
            is_active=tag.is_active, sort_order=tag.sort_order,
            name=t.name, slug=t.slug, description=t.description,
        ))
    return TagListResponse(items=items)


async def admin_list_tags(db: AsyncSession) -> TagAdminListResponse:
    result = await db.execute(
        select(Tag).options(selectinload(Tag.translations)).order_by(Tag.sort_order, Tag.code)
    )
    tags = result.scalars().all()
    items = [
        TagAdminOut(
            id=tag.id, code=tag.code, type=tag.type,
            is_active=tag.is_active, sort_order=tag.sort_order,
            translations=[
                TagTranslationOut(locale=t.locale, name=t.name, slug=t.slug, description=t.description)
                for t in tag.translations
            ],
        )
        for tag in tags
    ]
    return TagAdminListResponse(items=items)


async def create_tag(db: AsyncSession, body: TagCreateRequest) -> TagAdminOut:
    existing = await db.execute(select(Tag).where(Tag.code == body.code))
    if existing.scalar_one_or_none():
        raise conflict("DUPLICATE_TAG_CODE", f"Tag code '{body.code}' already exists.")

    tag = Tag(
        id=str(uuid.uuid4()),
        code=body.code, type=body.type.value,
        is_active=body.is_active, sort_order=body.sort_order,
        created_at=_now(), updated_at=_now(),
    )
    db.add(tag)

    for locale, tin in body.translations.items():
        existing_slug = await db.execute(
            select(TagTranslation).where(TagTranslation.locale == locale, TagTranslation.slug == tin.slug)
        )
        if existing_slug.scalar_one_or_none():
            raise conflict("DUPLICATE_SLUG", f"Slug '{tin.slug}' already used for locale '{locale}'.")
        db.add(TagTranslation(
            id=str(uuid.uuid4()), tag_id=tag.id, locale=locale,
            name=tin.name, slug=tin.slug, description=tin.description,
            created_at=_now(), updated_at=_now(),
        ))

    await db.commit()
    await db.refresh(tag)
    result = await db.execute(
        select(Tag).where(Tag.id == tag.id).options(selectinload(Tag.translations))
    )
    tag = result.scalar_one()
    return TagAdminOut(
        id=tag.id, code=tag.code, type=tag.type,
        is_active=tag.is_active, sort_order=tag.sort_order,
        translations=[
            TagTranslationOut(locale=t.locale, name=t.name, slug=t.slug, description=t.description)
            for t in tag.translations
        ],
    )


async def update_tag(db: AsyncSession, tag_id: str, body: TagUpdateRequest) -> TagAdminOut:
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id).options(selectinload(Tag.translations))
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise not_found("Tag")

    if body.is_active is not None:
        tag.is_active = body.is_active
        tag.updated_at = _now()
    if body.sort_order is not None:
        tag.sort_order = body.sort_order
        tag.updated_at = _now()

    if body.translations:
        for locale, tin in body.translations.items():
            existing_t = next((t for t in tag.translations if t.locale == locale), None)
            if existing_t:
                existing_t.name = tin.name
                existing_t.slug = tin.slug
                existing_t.description = tin.description
                existing_t.updated_at = _now()
            else:
                existing_slug = await db.execute(
                    select(TagTranslation).where(
                        TagTranslation.locale == locale, TagTranslation.slug == tin.slug
                    )
                )
                if existing_slug.scalar_one_or_none():
                    raise conflict("DUPLICATE_SLUG", f"Slug '{tin.slug}' already used for locale '{locale}'.")
                db.add(TagTranslation(
                    id=str(uuid.uuid4()), tag_id=tag.id, locale=locale,
                    name=tin.name, slug=tin.slug, description=tin.description,
                    created_at=_now(), updated_at=_now(),
                ))

    await db.commit()
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id).options(selectinload(Tag.translations))
    )
    tag = result.scalar_one()
    return TagAdminOut(
        id=tag.id, code=tag.code, type=tag.type,
        is_active=tag.is_active, sort_order=tag.sort_order,
        translations=[
            TagTranslationOut(locale=t.locale, name=t.name, slug=t.slug, description=t.description)
            for t in tag.translations
        ],
    )


async def delete_tag(db: AsyncSession, tag_id: str) -> None:
    tag = (await db.execute(select(Tag).where(Tag.id == tag_id))).scalar_one_or_none()
    if not tag:
        raise not_found("Tag")

    linked_count = (await db.execute(
        select(ProductTag).where(ProductTag.tag_id == tag_id)
    )).scalars().first()
    if linked_count:
        raise conflict(
            "TAG_IN_USE",
            "Cannot delete a tag linked to products. Deactivate it instead.",
        )

    await db.execute(delete(TagTranslation).where(TagTranslation.tag_id == tag_id))
    await db.execute(delete(Tag).where(Tag.id == tag_id))
    await db.commit()


async def assign_tags_to_product(
    db: AsyncSession,
    product_id: str,
    tag_codes: List[str],
) -> None:
    if not tag_codes:
        return

    unique_codes = list(dict.fromkeys(tag_codes))

    tags_result = await db.execute(
        select(Tag).where(Tag.code.in_(unique_codes))
    )
    found_tags = {t.code: t for t in tags_result.scalars().all()}

    for code in unique_codes:
        tag = found_tags.get(code)
        if not tag:
            raise validation_error(f"Tag code '{code}' does not exist.")
        if not tag.is_active:
            raise validation_error(f"Tag '{code}' is inactive and cannot be assigned.")

        existing = await db.execute(
            select(ProductTag).where(
                ProductTag.product_id == product_id,
                ProductTag.tag_id == tag.id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(ProductTag(
                product_id=product_id,
                tag_id=tag.id,
                created_at=_now(),
            ))


async def remove_all_product_tags(db: AsyncSession, product_id: str) -> None:
    await db.execute(delete(ProductTag).where(ProductTag.product_id == product_id))
