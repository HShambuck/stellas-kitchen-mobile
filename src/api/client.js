import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Development: your local machine's LAN IP (not localhost — device can't reach it)
// Production:  your Railway backend URL
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:5000";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept:         "application/json",
  },
});

// ─── Request Interceptor — Attach JWT ────────────────────────────────────────
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore failure is non-fatal; request proceeds without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Normalise errors ─────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                 ||
      "Something went wrong. Please try again.";

    // Surface a clean Error object rather than the full Axios error
    const normalised = new Error(message);
    normalised.status = error.response?.status;
    normalised.data   = error.response?.data;
    return Promise.reject(normalised);
  }
);

export default client;
