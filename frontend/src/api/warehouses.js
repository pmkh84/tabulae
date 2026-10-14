import { apiFetch } from "../i18n/errors.js";
import API_URL from "./config";

export async function getAllWarehouses(
  accessToken,
  limit,
  offset,
  searchTerm = "",
  is_active = ""
) {
  const url = new URL(`${API_URL}/warehouses`);
  url.searchParams.append("limit", limit);
  url.searchParams.append("offset", offset);
  if (searchTerm) url.searchParams.append("search", searchTerm);
  if (is_active !== "") url.searchParams.append("is_active", is_active === "true");

  const response = await apiFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json(); // { data, total, ... }
}

export async function searchWarehouses(inputValue, accessToken, limit, offset) {
  const response = await apiFetch(
    `${API_URL}/warehouses?limit=${limit}&offset=${offset}&search=${inputValue}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.data || [];
}

export async function warehousesBulkUpdate(ids, is_active, accessToken) {
  const response = await apiFetch(`${API_URL}/warehouses/bulk-active`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ids, is_active }),
  });

  return await response.json();
}

export async function createWarehouse(data, accessToken) {
  const response = await apiFetch(`${API_URL}/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function getWarehouseById(id, accessToken) {
  const response = await apiFetch(`${API_URL}/warehouses/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

export async function warehouseUpdate(id, data, accessToken) {
  const response = await apiFetch(`${API_URL}/warehouses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function deleteWarehouse(id, accessToken) {
  const response = await apiFetch(`${API_URL}/warehouses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}
