"""QR Nexus - FastAPI server entry point."""
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from contextlib import asynccontextmanager
import logging

from core.db import get_db, ensure_indexes, seed_super_admin, close_db
from routers.auth import router as auth_router
from routers.companies import router as companies_router
from routers.managers import router as managers_router
from routers.qr import router as qr_router
from routers.public import router as public_router
from routers.analytics import router as analytics_router
from routers.dashboard import router as dashboard_router
from routers.misc import folders_router, logs_router, uploads_router


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("qrnexus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await ensure_indexes()
        await seed_super_admin()
        logger.info("QR Nexus initialised.")
    except Exception as e:
        logger.exception("Startup error: %s", e)
    yield
    # Shutdown
    await close_db()


app = FastAPI(title="QR Nexus API", version="1.0.0", lifespan=lifespan)

# CORS
origins_env = os.environ.get("CORS_ORIGINS", "*")
origins = ["*"] if origins_env == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False if origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Uploads static directory
uploads_dir = Path(os.environ.get("UPLOAD_DIR", str(ROOT_DIR / "uploads")))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# API routers
app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(managers_router)
app.include_router(qr_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(folders_router)
app.include_router(logs_router)
app.include_router(uploads_router)
# Public (no /api prefix): /r/{short_code}
app.include_router(public_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "qrnexus"}


@app.get("/api/")
async def root():
    return {"service": "QR Nexus API", "version": "1.0.0"}


# ── Serve React frontend build (production mode) ──────────────────────────────
# When `yarn build` has been run, serve the React app from FastAPI directly.
# This means ONE port (8000) serves both API + frontend in production.
# In local dev, React runs on port 3000 separately — this is a no-op then.

FRONTEND_BUILD = ROOT_DIR.parent / "frontend" / "build"

if FRONTEND_BUILD.exists():
    # Serve React's static assets (JS, CSS, media chunks)
    react_static = FRONTEND_BUILD / "static"
    if react_static.exists():
        app.mount("/static", StaticFiles(directory=str(react_static)), name="react-static")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Catch-all: serve React build files, fallback to index.html for SPA routing."""
        file_path = FRONTEND_BUILD / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        # React Router handles unknown paths client-side
        return FileResponse(str(FRONTEND_BUILD / "index.html"))
else:
    logger.info("No frontend build found — running API-only mode (dev). Run `yarn build` to enable frontend serving.")
