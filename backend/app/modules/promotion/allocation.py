from dataclasses import dataclass
from math import floor
from typing import Optional
from app.modules.promotion.eligibility import PricedItem
from app.modules.promotion.models import Promotion
from app.shared.enums import DiscountType


@dataclass
class LineAllocation:
    product_id: str
    discount_vnd: int


def _proportional_allocate(
    eligible_items: list[PricedItem],
    total_discount: int,
) -> list[LineAllocation]:
    eligible_subtotal = sum(i.line_total_vnd for i in eligible_items)
    if eligible_subtotal == 0:
        return [LineAllocation(i.product_id, 0) for i in eligible_items]

    allocations: list[LineAllocation] = []
    distributed = 0
    for item in eligible_items:
        raw = floor(total_discount * item.line_total_vnd / eligible_subtotal)
        allocations.append(LineAllocation(item.product_id, raw))
        distributed += raw

    # Rounding remainder → highest line_total_vnd item
    remainder = total_discount - distributed
    if remainder > 0 and eligible_items:
        highest_idx = max(range(len(eligible_items)), key=lambda i: eligible_items[i].line_total_vnd)
        allocations[highest_idx].discount_vnd += remainder

    return allocations


def allocate_percentage(
    eligible_items: list[PricedItem],
    bps: int,
    max_vnd: Optional[int],
) -> tuple[int, list[LineAllocation]]:
    eligible_subtotal = sum(i.line_total_vnd for i in eligible_items)
    total_discount = floor(eligible_subtotal * bps / 10000)
    if max_vnd:
        total_discount = min(total_discount, max_vnd)
    total_discount = min(total_discount, eligible_subtotal)
    return total_discount, _proportional_allocate(eligible_items, total_discount)


def allocate_fixed(
    eligible_items: list[PricedItem],
    amount_vnd: int,
) -> tuple[int, list[LineAllocation]]:
    eligible_subtotal = sum(i.line_total_vnd for i in eligible_items)
    total_discount = min(amount_vnd, eligible_subtotal)
    return total_discount, _proportional_allocate(eligible_items, total_discount)


def allocate_discount(
    promotion: Promotion,
    eligible_items: list[PricedItem],
) -> tuple[int, list[LineAllocation]]:
    if not eligible_items:
        return 0, []

    if promotion.discount_type == DiscountType.PERCENTAGE:
        return allocate_percentage(
            eligible_items,
            promotion.discount_percentage_bps or 0,
            promotion.max_discount_vnd,
        )

    if promotion.discount_type == DiscountType.FIXED_AMOUNT:
        return allocate_fixed(eligible_items, promotion.discount_amount_vnd or 0)

    return 0, []
