"""Utility helpers: activity logging, request info parsing."""
from datetime import datetime, timezone
from fastapi import Request
from user_agents import parse as ua_parse
import re


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug[:50] or "company"


def parse_request(request: Request) -> dict:
    ua_string = request.headers.get("user-agent", "")
    ua = ua_parse(ua_string) if ua_string else None
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "")
    return {
        "ip": ip,
        "user_agent": ua_string,
        "browser": f"{ua.browser.family} {ua.browser.version_string}".strip() if ua else "",
        "os": f"{ua.os.family} {ua.os.version_string}".strip() if ua else "",
        "device": "Mobile" if (ua and ua.is_mobile) else ("Tablet" if (ua and ua.is_tablet) else ("Bot" if (ua and ua.is_bot) else "Desktop")),
        "language": (request.headers.get("accept-language", "").split(",")[0] or ""),
        "referrer": request.headers.get("referer", ""),
    }


async def log_activity(db, actor: dict, action: str, entity_type: str = "", entity_id: str = "", details: dict | None = None, request: Request | None = None):
    doc = {
        "actor_id": actor.get("id") if actor else None,
        "actor_email": actor.get("email") if actor else None,
        "actor_role": actor.get("role") if actor else None,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details or {},
        "ip": (parse_request(request)["ip"] if request else ""),
        "timestamp": now_iso(),
    }
    await db.activity_logs.insert_one(doc)


async def geo_lookup(ip: str) -> dict:
    """Free IP geo via ip-api.com. Returns country/city/region/lat/lon."""
    if not ip or ip in ("127.0.0.1", "::1") or ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172."):
        return {"country": "Local", "country_code": "LO", "city": "Local", "region": "", "lat": 0, "lon": 0}
    try:
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,regionName,city,lat,lon")
            if r.status_code == 200:
                d = r.json()
                if d.get("status") == "success":
                    return {
                        "country": d.get("country", "Unknown"),
                        "country_code": d.get("countryCode", "XX"),
                        "region": d.get("regionName", ""),
                        "city": d.get("city", "Unknown"),
                        "lat": d.get("lat", 0),
                        "lon": d.get("lon", 0),
                    }
    except Exception:
        pass
    return {"country": "Unknown", "country_code": "XX", "city": "Unknown", "region": "", "lat": 0, "lon": 0}
