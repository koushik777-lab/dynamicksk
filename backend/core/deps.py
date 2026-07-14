"""FastAPI dependencies: current user, role guards."""
from fastapi import Request, HTTPException, Depends
from bson import ObjectId
import jwt

from core.security import decode_token
from core.db import get_db


async def get_current_user(request: Request) -> dict:
    # Prefer Authorization Bearer header (frontend uses Zustand + Axios interceptor)
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user")
    if not user or not user.get("active", True):
        raise HTTPException(status_code=401, detail="User not found or inactive")
    user["id"] = str(user.pop("_id"))
    user.pop("password_hash", None)
    return user


async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user


async def require_any(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("super_admin", "manager"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return user
