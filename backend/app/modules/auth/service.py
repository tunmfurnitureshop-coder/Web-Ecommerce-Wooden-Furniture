from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import AdminUser
from app.core.security import verify_password, create_access_token
from app.core.exceptions import unauthorized


async def authenticate_admin(db: AsyncSession, email: str, password: str) -> str:
    result = await db.execute(select(AdminUser).where(AdminUser.email == email, AdminUser.is_active == True))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        raise unauthorized()
    return create_access_token({"sub": admin.email, "role": admin.role})
