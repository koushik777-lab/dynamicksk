"""Managers management (Super Admin only)."""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional

from core.db import get_db
from core.deps import require_super_admin
from core.security import hash_password, create_access_token, create_refresh_token
from core.utils import now_iso, log_activity

router = APIRouter(prefix="/api/managers", tags=["managers"])


class ManagerIn(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    company_id: Optional[str] = None
    avatar: Optional[str] = None


class ManagerUpdate(BaseModel):
    name: Optional[str] = None
    company_id: Optional[str] = None
    avatar: Optional[str] = None


class ResetIn(BaseModel):
    new_password: str = Field(min_length=6)


def _serialize(u: dict, company: dict | None = None) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "name": u.get("name"),
        "email": u.get("email"),
        "role": u.get("role"),
        "avatar": u.get("avatar"),
        "active": u.get("active", True),
        "company_id": u.get("company_id"),
        "company_name": company.get("name") if company else None,
        "created_at": u.get("created_at"),
        "last_login": u.get("last_login"),
    }


@router.get("")
async def list_managers(user: dict = Depends(require_super_admin), q: str = "", company_id: str = ""):
    db = get_db()
    query = {"role": "manager"}
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]
    if company_id:
        query["company_id"] = company_id
    docs = await db.users.find(query).sort("created_at", -1).to_list(500)
    out = []
    for m in docs:
        company = None
        if m.get("company_id"):
            try:
                company = await db.companies.find_one({"_id": ObjectId(m["company_id"])})
            except Exception:
                company = None
        out.append(_serialize(m, company))
    return out


@router.post("")
async def create_manager(payload: ManagerIn, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": "manager",
        "avatar": payload.avatar,
        "active": True,
        "company_id": payload.company_id,
        "created_at": now_iso(),
        "last_login": None,
    }
    res = await db.users.insert_one(doc)
    if payload.company_id:
        await db.companies.update_one({"_id": ObjectId(payload.company_id)}, {"$addToSet": {"manager_ids": str(res.inserted_id)}})
    await log_activity(db, user, "manager.create", "user", str(res.inserted_id), {"email": email}, request=request)
    doc["_id"] = res.inserted_id
    company = None
    if payload.company_id:
        company = await db.companies.find_one({"_id": ObjectId(payload.company_id)})
    return _serialize(doc, company)


@router.patch("/{manager_id}")
async def update_manager(manager_id: str, payload: ManagerUpdate, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    prev = await db.users.find_one({"_id": ObjectId(manager_id)})
    if not prev:
        raise HTTPException(404, "Manager not found")
    if updates:
        await db.users.update_one({"_id": ObjectId(manager_id)}, {"$set": updates})
    # Reconcile company assignment
    if "company_id" in updates and updates["company_id"] != prev.get("company_id"):
        if prev.get("company_id"):
            await db.companies.update_one({"_id": ObjectId(prev["company_id"])}, {"$pull": {"manager_ids": manager_id}})
        if updates["company_id"]:
            await db.companies.update_one({"_id": ObjectId(updates["company_id"])}, {"$addToSet": {"manager_ids": manager_id}})
    m = await db.users.find_one({"_id": ObjectId(manager_id)})
    company = None
    if m.get("company_id"):
        try:
            company = await db.companies.find_one({"_id": ObjectId(m["company_id"])})
        except Exception:
            company = None
    await log_activity(db, user, "manager.update", "user", manager_id, updates, request=request)
    return _serialize(m, company)


@router.post("/{manager_id}/suspend")
async def suspend_manager(manager_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.users.update_one({"_id": ObjectId(manager_id), "role": "manager"}, {"$set": {"active": False}})
    await log_activity(db, user, "manager.suspend", "user", manager_id, request=request)
    return {"success": True}


@router.post("/{manager_id}/activate")
async def activate_manager(manager_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.users.update_one({"_id": ObjectId(manager_id), "role": "manager"}, {"$set": {"active": True}})
    await log_activity(db, user, "manager.activate", "user", manager_id, request=request)
    return {"success": True}


@router.post("/{manager_id}/reset-password")
async def reset_manager_password(manager_id: str, payload: ResetIn, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.users.update_one({"_id": ObjectId(manager_id), "role": "manager"}, {"$set": {"password_hash": hash_password(payload.new_password)}})
    await log_activity(db, user, "manager.reset_password", "user", manager_id, request=request)
    return {"success": True}


@router.delete("/{manager_id}")
async def delete_manager(manager_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    m = await db.users.find_one({"_id": ObjectId(manager_id), "role": "manager"})
    if not m:
        raise HTTPException(404, "Manager not found")
    await db.users.delete_one({"_id": ObjectId(manager_id)})
    if m.get("company_id"):
        await db.companies.update_one({"_id": ObjectId(m["company_id"])}, {"$pull": {"manager_ids": manager_id}})
    await log_activity(db, user, "manager.delete", "user", manager_id, request=request)
    return {"success": True}


@router.post("/{manager_id}/impersonate")
async def impersonate(manager_id: str, request: Request, user: dict = Depends(require_super_admin)):
    """Super Admin acts as a manager for support/debugging (issues a short-lived token)."""
    db = get_db()
    m = await db.users.find_one({"_id": ObjectId(manager_id), "role": "manager"})
    if not m:
        raise HTTPException(404, "Manager not found")
    access = create_access_token(str(m["_id"]), "manager")
    refresh = create_refresh_token(str(m["_id"]))
    await log_activity(db, user, "manager.impersonate", "user", manager_id, request=request)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": {
            "id": str(m["_id"]),
            "name": m.get("name"),
            "email": m.get("email"),
            "role": "manager",
            "company_id": m.get("company_id"),
            "avatar": m.get("avatar"),
        },
    }
