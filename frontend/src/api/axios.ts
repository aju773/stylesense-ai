import axios from "axios";

// Relative, not absolute. In production Django serves this bundle and the API
// from the same origin, so "/api" resolves correctly with no build-time
// configuration. In development Vite's proxy (see vite.config.ts) forwards
// /api to Django on :8000.
//
// Keeping it same-origin is also what lets the auth cookie stay SameSite=Lax
// instead of SameSite=None, which Safari and Brave would block as a
// third-party cookie.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
})

// Track whether a refresh is already in-flight
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url === "/auth/token/refresh/") {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
  

    if (isRefreshing) {
      // Another refresh is in-flight — queue this request
      return new Promise((resolve) => {
        pendingRequests.push(() => resolve(api(originalRequest)));
      });
    }

    isRefreshing = true;

    try {
        await api.post("/auth/token/refresh/");
        // Refresh succeeded — replay all queued requests
        pendingRequests.forEach((cb) => cb());
        pendingRequests = [];
        return api(originalRequest);
      } catch {
        // Refresh failed — user is truly logged out
        pendingRequests = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
    }
  }
);

export default api;
