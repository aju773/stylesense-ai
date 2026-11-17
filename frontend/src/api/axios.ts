import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
})

let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url === "/auth/token/refresh/") {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
  

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push(() => resolve(api(originalRequest)));
      });
    }

    isRefreshing = true;

    try {
        await api.post("/auth/token/refresh/");
        pendingRequests.forEach((cb) => cb());
        pendingRequests = [];
        return api(originalRequest);
      } catch {
        pendingRequests = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
    }
  }
);

export default api;
