import { apiFetch, LocalizedApiError } from "../i18n/errors.js";
import API_URL from "./config";

export async function getProducts({
  accessToken,
  limit = 10,
  offset = 0,
  searchTerm = "",
  category_id = "",
  is_active = "",
}) {
  const url = new URL(`${API_URL}/products`);
  url.searchParams.append("limit", limit);
  url.searchParams.append("offset", offset);
  if (searchTerm) url.searchParams.append("search", searchTerm);
  if (category_id) url.searchParams.append("category_id", category_id);
  if (is_active !== "") url.searchParams.append("is_active", is_active);

  const response = await apiFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json(); // { data, total, ... }
}

export async function searchProducts(inputValue, accessToken, limit, offset) {
  const response = await apiFetch(
    `${API_URL}/products?limit=${limit}&offset=${offset}&search=${inputValue}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.data || [];
}

export async function getProductById(id, accessToken) {
  const response = await apiFetch(`${API_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

export async function createProduct(data, accessToken) {
  const response = await apiFetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function updateProduct(id, data, accessToken) {
  const response = await apiFetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function deleteProduct(id, accessToken) {
  const response = await apiFetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

export async function getCategories(accessToken, limit = 100, offset = 0) {
  const url = new URL(`${API_URL}/categories`);
  url.searchParams.append("limit", limit);
  url.searchParams.append("offset", offset);

  const response = await apiFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return data.data || [];
}

export async function productBulkStatus(ids, is_active, accessToken) {
  const response = await apiFetch(`${API_URL}/products/bulk-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ids, is_active }),
  });

  return await response.json();
}

export async function createCategory(name, accessToken) {
  const res = await apiFetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  return await res.json();
}

export async function updateCategory(id, name, accessToken) {
  const res = await apiFetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  let data;
  try {
    data = await res.json();
  } catch (cause) {
    throw new LocalizedApiError(null, 500, cause);
  }

  return data;
}

export async function deleteCategory(id, accessToken) {
  const res = await apiFetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch (cause) {
    throw new LocalizedApiError(null, 500, cause);
  }

  return data;
}
