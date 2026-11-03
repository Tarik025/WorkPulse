import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true, // works with cookie-based JWT
});

const store = {
  get: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  },
  clear: () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch { /* ignore */ }
  },
};

export const tokens = {
  save({ accessToken, refreshToken } = {}) {
    if (accessToken) store.set("accessToken", accessToken);
    if (refreshToken) store.set("refreshToken", refreshToken);
  },
  clear: store.clear,
};

// Bearer fallback: if your backend only uses cookies this header is simply ignored.
api.interceptors.request.use((config) => {
  const t = store.get("accessToken");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";
    const skip = ["/auth/login", "/auth/register", "/auth/refresh-token"].some((p) => url.includes(p));

    if (status === 401 && original && !original._retry && !skip) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          api
            .post("/auth/refresh-token", { refreshToken: store.get("refreshToken") })
            .finally(() => { refreshing = null; });
        const res = await refreshing;
        tokens.save(res.data?.data || {});
        return api(original);
      } catch (e) {
        tokens.clear();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export const unwrap = (res) => res.data?.data;

// validation errors (422) come as errors: [{ field: "message" }], show the first real message
export const errMsg = (err) => {
  const d = err?.response?.data;
  const first = d?.errors?.[0];
  if (err?.response?.status === 422 && first) {
    if (typeof first === "string") return first;
    const v = Object.values(first)[0];
    if (typeof v === "string") return v;
  }
  return d?.message || first?.message || (typeof first === "string" ? first : null) || err?.message || "Something went wrong";
};

export const fileUrl = (u) => (!u ? "" : /^https?:\/\//.test(u) ? u : u.startsWith("/") ? u : `/${u}`);

export default api;
