"""Companies management (Super Admin only)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

from core.db import get_db
from core.deps import require_super_admin
from core.utils import now_iso, slugify, log_activity

router = APIRouter(prefix="/api/companies", tags=["companies"])


class CompanyIn(BaseModel):
    name: str = Field(min_length=1)
    logo: Optional[str] = None
    brand_color: str = "#FF3B30"
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    brand_color: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


def _serialize(c: dict) -> dict:
    return {
        "id": str(c["_id"]) if "_id" in c else c.get("id"),
        "name": c.get("name"),
        "slug": c.get("slug"),
        "logo": c.get("logo"),
        "brand_color": c.get("brand_color"),
        "description": c.get("description"),
        "website": c.get("website"),
        "email": c.get("email"),
        "phone": c.get("phone"),
        "status": c.get("status", "active"),
        "manager_ids": c.get("manager_ids", []),
        "created_at": c.get("created_at"),
    }


@router.get("")
async def list_companies(user: dict = Depends(require_super_admin), q: str = "", status: str = ""):
    db = get_db()
    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if status:
        query["status"] = status
    docs = await db.companies.find(query).sort("created_at", -1).to_list(500)
    # Enrich with counts
    out = []
    for c in docs:
        c_id = str(c["_id"])
        qr_count = await db.qrcodes.count_documents({"company_id": c_id, "status": {"$ne": "deleted"}})
        scans = await db.scans.count_documents({"company_id": c_id})
        s = _serialize(c)
        s["qr_count"] = qr_count
        s["total_scans"] = scans
        out.append(s)
    return out


@router.post("")
async def create_company(payload: CompanyIn, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    slug = slugify(payload.name)
    # ensure uniqueness
    base = slug
    i = 1
    while await db.companies.find_one({"slug": slug}):
        slug = f"{base}-{i}"
        i += 1
    doc = {**payload.model_dump(), "slug": slug, "status": "active", "manager_ids": [], "created_at": now_iso()}
    res = await db.companies.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, user, "company.create", "company", str(res.inserted_id), {"name": payload.name}, request=request)
    return _serialize(doc)


@router.get("/{company_id}")
async def get_company(company_id: str, user: dict = Depends(require_super_admin)):
    db = get_db()
    c = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not c:
        raise HTTPException(404, "Company not found")
    return _serialize(c)


@router.patch("/{company_id}")
async def update_company(company_id: str, payload: CompanyUpdate, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": updates})
    c = await db.companies.find_one({"_id": ObjectId(company_id)})
    await log_activity(db, user, "company.update", "company", company_id, updates, request=request)
    return _serialize(c)


@router.post("/{company_id}/suspend")
async def suspend_company(company_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": {"status": "suspended"}})
    await log_activity(db, user, "company.suspend", "company", company_id, request=request)
    return {"success": True}


@router.post("/{company_id}/activate")
async def activate_company(company_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": {"status": "active"}})
    await log_activity(db, user, "company.activate", "company", company_id, request=request)
    return {"success": True}


@router.delete("/{company_id}")
async def delete_company(company_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    await db.companies.delete_one({"_id": ObjectId(company_id)})
    # Cascade: mark QR as deleted, detach managers
    await db.qrcodes.update_many({"company_id": company_id}, {"$set": {"status": "deleted"}})
    await db.users.update_many({"company_id": company_id, "role": "manager"}, {"$set": {"company_id": None, "active": False}})
    await log_activity(db, user, "company.delete", "company", company_id, request=request)
    return {"success": True}
