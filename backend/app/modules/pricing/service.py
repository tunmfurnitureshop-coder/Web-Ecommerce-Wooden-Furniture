from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.modules.product.models import Product
from app.modules.inventory.models import (
    WoodType, FinishOption, SizeOption,
    ProductWoodType, ProductFinishOption, ProductSizeOption,
)
from app.modules.pricing.schemas import PricingQuoteRequest, PricingQuoteResponse, PriceBreakdown
from app.core.exceptions import AppException
from app.shared.enums import ProductStatus


async def calculate_quote(db: AsyncSession, req: PricingQuoteRequest) -> PricingQuoteResponse:
    if req.quantity <= 0:
        raise AppException(422, "VALIDATION_ERROR", "Quantity must be greater than 0.")

    product = (await db.execute(select(Product).where(Product.id == req.productId))).scalar_one_or_none()
    if not product:
        raise AppException(404, "PRODUCT_NOT_FOUND", "Product not found.")
    if product.status != ProductStatus.ACTIVE:
        raise AppException(422, "PRODUCT_INACTIVE", "Product is not active.")

    wt = (await db.execute(select(WoodType).where(WoodType.code == req.selectedOptions.woodType, WoodType.is_active == True))).scalar_one_or_none()
    if not wt:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected wood type is not valid.")

    fo = (await db.execute(select(FinishOption).where(FinishOption.code == req.selectedOptions.finish, FinishOption.is_active == True))).scalar_one_or_none()
    if not fo:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected finish is not valid.")

    so = (await db.execute(select(SizeOption).where(SizeOption.code == req.selectedOptions.size, SizeOption.is_active == True))).scalar_one_or_none()
    if not so:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected size is not valid.")

    pwt = (await db.execute(select(ProductWoodType).where(ProductWoodType.product_id == product.id, ProductWoodType.wood_type_id == wt.id))).scalar_one_or_none()
    if not pwt:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected wood type is not available for this product.")

    pfo = (await db.execute(select(ProductFinishOption).where(ProductFinishOption.product_id == product.id, ProductFinishOption.finish_option_id == fo.id))).scalar_one_or_none()
    if not pfo:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected finish is not available for this product.")

    pso = (await db.execute(select(ProductSizeOption).where(ProductSizeOption.product_id == product.id, ProductSizeOption.size_option_id == so.id))).scalar_one_or_none()
    if not pso:
        raise AppException(422, "INVALID_SELECTED_OPTION", "Selected size is not available for this product.")

    unit_price = product.base_price_vnd + wt.price_delta_vnd + fo.price_delta_vnd + so.price_delta_vnd
    line_total = unit_price * req.quantity

    return PricingQuoteResponse(
        productId=req.productId,
        quantity=req.quantity,
        unitPriceVnd=unit_price,
        lineTotalVnd=line_total,
        breakdown=PriceBreakdown(
            basePriceVnd=product.base_price_vnd,
            woodTypeDeltaVnd=wt.price_delta_vnd,
            finishDeltaVnd=fo.price_delta_vnd,
            sizeDeltaVnd=so.price_delta_vnd,
        ),
    )
