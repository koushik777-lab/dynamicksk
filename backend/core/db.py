"""MongoDB connection, indexes, and Super Admin seed."""
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from core.security import hash_password, verify_password

_client: AsyncIOMotorClient | None = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _client[os.environ["DB_NAME"]]
    return _db


async def close_db():
    global _client
    if _client:
        _client.close()


async def ensure_indexes():
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.companies.create_index("slug", unique=True)
    await db.qrcodes.create_index("short_code", unique=True)
    await db.qrcodes.create_index("company_id")
    await db.qrcodes.create_index("manager_id")
    await db.qrcodes.create_index("created_at")
    await db.scans.create_index("qr_id")
    await db.scans.create_index("timestamp")
    await db.folders.create_index([("owner_id", 1), ("name", 1)])
    await db.activity_logs.create_index("timestamp")
    await db.activity_logs.create_index("actor_id")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)


async def seed_super_admin():
    """Create the single Super Admin on first startup."""
    db = get_db()
    email = os.environ["ADMIN_EMAIL"].lower().strip()
    password = os.environ["ADMIN_PASSWORD"]
    name = os.environ.get("ADMIN_NAME", "Super Admin")

    existing = await db.users.find_one({"role": "super_admin"})
    if existing is None:
        await db.users.insert_one({
            "email": email,
            "password_hash": hash_password(password),
            "name": name,
            "role": "super_admin",
            "avatar": None,
            "active": True,
            "protected": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
        })
        print(f"[seed] Super Admin created: {email}")
    else:
        # Keep credentials in sync with env in case they changed
        if not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"password_hash": hash_password(password), "email": email, "name": name}},
            )
            print(f"[seed] Super Admin credentials updated for {email}")


def oid(v: str) -> ObjectId:
    return ObjectId(v)


def to_id(doc: dict) -> dict:
    """Convert Mongo _id to id string; return doc without password_hash."""
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc
