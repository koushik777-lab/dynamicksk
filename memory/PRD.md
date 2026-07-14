# QR Nexus — Product Requirements Doc

## Problem Statement (verbatim from user)
Enterprise-grade SaaS Dynamic QR Code Management Platform. Only two roles: **Super Admin** (owner) and **Manager** (customer). Super Admin creates companies, managers, and QR codes. Managers only edit assigned QR codes (URL, pause/resume, download, view analytics — never create). 30+ QR types (URL, WiFi, vCard, Multi-link, Menu, Crypto, etc.). Full analytics (geo, device, browser, OS, timeline, live visitors). Version history, folders, activity logs. Landing/pricing/docs pages. Dark + light mode. Should feel like a premium SaaS.

## Architectural decisions
- **Backend**: FastAPI + Python + MongoDB (supervisor config mandates `uvicorn server:app` on port 8001 — user was informed).
- **Frontend**: React 19 + CRA + JavaScript + TailwindCSS + Shadcn UI + Framer Motion + Recharts + Zustand + Axios. (Vite/TS would have required rewriting all 40+ preinstalled shadcn .jsx files — same UX outcome.)
- **QR generation**: `qrcode[pil]` with `StyledPilImage` + gradient masks + logo overlay.
- **Analytics geo**: ip-api.com (free).
- **Storage**: Local filesystem at /app/backend/uploads, mounted at /uploads.
- **Design language**: Swiss/High-Contrast (Outfit + IBM Plex Sans + JetBrains Mono + Signal Red #FF3B30) per design_guidelines.json.

## Implemented (2026-01-14)
1. Auth: bcrypt + JWT access (60m) + refresh (30d) + remember-me + brute-force lockout + forgot/reset + change password + login history.
2. Super Admin seeded on startup from .env (Koushik Sarkar / koushikqr741@gmail.com / Qr@501). Protected flag prevents delete/suspend from UI.
3. Companies: create/read/update/delete/suspend/activate; enriched with qr_count + total_scans.
4. Managers: create/list/update/suspend/activate/delete/reset-password/impersonate.
5. QR CRUD (Super Admin creates; Manager edits assigned): 28+ content types, live preview, patterns (7), gradients (5), color pickers, logo upload, padding, error correction; pause/resume/archive/restore/delete/duplicate; version history; scan_limit/expiry/password fields stored.
6. Public redirect at /r/{short_code} with scan tracking (IP, geo, UA parse, device, browser, OS, language, referrer), respects paused/archived/deleted/expired/scan-limit.
7. Analytics: /overview (timeline, countries, cities, devices, browsers, OS, languages, referrers, unique visitors, live 5-min), /recent-scans, /top-qr, /export CSV.
8. Dashboard stats endpoint (super_admin and manager variants).
9. Folders (per-user), Activity logs, File uploads (2MB image limit).
10. Global search (⌘K) across companies/managers/QR.
11. Frontend pages: Landing, Pricing, Docs, Login, ForgotPassword, ResetPassword, Dashboard, Companies, Managers, QRList (grid+table), QRCreate (4-step wizard), QRDetails (analytics/edit/scans tabs), Analytics (full breakdown), ActivityLogs, Settings, Profile, Folders, NotFound.
12. Dark + Light theme toggle (persisted via Zustand).
13. Live QR preview endpoint (public, cached 60s).
14. Downloads: PNG, SVG, PDF, JPEG, WebP.
15. CSV export for scan analytics.

## Not implemented / deferred
- P1: SMTP integration for password reset emails (currently logged to backend console for dev).
- P1: Socket.IO real-time updates (analytics currently polls on load).
- P1: World map with actual geographical rendering (currently uses bar charts).
- P2: Docker/PM2/NGINX config, Redis caching layer, 2FA, Swagger UI (schemas exposed via FastAPI /docs already).
- P2: Additional QR types (feedback form builder, multi-link visual builder, coupon builder — currently URL-based).

## Next tasks
- SMTP + Resend integration for real password reset & scan alerts.
- Real-time dashboard via Socket.IO.
- Interactive world map (react-simple-maps).
- Deployment configs (Docker Compose, NGINX).

## Personas
- **Owner (Super Admin)**: Runs a QR SaaS as a business, provisions client companies + delegated managers, owns all analytics and billing.
- **Manager**: Customer's operator, only sees QR codes assigned to them, edits destinations, views analytics for their fleet.
