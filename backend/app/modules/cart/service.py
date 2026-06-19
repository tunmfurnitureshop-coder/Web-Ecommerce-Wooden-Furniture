from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.product.models import Product, ProductTranslation
from app.modules.inventory.models import WoodType, WoodTypeTranslation, FinishOption, FinishOptionTranslation, SizeOption, SizeOptionTranslation
from app.modules.pricing.service import calculate_quote
from app.modules.pricing.schemas import PricingQuoteRequest, SelectedOptionsIn
from app.modules.cart.schemas import CartHydrateRequest, CartHydrateResponse, HydratedCartItem, HydratedSelectedOptions, HydratedOptionLabel
from app.core.exceptions import AppException


def _get_trans(translations, locale: str, fallback="vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def hydrate_cart(db: AsyncSession, req: CartHydrateRequest) -> CartHydrateResponse:
    locale = req.locale
    hydrated = []

    for item in req.items:
        product = (await db.execute(select(Product).where(Product.id == item.productId))).scalar_one_or_none()
        if not product:
            raise AppException(404, "PRODUCT_NOT_FOUND", f"Product {item.productId} not found.")

        trans_result = await db.execute(
            select(ProductTranslation).where(ProductTranslation.product_id == product.id)
        )
        translations = trans_result.scalars().all()
        trans = _get_trans(translations, locale)

        quote = await calculate_quote(db, PricingQuoteRequest(
            productId=item.productId,
            quantity=item.quantity,
            selectedOptions=SelectedOptionsIn(**item.selectedOptions.model_dump()),
        ))

        wt = (await db.execute(select(WoodType).where(WoodType.code == item.selectedOptions.woodType))).scalar_one_or_none()
        fo = (await db.execute(select(FinishOption).where(FinishOption.code == item.selectedOptions.finish))).scalar_one_or_none()
        so = (await db.execute(select(SizeOption).where(SizeOption.code == item.selectedOptions.size))).scalar_one_or_none()

        wt_trans_res = await db.execute(select(WoodTypeTranslation).where(WoodTypeTranslation.wood_type_id == wt.id))
        wt_trans = _get_trans(wt_trans_res.scalars().all(), locale)

        fo_trans_res = await db.execute(select(FinishOptionTranslation).where(FinishOptionTranslation.finish_option_id == fo.id))
        fo_trans = _get_trans(fo_trans_res.scalars().all(), locale)

        so_trans_res = await db.execute(select(SizeOptionTranslation).where(SizeOptionTranslation.size_option_id == so.id))
        so_trans = _get_trans(so_trans_res.scalars().all(), locale)

        hydrated.append(HydratedCartItem(
            productId=product.id,
            sku=product.sku,
            name=trans.name if trans else product.sku,
            imageUrl=product.primary_image_url,
            quantity=item.quantity,
            selectedOptions=HydratedSelectedOptions(
                woodType=HydratedOptionLabel(code=wt.code, label=wt_trans.name if wt_trans else wt.code),
                finish=HydratedOptionLabel(code=fo.code, label=fo_trans.name if fo_trans else fo.code),
                size=HydratedOptionLabel(code=so.code, label=so_trans.name if so_trans else so.code),
            ),
            unitPriceVnd=quote.unitPriceVnd,
            lineTotalVnd=quote.lineTotalVnd,
        ))

    subtotal = sum(i.lineTotalVnd for i in hydrated)
    return CartHydrateResponse(items=hydrated, subtotalVnd=subtotal, totalVnd=subtotal)
