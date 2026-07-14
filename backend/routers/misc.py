"""Folders, activity logs, and file uploads."""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

from core.db import get_db
from core.deps import get_current_user, require_super_admin
from core.utils import now_iso, log_activity

folders_router = APIRouter(prefix="/api/folders", tags=["folders"])
logs_router = APIRouter(prefix="/api/activity", tags=["activity"])
uploads_router = APIRouter(prefix="/api/uploads", tags=["uploads"])


class FolderIn(BaseModel):
    name: str = Field(min_length=1)
    parent_id: Optional[str] = None
    color: Optional[str] = None


@folders_router.get("")
async def list_folders(user: dict = Depends(get_current_user)):
    db = get_db()
    query = {"owner_id": user["id"]}
    docs = await db.folders.find(query).sort("created_at", -1).to_list(500)
    return [{"id": str(d["_id"]), "name": d.get("name"), "parent_id": d.get("parent_id"), "color": d.get("color"), "created_at": d.get("created_at")} for d in docs]


@folders_router.post("")
async def create_folder(payload: FolderIn, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {"owner_id": user["id"], "name": payload.name, "parent_id": payload.parent_id, "color": payload.color, "created_at": now_iso()}
    res = await db.folders.insert_one(doc)
    return {"id": str(res.inserted_id), **{k: v for k, v in doc.items() if k != "_id"}}


@folders_router.patch("/{folder_id}")
async def update_folder(folder_id: str, payload: FolderIn, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.folders.update_one({"_id": ObjectId(folder_id), "owner_id": user["id"]}, {"$set": payload.model_dump(exclude_unset=True)})
    d = await db.folders.find_one({"_id": ObjectId(folder_id)})
    return {"id": str(d["_id"]), "name": d.get("name"), "parent_id": d.get("parent_id"), "color": d.get("color")}


@folders_router.delete("/{folder_id}")
async def delete_folder(folder_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.folders.delete_one({"_id": ObjectId(folder_id), "owner_id": user["id"]})
    await db.qrcodes.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None}})
    return {"success": True}


@logs_router.get("")
async def list_logs(user: dict = Depends(get_current_user), limit: int = 100):
    db = get_db()
    query = {}
    if user["role"] == "manager":
        query["actor_id"] = user["id"]
    docs = await db.activity_logs.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@uploads_router.post("")
async def upload_file(request: Request, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only images allowed")
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "png").lower()
    if ext not in ("png", "jpg", "jpeg", "webp", "svg"):
        ext = "png"
    name = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / name
    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 2MB)")
    path.write_bytes(data)
    url = f"/uploads/{name}"
    return {"url": url, "filename": name, "size": len(data)}


@uploads_router.get("/{filename}")
async def get_upload(filename: str):
    """Also exposed at /uploads/{filename} via public mount for QR consumption."""
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Not found")
    return FileResponse(path)
