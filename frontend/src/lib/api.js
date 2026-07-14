import axios from "axios";
import { useAuth } from "@/store/auth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Try refresh once
      const { refreshToken, setTokens, logout } = useAuth.getState();
      const orig = error.config;
      if (refreshToken && !orig._retried) {
        orig._retried = true;
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          setTokens(res.data.access_token, refreshToken);
          orig.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(orig);
        } catch (_) {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export function formatError(err) {
  const d = err?.response?.data;
  if (typeof d === "string") return d;
  if (d && typeof d.detail === "string") return d.detail;
  if (Array.isArray(d?.detail)) return d.detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return err?.message || "Something went wrong";
}

export function backendOrigin() {
  return BACKEND_URL;
}
