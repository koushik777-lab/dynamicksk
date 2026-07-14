"""QR Nexus - Backend API tests (pytest)."""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://qrnexus-manager.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SUPER_EMAIL = "koushikqr741@gmail.com"
SUPER_PASSWORD = "Qr@501"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data["user"]["role"] == "super_admin"
    return data["access_token"], data.get("refresh_token"), data["user"]


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token[0]}"}


@pytest.fixture(scope="session")
def company(admin_h):
    r = requests.post(f"{API}/companies", json={"name": f"TEST_Co_{uuid.uuid4().hex[:6]}"}, headers=admin_h)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def manager(admin_h, company):
    email = f"test-manager-{uuid.uuid4().hex[:8]}@qrnexus.io"
    pw = "manager123"
    r = requests.post(f"{API}/managers", json={
        "name": "TEST Manager", "email": email, "password": pw, "company_id": company["id"],
    }, headers=admin_h)
    assert r.status_code == 200, r.text
    m = r.json()
    m["password"] = pw
    return m


@pytest.fixture(scope="session")
def manager_h(manager):
    r = requests.post(f"{API}/auth/login", json={"email": manager["email"], "password": manager["password"]})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="session")
def qr_url(admin_h, company, manager):
    r = requests.post(f"{API}/qr", json={
        "name": "TEST URL QR",
        "type": "url",
        "data": {"url": "https://example.com"},
        "company_id": company["id"],
        "manager_id": manager["id"],
    }, headers=admin_h)
    assert r.status_code == 200, r.text
    q = r.json()
    assert q.get("short_code")
    return q


# ---------- auth ----------
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/health")
        assert r.status_code == 200 and r.json()["status"] == "ok"

    def test_admin_login_returns_tokens(self, admin_token):
        access, refresh, user = admin_token
        assert access and refresh
        assert user["email"] == SUPER_EMAIL
        assert user["role"] == "super_admin"

    def test_me(self, admin_h):
        r = requests.get(f"{API}/auth/me", headers=admin_h)
        assert r.status_code == 200
        assert r.json()["role"] == "super_admin"

    def test_refresh(self, admin_token):
        _, refresh, _ = admin_token
        r = requests.post(f"{API}/auth/refresh", json={"refresh_token": refresh})
        assert r.status_code == 200 and "access_token" in r.json()

    def test_change_password_wrong_current(self, admin_h):
        r = requests.post(f"{API}/auth/change-password",
                          json={"current_password": "WRONG", "new_password": "newpass123"},
                          headers=admin_h)
        assert r.status_code == 400

    def test_change_password_roundtrip(self, admin_h):
        new_pw = "TempPw12345"
        r = requests.post(f"{API}/auth/change-password",
                          json={"current_password": SUPER_PASSWORD, "new_password": new_pw},
                          headers=admin_h)
        assert r.status_code == 200
        # ensure works
        r2 = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": new_pw})
        assert r2.status_code == 200
        h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}
        # revert
        r3 = requests.post(f"{API}/auth/change-password",
                           json={"current_password": new_pw, "new_password": SUPER_PASSWORD},
                           headers=h2)
        assert r3.status_code == 200


# ---------- RBAC ----------
class TestRBAC:
    def test_manager_cannot_list_companies(self, manager_h):
        r = requests.get(f"{API}/companies", headers=manager_h)
        assert r.status_code == 403

    def test_manager_cannot_list_managers(self, manager_h):
        r = requests.get(f"{API}/managers", headers=manager_h)
        assert r.status_code == 403

    def test_manager_cannot_create_qr(self, manager_h, company):
        r = requests.post(f"{API}/qr",
                          json={"name": "x", "type": "url", "data": {"url": "https://x.com"}, "company_id": company["id"]},
                          headers=manager_h)
        assert r.status_code == 403


# ---------- Companies CRUD ----------
class TestCompanies:
    def test_list(self, admin_h):
        r = requests.get(f"{API}/companies", headers=admin_h)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_full_lifecycle(self, admin_h):
        # create
        r = requests.post(f"{API}/companies", json={"name": f"TEST_Life_{uuid.uuid4().hex[:6]}"}, headers=admin_h)
        assert r.status_code == 200
        cid = r.json()["id"]
        # get
        r2 = requests.get(f"{API}/companies/{cid}", headers=admin_h)
        assert r2.status_code == 200
        # update
        r3 = requests.patch(f"{API}/companies/{cid}", json={"description": "hi"}, headers=admin_h)
        assert r3.status_code == 200 and r3.json()["description"] == "hi"
        # suspend
        r4 = requests.post(f"{API}/companies/{cid}/suspend", headers=admin_h)
        assert r4.status_code == 200
        # activate
        r5 = requests.post(f"{API}/companies/{cid}/activate", headers=admin_h)
        assert r5.status_code == 200
        # delete
        r6 = requests.delete(f"{API}/companies/{cid}", headers=admin_h)
        assert r6.status_code == 200


# ---------- Managers CRUD ----------
class TestManagers:
    def test_list(self, admin_h):
        r = requests.get(f"{API}/managers", headers=admin_h)
        assert r.status_code == 200

    def test_reset_password(self, admin_h, manager):
        new_pw = "ResetPw123"
        r = requests.post(f"{API}/managers/{manager['id']}/reset-password",
                          json={"new_password": new_pw}, headers=admin_h)
        assert r.status_code == 200
        r2 = requests.post(f"{API}/auth/login", json={"email": manager["email"], "password": new_pw})
        assert r2.status_code == 200
        # restore
        requests.post(f"{API}/managers/{manager['id']}/reset-password",
                      json={"new_password": manager["password"]}, headers=admin_h)


# ---------- QR ----------
class TestQR:
    def test_create_various_types(self, admin_h, company):
        types_data = {
            "url": {"url": "https://example.com"},
            "wifi": {"ssid": "TestNet", "password": "abc12345", "encryption": "WPA"},
            "vcard": {"first_name": "John", "last_name": "Doe", "phone": "+11234567890"},
            "text": {"text": "hello world"},
            "email": {"email": "a@b.com", "subject": "hi", "body": "test"},
        }
        for t, data in types_data.items():
            r = requests.post(f"{API}/qr", json={
                "name": f"TEST_{t}",
                "type": t,
                "data": data,
                "company_id": company["id"],
            }, headers=admin_h)
            assert r.status_code == 200, f"{t}: {r.text}"
            body = r.json()
            assert body["short_code"] and body["type"] == t

    def test_preview_public_no_auth(self, qr_url):
        r = requests.get(f"{API}/qr/{qr_url['id']}/preview")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/png")
        assert len(r.content) > 100

    def test_preview_dynamic_public(self):
        r = requests.post(f"{API}/qr/preview", json={"type": "url", "data": {"url": "https://x.io"}})
        assert r.status_code == 200 and r.headers["content-type"] == "image/png"

    def test_scan_redirect_and_analytics(self, qr_url, admin_h):
        # trigger 2 scans
        code = qr_url["short_code"]
        r = requests.get(f"{API}/r/{code}", allow_redirects=False)
        assert r.status_code in (301, 302), r.status_code
        assert "example.com" in r.headers.get("location", "")
        requests.get(f"{API}/r/{code}", allow_redirects=False)
        time.sleep(1)
        r2 = requests.get(f"{API}/analytics/overview", headers=admin_h, params={"qr_id": qr_url["id"]})
        assert r2.status_code == 200
        assert r2.json()["total_scans"] >= 2

    def test_analytics_export_csv(self, qr_url, admin_h):
        r = requests.get(f"{API}/analytics/export", headers=admin_h, params={"qr_id": qr_url["id"]})
        assert r.status_code == 200
        assert "Timestamp" in r.text

    def test_pause_and_resume(self, qr_url, admin_h):
        code = qr_url["short_code"]
        rp = requests.post(f"{API}/qr/{qr_url['id']}/pause", headers=admin_h)
        assert rp.status_code == 200
        r = requests.get(f"{API}/r/{code}", allow_redirects=False)
        assert r.status_code == 200
        assert "Paused" in r.text
        rr = requests.post(f"{API}/qr/{qr_url['id']}/resume", headers=admin_h)
        assert rr.status_code == 200
        r2 = requests.get(f"{API}/r/{code}", allow_redirects=False)
        assert r2.status_code in (301, 302)

    def test_scan_records_analytics_immediately(self, admin_h, company):
        # Create a fresh QR and scan; scan doc must exist immediately (geo is async)
        r = requests.post(f"{API}/qr", json={
            "name": "TEST_scan_immediate", "type": "url",
            "data": {"url": "https://example.org"},
            "company_id": company["id"],
        }, headers=admin_h)
        assert r.status_code == 200
        q = r.json()
        code = q["short_code"]
        r_scan = requests.get(f"{API}/r/{code}", allow_redirects=False)
        assert r_scan.status_code in (301, 302)
        # Immediately query analytics
        r_a = requests.get(f"{API}/analytics/overview", headers=admin_h, params={"qr_id": q["id"]})
        assert r_a.status_code == 200
        assert r_a.json()["total_scans"] >= 1

    def test_deleted_qr_returns_410(self, admin_h, company):
        r = requests.post(f"{API}/qr", json={"name": "TEST_del_410", "type": "url",
                                              "data": {"url": "https://x.com"},
                                              "company_id": company["id"]}, headers=admin_h)
        q = r.json()
        assert requests.delete(f"{API}/qr/{q['id']}", headers=admin_h).status_code == 200
        r2 = requests.get(f"{API}/r/{q['short_code']}", allow_redirects=False)
        assert r2.status_code == 410, r2.status_code

    def test_expired_qr_returns_410(self, admin_h, company):
        past = "2000-01-01T00:00:00+00:00"
        r = requests.post(f"{API}/qr", json={
            "name": "TEST_exp", "type": "url",
            "data": {"url": "https://x.com"},
            "company_id": company["id"],
            "expiry": past,
        }, headers=admin_h)
        assert r.status_code == 200, r.text
        q = r.json()
        r2 = requests.get(f"{API}/r/{q['short_code']}", allow_redirects=False)
        assert r2.status_code == 410, r2.status_code

    def test_scan_limit_exceeded_returns_410(self, admin_h, company):
        r = requests.post(f"{API}/qr", json={
            "name": "TEST_limit", "type": "url",
            "data": {"url": "https://x.com"},
            "company_id": company["id"],
            "scan_limit": 1,
        }, headers=admin_h)
        assert r.status_code == 200, r.text
        q = r.json()
        # first scan should redirect
        r1 = requests.get(f"{API}/r/{q['short_code']}", allow_redirects=False)
        assert r1.status_code in (301, 302), r1.status_code
        # second should be 410
        r2 = requests.get(f"{API}/r/{q['short_code']}", allow_redirects=False)
        assert r2.status_code == 410, r2.status_code

    def test_version_bumps_on_design_change(self, admin_h, company):
        r = requests.post(f"{API}/qr", json={
            "name": "TEST_design_ver", "type": "url",
            "data": {"url": "https://d.com"},
            "company_id": company["id"],
        }, headers=admin_h)
        assert r.status_code == 200
        q = r.json()
        v0 = q.get("version", 1)
        # Change design only
        r2 = requests.patch(f"{API}/qr/{q['id']}",
                            json={"design": {"fg_color": "#123456"}},
                            headers=admin_h)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["version"] == v0 + 1, f"expected {v0+1}, got {body['version']}"
        # And version_history should contain the previous entry
        rh = requests.get(f"{API}/qr/{q['id']}/history", headers=admin_h)
        assert rh.status_code == 200
        hist = rh.json()
        assert hist["current_version"] == v0 + 1
        assert len(hist["history"]) >= 1

    def test_delete_and_restore(self, admin_h, company):
        r = requests.post(f"{API}/qr", json={"name": "TEST_del", "type": "url",
                                              "data": {"url": "https://x.com"},
                                              "company_id": company["id"]}, headers=admin_h)
        qid = r.json()["id"]
        assert requests.delete(f"{API}/qr/{qid}", headers=admin_h).status_code == 200
        get_r = requests.get(f"{API}/qr/{qid}", headers=admin_h)
        assert get_r.status_code == 200 and get_r.json()["status"] == "deleted"
        assert requests.post(f"{API}/qr/{qid}/restore", headers=admin_h).status_code == 200
        assert requests.get(f"{API}/qr/{qid}", headers=admin_h).json()["status"] == "active"

    def test_manager_edit_own_qr(self, manager_h, qr_url):
        r = requests.patch(f"{API}/qr/{qr_url['id']}", json={"data": {"url": "https://new-url.com"}},
                           headers=manager_h)
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["url"] == "https://new-url.com"
        assert body["version"] >= 2

    def test_manager_cannot_edit_other_qr(self, manager_h, admin_h, company):
        # create QR not assigned to manager
        r = requests.post(f"{API}/qr", json={"name": "TEST_other", "type": "url",
                                              "data": {"url": "https://o.com"},
                                              "company_id": company["id"]}, headers=admin_h)
        qid = r.json()["id"]
        r2 = requests.patch(f"{API}/qr/{qid}", json={"data": {"url": "https://hack.com"}},
                            headers=manager_h)
        assert r2.status_code == 403


# ---------- Dashboard / Search / Activity / Folders / Uploads ----------
class TestMisc:
    def test_dashboard_stats_super(self, admin_h):
        r = requests.get(f"{API}/dashboard/stats", headers=admin_h)
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "super_admin"
        for k in ("total_companies", "total_managers", "total_qr", "total_scans"):
            assert k in d

    def test_dashboard_stats_manager(self, manager_h):
        r = requests.get(f"{API}/dashboard/stats", headers=manager_h)
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "manager"
        assert "total_qr" in d and "company" in d

    def test_search(self, admin_h):
        r = requests.get(f"{API}/dashboard/search", headers=admin_h, params={"q": "TEST"})
        assert r.status_code == 200
        d = r.json()
        assert all(k in d for k in ("companies", "managers", "qr"))

    def test_activity_logs(self, admin_h):
        r = requests.get(f"{API}/activity", headers=admin_h)
        assert r.status_code == 200 and isinstance(r.json(), list)
        actions = {a.get("action") for a in r.json()}
        # There should be some login / create events by now
        assert len(actions) >= 1

    def test_folders_crud(self, admin_h):
        r = requests.post(f"{API}/folders", json={"name": "TEST_folder"}, headers=admin_h)
        assert r.status_code == 200
        fid = r.json()["id"]
        r2 = requests.get(f"{API}/folders", headers=admin_h)
        assert r2.status_code == 200
        assert any(f["id"] == fid for f in r2.json())
        assert requests.delete(f"{API}/folders/{fid}", headers=admin_h).status_code == 200

    def test_upload_image(self, admin_h):
        # 1x1 PNG
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
            b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/uploads", headers=admin_h, files=files)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/uploads/")
        # fetch it via public mount
        r2 = requests.get(f"{BASE_URL}{url}")
        assert r2.status_code == 200


# ---------- Brute force ----------
class TestBruteForce:
    def test_lockout_after_5_failures(self):
        email = f"bf-{uuid.uuid4().hex[:8]}@nx.io"
        for _ in range(5):
            requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
        # After 5 failures, should be 429
        assert r.status_code == 429, f"got {r.status_code}: {r.text}"
