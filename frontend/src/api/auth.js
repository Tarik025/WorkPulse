import api, { unwrap, tokens } from "./axios";

export const authApi = {
  async register(body) {
    return unwrap(await api.post("/auth/register", body));
  },
  async login(body) {
    const data = unwrap(await api.post("/auth/login", body));
    tokens.save(data || {});
    return data;
  },
  async logout() {
    try { await api.post("/auth/logout"); } finally { tokens.clear(); }
  },
  async currentUser() {
    return unwrap(await api.post("/auth/current-user"));
  },
  async changePassword(body) {
    return unwrap(await api.post("/auth/change-password", body));
  },
  async verifyEmail(token) {
    return unwrap(await api.get(`/auth/verify-email/${token}`));
  },
  async forgotPassword(body) {
    return unwrap(await api.post("/auth/forgot-password", body));
  },
  async resetPassword(token, body) {
    return unwrap(await api.post(`/auth/reset-password/${token}`, body));
  },
  async resendVerification() {
    return unwrap(await api.post("/auth/resend-email-verification"));
  },
};
