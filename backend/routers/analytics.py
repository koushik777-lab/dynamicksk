"""Analytics: scans breakdown per QR, per company, per user, and global."""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import Optional
from collections import Counter, defaultdict

from core.db import get_db
from core.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _parse_iso(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


async def _scope(user: dict, qr_id: Optional[str], company_id: Optional[str]) -> dict:
    match: dict = {}
    if qr_id:
        match["qr_id"] = qr_id
    if user["role"] == "manager":
        match["manager_id"] = user["id"]
    elif company_id:
        match["company_id"] = company_id
    return match


@router.get("/overview")
async def overview(
    user: dict = Depends(get_current_user),
    qr_id: Optional[str] = None,
    company_id: Optional[str] = None,
    days: int = 30,
):
    db = get_db()
    match = await _scope(user, qr_id, company_id)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    since_iso = since.isoformat()

    all_scans = await db.scans.find(match).to_list(50000)
    recent = [s for s in all_scans if s.get("timestamp", "") >= since_iso]

    # Timeline by day
    timeline_map: dict[str, int] = defaultdict(int)
    for s in recent:
        day = s["timestamp"][:10]
        timeline_map[day] += 1
    timeline = []
    for i in range(days - 1, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        timeline.append({"date": d, "scans": timeline_map.get(d, 0)})

    # Breakdowns
    countries = Counter(s.get("country", "Unknown") for s in recent).most_common(10)
    cities = Counter(s.get("city", "Unknown") for s in recent).most_common(10)
    devices = Counter(s.get("device", "Unknown") for s in all_scans).most_common(10)
    browsers = Counter((s.get("browser") or "Unknown").split(" ")[0] for s in all_scans).most_common(10)
    oss = Counter((s.get("os") or "Unknown").split(" ")[0] for s in all_scans).most_common(10)
    languages = Counter((s.get("language") or "Unknown").split("-")[0] for s in all_scans).most_common(10)
    referrers = Counter((s.get("referrer") or "Direct").split("?")[0][:60] or "Direct" for s in all_scans).most_common(10)

    # Unique visitors (by IP)
    unique_ips = len({s.get("ip", "") for s in all_scans if s.get("ip")})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_scans = sum(1 for s in all_scans if s.get("timestamp", "").startswith(today))
    live_count = sum(1 for s in all_scans if s.get("timestamp", "") > (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat())

    world_map = defaultdict(int)
    for s in recent:
        cc = s.get("country_code") or "XX"
        world_map[cc] += 1

    return {
        "total_scans": len(all_scans),
        "recent_scans": len(recent),
        "today_scans": today_scans,
        "unique_visitors": unique_ips,
        "live_visitors": live_count,
        "timeline": timeline,
        "countries": [{"name": n, "value": v} for n, v in countries],
        "cities": [{"name": n, "value": v} for n, v in cities],
        "devices": [{"name": n, "value": v} for n, v in devices],
        "browsers": [{"name": n, "value": v} for n, v in browsers],
        "os": [{"name": n, "value": v} for n, v in oss],
        "languages": [{"name": n, "value": v} for n, v in languages],
        "referrers": [{"name": n, "value": v} for n, v in referrers],
        "world_map": [{"code": k, "value": v} for k, v in world_map.items()],
    }


@router.get("/recent-scans")
async def recent_scans(user: dict = Depends(get_current_user), qr_id: Optional[str] = None, limit: int = 50):
    db = get_db()
    match = await _scope(user, qr_id, None)
    docs = await db.scans.find(match).sort("timestamp", -1).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@router.get("/top-qr")
async def top_qr(user: dict = Depends(get_current_user), limit: int = 10):
    db = get_db()
    query = {"status": {"$ne": "deleted"}}
    if user["role"] == "manager":
        query["manager_id"] = user["id"]
    docs = await db.qrcodes.find(query).sort("scan_count", -1).limit(limit).to_list(limit)
    return [
        {"id": str(d["_id"]), "name": d.get("name"), "type": d.get("type"), "scan_count": d.get("scan_count", 0), "short_code": d.get("short_code")}
        for d in docs
    ]


@router.get("/export")
async def export_scans(user: dict = Depends(get_current_user), qr_id: Optional[str] = None, format: str = "csv"):
    """Export scan data as CSV."""
    from fastapi.responses import Response
    import csv
    from io import StringIO
    db = get_db()
    match = await _scope(user, qr_id, None)
    docs = await db.scans.find(match).sort("timestamp", -1).to_list(50000)
    out = StringIO()
    writer = csv.writer(out)
    writer.writerow(["Timestamp", "Country", "City", "Device", "Browser", "OS", "Language", "Referrer", "IP"])
    for s in docs:
        writer.writerow([
            s.get("timestamp"), s.get("country"), s.get("city"), s.get("device"),
            s.get("browser"), s.get("os"), s.get("language"), s.get("referrer"), s.get("ip"),
        ])
    return Response(content=out.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=scans-{qr_id or 'all'}.csv"})
