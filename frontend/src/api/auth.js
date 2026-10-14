import { apiFetch } from "../i18n/errors.js";
import API_URL from "./config";

export async function login({ email, password }) {
  const formData = new URLSearchParams();
  formData.append("username", email); // Email is sent as 'username' for OAuth2 compatibility
  formData.append("password", password);

  const response = await apiFetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    credentials: "include",
    body: formData.toString(),
  });

  return await response.json(); // { access_token, token_type }
}

export async function register({ name, email, password }) {
  const response = await apiFetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  return await response.json();
}

export async function verifyPassword(password, accessToken) {
  const response = await apiFetch(`${API_URL}/auth/verify-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  });

  return await response.json(); // { message: "Password verified successfully" }
}

export async function getProfile(accessToken) {
  const response = await apiFetch(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json(); // { id, name, email, role, is_active }
}
