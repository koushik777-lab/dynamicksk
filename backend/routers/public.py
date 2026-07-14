"""Public QR redirect + scan tracking (no auth)."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from datetime import datetime, timezone
from bson import ObjectId

from core.db import get_db
from core.utils import parse_request, geo_lookup, now_iso
from core.qr_builder import build_content

router = APIRouter(prefix="/api/r", tags=["public"])


@router.get("/{short_code}")
async def redirect_qr(short_code: str, request: Request):
    db = get_db()
    q = await db.qrcodes.find_one({"short_code": short_code})
    if not q:
        return HTMLResponse(_status_page("QR Not Found", "The QR code you scanned does not exist or has been removed."), status_code=404)

    status = q.get("status", "active")
    if status == "paused":
        return HTMLResponse(_status_page("QR Paused", "This QR is temporarily paused by its owner."), status_code=200)
    if status in ("deleted", "archived"):
        return HTMLResponse(_status_page("QR Unavailable", "This QR is no longer active."), status_code=410)

    # Expiry
    if q.get("expiry"):
        try:
            expiry_dt = datetime.fromisoformat(q["expiry"].replace("Z", "+00:00"))
            if expiry_dt < datetime.now(timezone.utc):
                return HTMLResponse(_status_page("QR Expired", "This QR has passed its expiry date."), status_code=410)
        except Exception:
            pass

    # Scan limit
    if q.get("scan_limit") and q.get("scan_count", 0) >= q.get("scan_limit"):
        return HTMLResponse(_status_page("Scan Limit Reached", "This QR has reached its maximum number of scans."), status_code=410)

    # Record scan quickly — geo lookup runs in background to keep redirect fast
    info = parse_request(request)
    scan_doc = {
        "qr_id": str(q["_id"]),
        "company_id": q.get("company_id"),
        "manager_id": q.get("manager_id"),
        "timestamp": now_iso(),
        "ip": info["ip"],
        "user_agent": info["user_agent"],
        "browser": info["browser"],
        "os": info["os"],
        "device": info["device"],
        "language": info["language"],
        "referrer": info["referrer"],
        "country": "Unknown",
        "country_code": "XX",
        "region": "",
        "city": "Unknown",
        "lat": 0,
        "lon": 0,
    }
    res_scan = await db.scans.insert_one(scan_doc)
    await db.qrcodes.update_one({"_id": q["_id"]}, {"$inc": {"scan_count": 1}, "$set": {"last_scanned_at": now_iso()}})

    # Fire-and-forget geo enrichment
    import asyncio
    async def _enrich(scan_id, ip):
        try:
            geo = await geo_lookup(ip)
            await db.scans.update_one({"_id": scan_id}, {"$set": geo})
        except Exception:
            pass
    asyncio.create_task(_enrich(res_scan.inserted_id, info["ip"]))

    # Build target URL
    if q.get("is_dynamic", True):
        target = build_content(q.get("type", "url"), q.get("data") or {})
    else:
        target = q.get("content", "")

    if not target:
        return HTMLResponse(_status_page("QR Not Configured", "This QR has no destination set."), status_code=200)

    # For non-URL types (wifi/vcard/text) show a landing page
    if not (target.startswith("http://") or target.startswith("https://") or target.startswith("mailto:") or target.startswith("tel:") or target.startswith("sms:") or target.startswith("geo:")):
        return HTMLResponse(_content_page(q.get("name", "QR Content"), target), status_code=200)

    return RedirectResponse(url=target, status_code=302)


def _status_page(title: str, message: str) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset='utf-8'><title>{title}</title><meta name='viewport' content='width=device-width,initial-scale=1'>
<style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
.card{{background:#111;border:1px solid rgba(255,255,255,.12);padding:48px;max-width:480px;text-align:left}}
h1{{font-family:'Outfit',sans-serif;font-size:32px;margin:0 0 12px;letter-spacing:-.02em}} p{{color:#a1a1aa;line-height:1.6;margin:0}}
.brand{{color:#FF3B30;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px}}</style></head>
<body><div class='card'><div class='brand'>QR NEXUS</div><h1>{title}</h1><p>{message}</p></div></body></html>"""


def _content_page(title: str, content: str) -> str:
    safe = content.replace("<", "&lt;").replace(">", "&gt;")
    return f"""<!DOCTYPE html><html><head><meta charset='utf-8'><title>{title}</title><meta name='viewport' content='width=device-width,initial-scale=1'>
<style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}}
.card{{background:#111;border:1px solid rgba(255,255,255,.12);padding:40px;max-width:560px;width:100%}}
h1{{font-family:'Outfit',sans-serif;font-size:28px;margin:0 0 16px;letter-spacing:-.02em}}
pre{{color:#e5e5e5;line-height:1.6;white-space:pre-wrap;word-break:break-all;font-family:'JetBrains Mono',monospace;font-size:14px;margin:0;padding:20px;background:#050505;border:1px solid rgba(255,255,255,.08)}}
.brand{{color:#FF3B30;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px}}</style></head>
<body><div class='card'><div class='brand'>QR NEXUS</div><h1>{title}</h1><pre>{safe}</pre></div></body></html>"""
