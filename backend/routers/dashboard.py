"""Dashboard stats (super admin & manager)."""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from core.db import get_db
from core.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    month_start = now.replace(day=1).strftime("%Y-%m-%d")

    if user["role"] == "super_admin":
        total_companies = await db.companies.count_documents({})
        active_companies = await db.companies.count_documents({"status": "active"})
        total_managers = await db.users.count_documents({"role": "manager"})
        total_qr = await db.qrcodes.count_documents({"status": {"$ne": "deleted"}})
        active_qr = await db.qrcodes.count_documents({"status": "active"})
        paused_qr = await db.qrcodes.count_documents({"status": "paused"})
        deleted_qr = await db.qrcodes.count_documents({"status": "deleted"})
        total_scans = await db.scans.count_documents({})
        today_scans = await db.scans.count_documents({"timestamp": {"$gte": today}})
        month_scans = await db.scans.count_documents({"timestamp": {"$gte": month_start}})
        # Recent activities
        activities = await db.activity_logs.find({}).sort("timestamp", -1).limit(10).to_list(10)
        for a in activities:
            a["id"] = str(a.pop("_id"))
        recent_companies = await db.companies.find({}).sort("created_at", -1).limit(5).to_list(5)
        recent_companies = [{"id": str(c["_id"]), "name": c.get("name"), "logo": c.get("logo"), "status": c.get("status", "active"), "created_at": c.get("created_at")} for c in recent_companies]
        recent_qr = await db.qrcodes.find({"status": {"$ne": "deleted"}}).sort("created_at", -1).limit(5).to_list(5)
        recent_qr = [{"id": str(q["_id"]), "name": q.get("name"), "type": q.get("type"), "short_code": q.get("short_code"), "created_at": q.get("created_at"), "scan_count": q.get("scan_count", 0)} for q in recent_qr]
        return {
            "role": "super_admin",
            "total_companies": total_companies,
            "active_companies": active_companies,
            "total_managers": total_managers,
            "total_qr": total_qr,
            "active_qr": active_qr,
            "paused_qr": paused_qr,
            "deleted_qr": deleted_qr,
            "total_scans": total_scans,
            "today_scans": today_scans,
            "month_scans": month_scans,
            "revenue": 0,  # placeholder
            "activities": activities,
            "recent_companies": recent_companies,
            "recent_qr": recent_qr,
        }

    # Manager
    q_scope = {"manager_id": user["id"], "status": {"$ne": "deleted"}}
    total_qr = await db.qrcodes.count_documents(q_scope)
    active_qr = await db.qrcodes.count_documents({**q_scope, "status": "active"})
    paused_qr = await db.qrcodes.count_documents({"manager_id": user["id"], "status": "paused"})
    total_scans = await db.scans.count_documents({"manager_id": user["id"]})
    today_scans = await db.scans.count_documents({"manager_id": user["id"], "timestamp": {"$gte": today}})
    month_scans = await db.scans.count_documents({"manager_id": user["id"], "timestamp": {"$gte": month_start}})
    recent_qr = await db.qrcodes.find(q_scope).sort("created_at", -1).limit(5).to_list(5)
    recent_qr = [{"id": str(q["_id"]), "name": q.get("name"), "type": q.get("type"), "short_code": q.get("short_code"), "created_at": q.get("created_at"), "scan_count": q.get("scan_count", 0)} for q in recent_qr]
    company = None
    if user.get("company_id"):
        try:
            company = await db.companies.find_one({"_id": ObjectId(user["company_id"])})
            if company:
                company = {"id": str(company["_id"]), "name": company.get("name"), "logo": company.get("logo"), "brand_color": company.get("brand_color")}
        except Exception:
            company = None
    return {
        "role": "manager",
        "company": company,
        "total_qr": total_qr,
        "active_qr": active_qr,
        "paused_qr": paused_qr,
        "total_scans": total_scans,
        "today_scans": today_scans,
        "month_scans": month_scans,
        "recent_qr": recent_qr,
    }


@router.get("/search")
async def global_search(user: dict = Depends(get_current_user), q: str = ""):
    db = get_db()
    if not q or len(q) < 2:
        return {"companies": [], "managers": [], "qr": []}
    regex = {"$regex": q, "$options": "i"}
    out = {"companies": [], "managers": [], "qr": []}
    if user["role"] == "super_admin":
        cs = await db.companies.find({"name": regex}).limit(5).to_list(5)
        out["companies"] = [{"id": str(c["_id"]), "name": c.get("name"), "slug": c.get("slug")} for c in cs]
        ms = await db.users.find({"role": "manager", "$or": [{"name": regex}, {"email": regex}]}).limit(5).to_list(5)
        out["managers"] = [{"id": str(m["_id"]), "name": m.get("name"), "email": m.get("email")} for m in ms]
    qq_scope = {"$or": [{"name": regex}, {"short_code": regex}], "status": {"$ne": "deleted"}}
    if user["role"] == "manager":
        qq_scope["manager_id"] = user["id"]
    qs = await db.qrcodes.find(qq_scope).limit(10).to_list(10)
    out["qr"] = [{"id": str(q_["_id"]), "name": q_.get("name"), "type": q_.get("type"), "short_code": q_.get("short_code")} for q_ in qs]
    return out
