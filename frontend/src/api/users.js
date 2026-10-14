import { apiFetch } from "../i18n/errors.js";
import API_URL from "./config";

export async function getUserById(id, accessToken) {
  const response = await apiFetch(`${API_URL}/users/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json(); // { id, name, email, role, is_active }
}

export async function updateUser(id, token, data) {
  const payload = { ...data };
  if (!data.password) delete payload.password;

  const response = await apiFetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

export async function getUsers({
  accessToken,
  limit = 10,
  offset = 0,
  searchTerm = "",
  is_active = "",
}) {
  const url = new URL(`${API_URL}/users`);
  url.searchParams.append("limit", limit);
  url.searchParams.append("offset", offset);
  if (searchTerm?.trim()) url.searchParams.append("search", searchTerm);
  if (is_active === "true" || is_active === "false")
    url.searchParams.append("is_active", is_active);

  const response = await apiFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json(); // { data, total, limit, offset }
}

export async function usersBulkStatus(ids, is_active, accessToken) {
  const response = await apiFetch(`${API_URL}/users/bulk-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ids, is_active }),
  });

  const data = await response.json();

  return data; // { message, skipped }
}

export async function deleteUser(id, accessToken) {
  const response = await apiFetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  return data;
}

export async function createUser(data, accessToken) {
  const response = await apiFetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}
