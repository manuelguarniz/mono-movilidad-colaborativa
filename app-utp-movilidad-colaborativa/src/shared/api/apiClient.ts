import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/shared/config/env";

const AUTH_COOKIE_NAME =
  import.meta.env.VITE_AUTH_COOKIE_NAME ?? "app_auth_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(AUTH_COOKIE_NAME);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ?? "Error de conexión con el backend";
    return Promise.reject(new Error(message));
  },
);
