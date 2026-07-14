"""Convert QR content types + design payloads into a rendered PNG/SVG bytes."""
from io import BytesIO
from typing import Literal
import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_M, ERROR_CORRECT_L, ERROR_CORRECT_Q
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import (
    SquareModuleDrawer,
    RoundedModuleDrawer,
    CircleModuleDrawer,
    GappedSquareModuleDrawer,
    VerticalBarsDrawer,
    HorizontalBarsDrawer,
)
from qrcode.image.styles.colormasks import (
    SolidFillColorMask,
    RadialGradiantColorMask,
    SquareGradiantColorMask,
    VerticalGradiantColorMask,
    HorizontalGradiantColorMask,
)
from PIL import Image


PATTERN_MAP = {
    "square": SquareModuleDrawer,
    "rounded": RoundedModuleDrawer,
    "dots": CircleModuleDrawer,
    "circle": CircleModuleDrawer,
    "gapped": GappedSquareModuleDrawer,
    "vertical": VerticalBarsDrawer,
    "horizontal": HorizontalBarsDrawer,
}


def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    hex_str = (hex_str or "#000000").lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join(c * 2 for c in hex_str)
    return tuple(int(hex_str[i:i + 2], 16) for i in (0, 2, 4))


def build_content(qr_type: str, data: dict) -> str:
    """Convert typed data payload into the encoded QR content string."""
    t = (qr_type or "url").lower()
    if t in ("url", "website", "pdf", "image", "video", "audio", "app_store", "play_store", "google_review", "google_maps", "youtube", "facebook", "instagram", "linkedin", "twitter", "telegram", "multi_link", "menu", "coupon", "feedback"):
        return (data.get("url") or "").strip()
    if t == "text":
        return data.get("text", "")
    if t == "email":
        to = data.get("to", "")
        subj = data.get("subject", "")
        body = data.get("body", "")
        return f"mailto:{to}?subject={subj}&body={body}"
    if t == "sms":
        return f"SMSTO:{data.get('phone', '')}:{data.get('message', '')}"
    if t == "phone":
        return f"tel:{data.get('phone', '')}"
    if t == "whatsapp":
        return f"https://wa.me/{data.get('phone', '').lstrip('+')}?text={data.get('message', '')}"
    if t == "wifi":
        ssid = data.get("ssid", "")
        password = data.get("password", "")
        enc = data.get("encryption", "WPA")
        hidden = "true" if data.get("hidden") else "false"
        return f"WIFI:T:{enc};S:{ssid};P:{password};H:{hidden};;"
    if t in ("vcard", "business_card"):
        name = data.get("name", "")
        org = data.get("organization", "")
        title = data.get("title", "")
        phone = data.get("phone", "")
        email = data.get("email", "")
        website = data.get("website", "")
        address = data.get("address", "")
        return (
            "BEGIN:VCARD\nVERSION:3.0\n"
            f"FN:{name}\nORG:{org}\nTITLE:{title}\n"
            f"TEL:{phone}\nEMAIL:{email}\nURL:{website}\nADR:{address}\nEND:VCARD"
        )
    if t == "location":
        return f"geo:{data.get('lat', 0)},{data.get('lng', 0)}"
    if t == "crypto":
        coin = (data.get("coin") or "bitcoin").lower()
        addr = data.get("address", "")
        return f"{coin}:{addr}"
    return data.get("url") or data.get("text") or ""


def make_qr_png(content: str, design: dict, size: int = 512) -> bytes:
    ec_map = {"L": ERROR_CORRECT_L, "M": ERROR_CORRECT_M, "Q": ERROR_CORRECT_Q, "H": ERROR_CORRECT_H}
    ec = ec_map.get((design.get("error_correction") or "H").upper(), ERROR_CORRECT_H)

    qr = qrcode.QRCode(
        version=None,
        error_correction=ec,
        box_size=10,
        border=int(design.get("padding", 2)),
    )
    qr.add_data(content or " ")
    qr.make(fit=True)

    pattern = (design.get("pattern") or "square").lower()
    drawer_cls = PATTERN_MAP.get(pattern, SquareModuleDrawer)

    fg = hex_to_rgb(design.get("fg_color", "#0A0A0A"))
    bg_hex = design.get("bg_color", "#FFFFFF")
    fg_end = hex_to_rgb(design.get("fg_color_end", design.get("fg_color", "#0A0A0A")))
    grad_type = (design.get("gradient") or "none").lower()

    if grad_type == "linear":
        mask = VerticalGradiantColorMask(back_color=hex_to_rgb(bg_hex), top_color=fg, bottom_color=fg_end)
    elif grad_type == "horizontal":
        mask = HorizontalGradiantColorMask(back_color=hex_to_rgb(bg_hex), left_color=fg, right_color=fg_end)
    elif grad_type == "radial":
        mask = RadialGradiantColorMask(back_color=hex_to_rgb(bg_hex), center_color=fg, edge_color=fg_end)
    elif grad_type == "square":
        mask = SquareGradiantColorMask(back_color=hex_to_rgb(bg_hex), center_color=fg, edge_color=fg_end)
    else:
        mask = SolidFillColorMask(back_color=hex_to_rgb(bg_hex), front_color=fg)

    img = qr.make_image(image_factory=StyledPilImage, module_drawer=drawer_cls(), color_mask=mask)
    img = img.convert("RGBA")

    # Optional logo overlay
    logo_url = design.get("logo_url")
    if logo_url and logo_url.startswith("/"):
        try:
            import os
            path = logo_url.replace("/uploads", os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
            logo = Image.open(path).convert("RGBA")
            w, h = img.size
            lw = int(w * 0.22)
            logo.thumbnail((lw, lw))
            pos = ((w - logo.size[0]) // 2, (h - logo.size[1]) // 2)
            img.paste(logo, pos, logo)
        except Exception:
            pass

    img = img.resize((size, size), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
