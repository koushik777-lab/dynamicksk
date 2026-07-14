"""QR CRUD & customization + list/filter/pause/resume/delete."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, Any
from io import BytesIO
import qrcode
from qrcode.image.svg import SvgPathImage

from core.db import get_db
from core.deps import get_current_user, require_super_admin
from core.security import gen_short_code
from core.utils import now_iso, log_activity
from core.qr_builder import build_content, make_qr_png

router = APIRouter(prefix="/api/qr", tags=["qr"])

VALID_TYPES = {
    "url", "website", "text", "email", "sms", "phone", "whatsapp", "wifi", "vcard", "business_card",
    "pdf", "image", "video", "audio", "app_store", "play_store", "location", "google_maps", "google_review",
    "youtube", "facebook", "instagram", "linkedin", "twitter", "telegram",
    "menu", "coupon", "feedback", "multi_link", "crypto",
}

DEFAULT_DESIGN = {
    "pattern": "square",
    "corner": "square",
    "fg_color": "#0A0A0A",
    "fg_color_end": "#0A0A0A",
    "bg_color": "#FFFFFF",
    "gradient": "none",
    "padding": 2,
    "error_correction": "H",
    "logo_url": None,
    "frame": {"style": "none", "text": "SCAN ME", "color": "#0A0A0A"},
}


class QRIn(BaseModel):
    name: str = Field(min_length=1)
    type: str
    data: dict = Field(default_factory=dict)
    is_dynamic: bool = True
    company_id: str
    manager_id: Optional[str] = None
    folder_id: Optional[str] = None
    design: dict = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    password: Optional[str] = None
    expiry: Optional[str] = None
    scan_limit: Optional[int] = None


class QRUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[dict] = None
    design: Optional[dict] = None
    folder_id: Optional[str] = None
    manager_id: Optional[str] = None
    favorite: Optional[bool] = None
    tags: Optional[list[str]] = None
    password: Optional[str] = None
    expiry: Optional[str] = None
    scan_limit: Optional[int] = None


def _serialize(q: dict, extra: dict | None = None) -> dict:
    o = {
        "id": str(q["_id"]) if "_id" in q else q.get("id"),
        "name": q.get("name"),
        "type": q.get("type"),
        "data": q.get("data", {}),
        "is_dynamic": q.get("is_dynamic", True),
        "short_code": q.get("short_code"),
        "content": q.get("content"),
        "company_id": q.get("company_id"),
        "manager_id": q.get("manager_id"),
        "folder_id": q.get("folder_id"),
        "status": q.get("status", "active"),
        "favorite": q.get("favorite", False),
        "tags": q.get("tags", []),
        "design": {**DEFAULT_DESIGN, **(q.get("design") or {})},
        "password": q.get("password"),
        "expiry": q.get("expiry"),
        "scan_limit": q.get("scan_limit"),
        "created_at": q.get("created_at"),
        "updated_at": q.get("updated_at"),
        "created_by": q.get("created_by"),
        "version": q.get("version", 1),
        "scan_count": q.get("scan_count", 0),
    }
    if extra:
        o.update(extra)
    return o


async def _scope_query(user: dict, base: dict) -> dict:
    q = dict(base)
    if user["role"] == "manager":
        q["manager_id"] = user["id"]
    return q


@router.get("")
async def list_qr(
    user: dict = Depends(get_current_user),
    q: str = "",
    status: str = "",
    company_id: str = "",
    manager_id: str = "",
    folder_id: str = "",
    favorite: Optional[bool] = None,
    type: str = "",
    tag: str = "",
    limit: int = 200,
):
    db = get_db()
    base: dict[str, Any] = {}
    if user["role"] == "manager":
        base["manager_id"] = user["id"]
        base["status"] = {"$ne": "deleted"}
    else:
        if company_id:
            base["company_id"] = company_id
        if manager_id:
            base["manager_id"] = manager_id
    if status:
        base["status"] = status
    elif "status" not in base:
        base["status"] = {"$ne": "deleted"}
    if folder_id:
        base["folder_id"] = folder_id if folder_id != "root" else None
    if favorite is not None:
        base["favorite"] = favorite
    if type:
        base["type"] = type
    if tag:
        base["tags"] = tag
    if q:
        base["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"data.url": {"$regex": q, "$options": "i"}}]

    docs = await db.qrcodes.find(base).sort("created_at", -1).limit(limit).to_list(limit)
    return [_serialize(d) for d in docs]


@router.post("")
async def create_qr(payload: QRIn, request: Request, user: dict = Depends(require_super_admin)):
    if payload.type not in VALID_TYPES:
        raise HTTPException(400, f"Invalid QR type '{payload.type}'")
    db = get_db()
    # Company must exist
    if not await db.companies.find_one({"_id": ObjectId(payload.company_id)}):
        raise HTTPException(400, "Invalid company_id")
    # Manager (optional)
    if payload.manager_id:
        m = await db.users.find_one({"_id": ObjectId(payload.manager_id), "role": "manager"})
        if not m:
            raise HTTPException(400, "Invalid manager_id")
    short_code = gen_short_code()
    while await db.qrcodes.find_one({"short_code": short_code}):
        short_code = gen_short_code()
    content = build_content(payload.type, payload.data)
    doc = {
        "name": payload.name,
        "type": payload.type,
        "data": payload.data,
        "is_dynamic": payload.is_dynamic,
        "short_code": short_code,
        "content": content,
        "company_id": payload.company_id,
        "manager_id": payload.manager_id,
        "folder_id": payload.folder_id,
        "design": {**DEFAULT_DESIGN, **payload.design},
        "status": "active",
        "favorite": False,
        "tags": payload.tags,
        "password": payload.password,
        "expiry": payload.expiry,
        "scan_limit": payload.scan_limit,
        "scan_count": 0,
        "version": 1,
        "version_history": [],
        "created_by": user["id"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    res = await db.qrcodes.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, user, "qr.create", "qr", str(res.inserted_id), {"name": payload.name, "type": payload.type}, request=request)
    return _serialize(doc)


@router.get("/{qr_id}")
async def get_qr(qr_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "QR not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    return _serialize(q)


@router.patch("/{qr_id}")
async def update_qr(qr_id: str, payload: QRUpdate, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "QR not found")
    # Manager restrictions: can edit URL/data, favorite, folder, name; NOT reassign or change type
    if user["role"] == "manager":
        if q.get("manager_id") != user["id"]:
            raise HTTPException(403, "Not your QR")
        allowed = {"name", "data", "design", "folder_id", "favorite", "tags", "password", "expiry", "scan_limit"}
        payload_dict = {k: v for k, v in payload.model_dump().items() if v is not None and k in allowed}
    else:
        payload_dict = {k: v for k, v in payload.model_dump().items() if v is not None}

    updates: dict[str, Any] = {}
    # Save version history if data or design changed
    push_hist = None
    if "data" in payload_dict and payload_dict["data"] is not None:
        updates["data"] = payload_dict["data"]
        updates["content"] = build_content(q.get("type", "url"), payload_dict["data"])
        push_hist = {"version": q.get("version", 1), "data": q.get("data", {}), "design": q.get("design", {}), "content": q.get("content"), "at": q.get("updated_at")}
    if "design" in payload_dict and payload_dict["design"] is not None:
        updates["design"] = {**DEFAULT_DESIGN, **(q.get("design") or {}), **payload_dict["design"]}
        if push_hist is None:
            push_hist = {"version": q.get("version", 1), "data": q.get("data", {}), "design": q.get("design", {}), "content": q.get("content"), "at": q.get("updated_at")}
    for k in ("name", "folder_id", "favorite", "tags", "password", "expiry", "scan_limit", "manager_id"):
        if k in payload_dict:
            updates[k] = payload_dict[k]
    updates["updated_at"] = now_iso()
    if push_hist:
        updates["version"] = q.get("version", 1) + 1

    ops = {"$set": updates}
    if push_hist:
        ops["$push"] = {"version_history": push_hist}
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, ops)
    new_doc = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    await log_activity(db, user, "qr.update", "qr", qr_id, {k: str(v)[:120] for k, v in updates.items()}, request=request)
    return _serialize(new_doc)


@router.post("/{qr_id}/pause")
async def pause_qr(qr_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, {"$set": {"status": "paused", "updated_at": now_iso()}})
    await log_activity(db, user, "qr.pause", "qr", qr_id, request=request)
    return {"success": True}


@router.post("/{qr_id}/resume")
async def resume_qr(qr_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, {"$set": {"status": "active", "updated_at": now_iso()}})
    await log_activity(db, user, "qr.resume", "qr", qr_id, request=request)
    return {"success": True}


@router.post("/{qr_id}/archive")
async def archive_qr(qr_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, {"$set": {"status": "archived", "updated_at": now_iso()}})
    await log_activity(db, user, "qr.archive", "qr", qr_id, request=request)
    return {"success": True}


@router.delete("/{qr_id}")
async def delete_qr(qr_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, {"$set": {"status": "deleted", "updated_at": now_iso()}})
    await log_activity(db, user, "qr.delete", "qr", qr_id, request=request)
    return {"success": True}


@router.post("/{qr_id}/restore")
async def restore_qr(qr_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    await db.qrcodes.update_one({"_id": ObjectId(qr_id)}, {"$set": {"status": "active", "updated_at": now_iso()}})
    await log_activity(db, user, "qr.restore", "qr", qr_id, request=request)
    return {"success": True}


@router.post("/{qr_id}/duplicate")
async def duplicate_qr(qr_id: str, request: Request, user: dict = Depends(require_super_admin)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    q.pop("_id", None)
    q["name"] = q.get("name", "") + " (copy)"
    code = gen_short_code()
    while await db.qrcodes.find_one({"short_code": code}):
        code = gen_short_code()
    q["short_code"] = code
    q["scan_count"] = 0
    q["version"] = 1
    q["version_history"] = []
    q["status"] = "active"
    q["created_at"] = now_iso()
    q["updated_at"] = now_iso()
    q["created_by"] = user["id"]
    res = await db.qrcodes.insert_one(q)
    q["_id"] = res.inserted_id
    await log_activity(db, user, "qr.duplicate", "qr", str(res.inserted_id), {"source": qr_id}, request=request)
    return _serialize(q)


def _redirect_url(short_code: str, request: Request) -> str:
    """Return the public /r/{code} link a scanner would hit."""
    import os
    base = os.environ.get("PUBLIC_BASE_URL")
    if not base:
        # Derive from request
        host = request.headers.get("host", "")
        proto = request.headers.get("x-forwarded-proto", "https")
        base = f"{proto}://{host}"
    return f"{base}/api/r/{short_code}"


@router.get("/{qr_id}/preview")
async def preview_qr(qr_id: str, request: Request, size: int = 512):
    """Public preview: renders the QR PNG. QR content is scannable by anyone anyway."""
    db = get_db()
    try:
        q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    except Exception:
        raise HTTPException(404, "Not found")
    if not q:
        raise HTTPException(404, "Not found")
    content = _redirect_url(q["short_code"], request) if q.get("is_dynamic", True) else q.get("content", "")
    png = make_qr_png(content, q.get("design") or DEFAULT_DESIGN, size=size)
    return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=60"})


class PreviewIn(BaseModel):
    type: str = "url"
    data: dict = Field(default_factory=dict)
    design: dict = Field(default_factory=dict)
    is_dynamic: bool = True
    size: int = 512


@router.post("/preview")
async def preview_dynamic(payload: PreviewIn, request: Request):
    content = build_content(payload.type, payload.data)
    if payload.is_dynamic:
        content = content or "https://qrnexus.io/r/preview"
    png = make_qr_png(content, {**DEFAULT_DESIGN, **payload.design}, size=payload.size)
    return Response(content=png, media_type="image/png")


@router.get("/{qr_id}/download")
async def download_qr(qr_id: str, request: Request, format: str = "png", size: int = 1024, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    content = _redirect_url(q["short_code"], request) if q.get("is_dynamic", True) else q.get("content", "")
    fmt = (format or "png").lower()
    await log_activity(db, user, "qr.download", "qr", qr_id, {"format": fmt}, request=request)
    if fmt == "svg":
        img = qrcode.make(content, image_factory=SvgPathImage)
        buf = BytesIO()
        img.save(buf)
        return Response(content=buf.getvalue(), media_type="image/svg+xml", headers={"Content-Disposition": f"attachment; filename=qr-{q['short_code']}.svg"})
    if fmt in ("png", "jpeg", "jpg", "webp"):
        png = make_qr_png(content, q.get("design") or DEFAULT_DESIGN, size=size)
        if fmt in ("jpeg", "jpg", "webp"):
            from PIL import Image
            im = Image.open(BytesIO(png)).convert("RGB" if fmt in ("jpeg", "jpg") else "RGBA")
            out = BytesIO()
            im.save(out, format=("JPEG" if fmt in ("jpeg", "jpg") else "WEBP"))
            return Response(content=out.getvalue(), media_type=f"image/{'jpeg' if fmt in ('jpeg','jpg') else 'webp'}", headers={"Content-Disposition": f"attachment; filename=qr-{q['short_code']}.{fmt}"})
        return Response(content=png, media_type="image/png", headers={"Content-Disposition": f"attachment; filename=qr-{q['short_code']}.png"})
    if fmt == "pdf":
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from PIL import Image
        png = make_qr_png(content, q.get("design") or DEFAULT_DESIGN, size=size)
        im = Image.open(BytesIO(png))
        tmp_buf = BytesIO()
        im.save(tmp_buf, format="PNG")
        tmp_buf.seek(0)
        pdf_buf = BytesIO()
        c = canvas.Canvas(pdf_buf, pagesize=A4)
        c.drawImage(__import__("reportlab.lib.utils", fromlist=["ImageReader"]).ImageReader(tmp_buf), 100, 300, width=400, height=400)
        c.setFont("Helvetica", 14)
        c.drawString(100, 720, f"QR Nexus • {q.get('name', '')}")
        c.setFont("Helvetica", 10)
        c.drawString(100, 260, f"Type: {q.get('type')} • Code: {q.get('short_code')}")
        c.showPage()
        c.save()
        return Response(content=pdf_buf.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=qr-{q['short_code']}.pdf"})
    raise HTTPException(400, "Unsupported format")


@router.get("/{qr_id}/history")
async def get_history(qr_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    q = await db.qrcodes.find_one({"_id": ObjectId(qr_id)})
    if not q:
        raise HTTPException(404, "Not found")
    if user["role"] == "manager" and q.get("manager_id") != user["id"]:
        raise HTTPException(403, "Not your QR")
    return {"current_version": q.get("version", 1), "history": q.get("version_history", [])}
