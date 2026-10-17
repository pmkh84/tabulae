export function warehouseListContext(search) {
  const params = new URLSearchParams(search);
  const offset = Number(params.get("offset") || 0);
  return {
    searchTerm: params.get("search") || "",
    isActive: ["true", "false"].includes(params.get("is_active")) ? params.get("is_active") : "",
    offset: Number.isSafeInteger(offset) && offset >= 0 ? offset : 0,
  };
}

function internalRoute(value, pathname, fallback) {
  try {
    if (typeof value !== "string" || !value.startsWith("/")) return fallback;
    const url = new URL(value, "http://tabulae.invalid");
    return url.origin === "http://tabulae.invalid" && url.pathname === pathname ? url.pathname + url.search : fallback;
  } catch { return fallback; }
}

export function warehouseReturnTo(state) {
  return internalRoute(state?.warehouseReturnTo, "/warehouses/list", "/warehouses/list");
}

export function warehouseStockReturnTo(state, id) {
  const path = `/stock/warehouse/${id}`;
  return internalRoute(state?.warehouseStockReturnTo, path, path);
}

export function updateWarehouseQuery(search, changes) {
  const params = new URLSearchParams(search);
  for (const [field, value] of Object.entries(changes)) {
    if (value === "" || value === 0) params.delete(field); else params.set(field, String(value));
  }
  return params;
}

export function warehousePageOffset(offset, total, limit = 10) {
  return offset > 0 && offset >= total ? Math.max(0, Math.ceil(total / limit) - 1) * limit : offset;
}
