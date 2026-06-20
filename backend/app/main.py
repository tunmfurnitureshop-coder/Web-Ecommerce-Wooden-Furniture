from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import AppException
from app.modules.auth.router import router as auth_router
from app.modules.product.router import router as product_router, admin_router as admin_product_router
from app.modules.pricing.router import router as pricing_router
from app.modules.cart.router import router as cart_router
from app.modules.order.router import router as order_router, admin_router as admin_order_router
from app.modules.inventory.router import router as admin_inventory_router
from app.modules.admin.router import router as admin_dashboard_router
from app.modules.payment.router import router as admin_payment_router
from app.modules.webhook.router import router as webhook_router
from app.modules.media.router import router as admin_media_router
from app.modules.customer_auth.router import router as customer_auth_router
# Ensure all v0.3 models are imported so SQLAlchemy can resolve string-based relationships
import app.modules.customer.models  # noqa: F401
import app.modules.wishlist.models  # noqa: F401
import app.modules.review.models  # noqa: F401

app = FastAPI(title=settings.APP_NAME, version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


API_PREFIX = "/api/v1"

app.include_router(product_router, prefix=API_PREFIX)
app.include_router(pricing_router, prefix=API_PREFIX)
app.include_router(cart_router, prefix=API_PREFIX)
app.include_router(order_router, prefix=API_PREFIX)
app.include_router(webhook_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(admin_product_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_order_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_inventory_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_dashboard_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_payment_router, prefix=f"{API_PREFIX}/admin")
app.include_router(admin_media_router, prefix=f"{API_PREFIX}/admin")
app.include_router(customer_auth_router, prefix=API_PREFIX)
