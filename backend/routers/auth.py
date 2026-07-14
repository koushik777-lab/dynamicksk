"""Authentication routes: login, refresh, logout, me, forgot/reset password, change password."""
import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from core.db import get_db
from core.deps import get_current_user
from core.utils import now_iso, log_activity, parse_request

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class UpdateProfileIn(BaseModel):
    name: str | None = None
    avatar: str | None = None


def _serialize(user: dict) -> dict:
    return {
        "id": user["id"] if "id" in user else str(user.get("_id", "")),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "avatar": user.get("avatar"),
        "active": user.get("active", True),
        "company_id": user.get("company_id"),
        "protected": user.get("protected", False),
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login"),
    }


@router.post("/login")
async def login(payload: LoginIn, response: Response, request: Request):
    db = get_db()
    email = payload.email.lower().strip()
    ident = f"{parse_request(request)['ip']}:{email}"

    # Brute force protection
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("locked_until") and datetime.fromisoformat(attempt["locked_until"]) > datetime.now(timezone.utc):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        # Record failed attempt
        count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"identifier": ident, "count": count, "last_at": now_iso()}
        if count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": ident}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Account suspended. Contact administrator.")

    await db.login_attempts.delete_one({"identifier": ident})

    user_id = str(user["_id"])
    access = create_access_token(user_id, user["role"], remember=payload.remember)
    refresh = create_refresh_token(user_id)

    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now_iso()}})
    await db.login_history.insert_one({
        "user_id": user_id,
        "email": email,
        "ip": parse_request(request)["ip"],
        "user_agent": parse_request(request)["user_agent"],
        "timestamp": now_iso(),
    })
    await log_activity(db, {"id": user_id, "email": email, "role": user["role"]}, "user.login", "user", user_id, request=request)

    # Also set httpOnly cookies (optional; frontend primarily uses bearer)
    max_age = 60 * 60 * 24 * 30 if payload.remember else 60 * 60
    response.set_cookie("access_token", access, httponly=True, samesite="lax", max_age=max_age, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30, path="/")

    user["id"] = user_id
    return {"user": _serialize(user), "access_token": access, "refresh_token": refresh}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        # Also accept from body
        try:
            body = await request.json()
            token = body.get("refresh_token")
        except Exception:
            token = None
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or not user.get("active", True):
        raise HTTPException(status_code=401, detail="User not found")

    access = create_access_token(str(user["_id"]), user["role"])
    response.set_cookie("access_token", access, httponly=True, samesite="lax", max_age=60 * 60, path="/")
    return {"access_token": access}


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user), request: Request = None):
    db = get_db()
    await log_activity(db, user, "user.logout", "user", user["id"], request=request)
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return _serialize(user)


@router.patch("/me")
async def update_me(payload: UpdateProfileIn, user: dict = Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": updates})
    u = await db.users.find_one({"_id": ObjectId(user["id"])})
    u["id"] = str(u.pop("_id"))
    return _serialize(u)


@router.post("/change-password")
async def change_password(payload: ChangePasswordIn, user: dict = Depends(get_current_user), request: Request = None):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not verify_password(payload.current_password, doc.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one({"_id": doc["_id"]}, {"$set": {"password_hash": hash_password(payload.new_password)}})
    await log_activity(db, user, "user.password_change", "user", user["id"], request=request)
    return {"success": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotIn):
    db = get_db()
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return success (don't leak accounts)
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": str(user["_id"]),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
            "created_at": now_iso(),
        })
        print(f"[password-reset] Link for {email}: /reset-password?token={token}")
    return {"success": True, "message": "If an account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetIn):
    db = get_db()
    rec = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if rec["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one(
        {"_id": ObjectId(rec["user_id"])},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"success": True}


@router.get("/login-history")
async def login_history(user: dict = Depends(get_current_user)):
    db = get_db()
    docs = await db.login_history.find({"user_id": user["id"]}).sort("timestamp", -1).limit(20).to_list(20)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs
