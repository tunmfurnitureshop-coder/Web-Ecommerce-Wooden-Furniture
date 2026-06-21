from typing import Optional, List, Any
from app.modules.seo.schemas import SeoMetadataDTO, BreadcrumbItem
from app.core.config import settings


def resolve_seo_metadata(
    translation,
    entity_name: str,
    short_description: Optional[str] = None,
    image_url: Optional[str] = None,
) -> SeoMetadataDTO:
    return SeoMetadataDTO(
        meta_title=getattr(translation, "meta_title", None) or entity_name,
        meta_description=getattr(translation, "meta_description", None) or short_description,
        og_title=(
            getattr(translation, "og_title", None)
            or getattr(translation, "meta_title", None)
            or entity_name
        ),
        og_description=(
            getattr(translation, "og_description", None)
            or getattr(translation, "meta_description", None)
            or short_description
        ),
        og_image_url=getattr(translation, "og_image_url", None) or image_url,
    )


def build_canonical_url(locale: str, path_type: str, slug: str) -> str:
    base = getattr(settings, "SITE_BASE_URL", settings.FRONTEND_BASE_URL).rstrip("/")
    return f"{base}/{locale}/{path_type}/{slug}"


def build_breadcrumbs(locale: str, *steps: tuple) -> List[BreadcrumbItem]:
    home_name = "Trang chủ" if locale == "vi" else "首页"
    items = [BreadcrumbItem(name=home_name, href=f"/{locale}")]
    for name, href in steps:
        items.append(BreadcrumbItem(name=name, href=href))
    return items


def build_product_jsonld(
    product_name: str,
    description: Optional[str],
    image_url: Optional[str],
    sku: str,
    price_vnd: int,
    in_stock: bool,
    avg_rating: Optional[float] = None,
    review_count: int = 0,
    canonical_url: Optional[str] = None,
) -> dict:
    data: dict = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product_name,
        "sku": sku,
        "brand": {"@type": "Brand", "name": "Vin Furniture"},
        "offers": {
            "@type": "Offer",
            "priceCurrency": "VND",
            "price": price_vnd,
            "availability": (
                "https://schema.org/InStock" if in_stock else "https://schema.org/OutOfStock"
            ),
        },
    }
    if description:
        data["description"] = description
    if image_url:
        data["image"] = image_url
    if canonical_url:
        data["url"] = canonical_url
    if avg_rating and review_count > 0:
        data["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": round(avg_rating, 1),
            "reviewCount": review_count,
        }
    return data


def build_breadcrumb_jsonld(breadcrumbs: List[BreadcrumbItem]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": bc.name, "item": bc.href}
            for i, bc in enumerate(breadcrumbs)
        ],
    }


def build_article_jsonld(
    headline: str,
    description: Optional[str],
    image_url: Optional[str],
    author_name: Optional[str],
    published_at,
    updated_at,
    canonical_url: Optional[str] = None,
) -> dict:
    data: dict = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headline,
        "author": {
            "@type": "Organization",
            "name": author_name or "Vin Furniture",
        },
    }
    if description:
        data["description"] = description
    if image_url:
        data["image"] = image_url
    if published_at:
        data["datePublished"] = published_at.isoformat()
    if updated_at:
        data["dateModified"] = updated_at.isoformat()
    if canonical_url:
        data["mainEntityOfPage"] = {"@type": "WebPage", "@id": canonical_url}
    return data
