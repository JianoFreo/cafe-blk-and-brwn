import axios from "axios";

/** One shared axios instance. The admin token (if any) is added to every request. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bb_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** A readable message from any failed request. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: string } | undefined)?.error;
    if (msg) return msg;
    if (!err.response) return "Cannot reach the server. Check that the backend is running.";
  }
  return fallback;
}

// an expired or invalid admin session signs you out everywhere
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && localStorage.getItem("bb_admin_token") && !String(err.config?.url).includes("/auth/login")) {
      localStorage.removeItem("bb_admin_token");
      window.dispatchEvent(new Event("bb:logout"));
    }
    return Promise.reject(err);
  }
);
