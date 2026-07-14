"""Auth & security helpers (bcrypt hashing, JWT tokens)."""
import os
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, role: str, remember: bool = False) -> str:
    minutes = int(os.environ.get("ACCESS_TOKEN_MINUTES", "60"))
    if remember:
        minutes = minutes * 24 * 30  # 30 days when remember me
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    days = int(os.environ.get("REFRESH_TOKEN_DAYS", "30"))
    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": secrets.token_urlsafe(16),
        "exp": datetime.now(timezone.utc) + timedelta(days=days),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])


def gen_short_code(length: int = 7) -> str:
    """URL-safe short code for QR redirect."""
    alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))
