export function productListContext(search) {
  const params = new URLSearchParams(search);
  const offset = Number(params.get("offset") || 0);
  const category = params.get("category_id") || "";
  return {
    searchTerm: params.get("search") || "",
    selectedCategoryId: /^[1-9]\d*$/.test(category) ? category : "",
    isActive: ["true", "false"].includes(params.get("is_active")) ? params.get("is_active") : "",
    offset: Number.isSafeInteger(offset) && offset >= 0 ? offset : 0,
  };
}

// Router state may originate outside the product flow; only accept the internal list route.
export function productReturnTo(state) {
  try {
    const value = state?.productReturnTo;
    if (typeof value !== "string" || !value.startsWith("/products/list")) return "/products/list";
    const url = new URL(value, "http://tabulae.invalid");
    return url.origin === "http://tabulae.invalid" && url.pathname === "/products/list"
      ? url.pathname + url.search : "/products/list";
  } catch { return "/products/list"; }
}

export function updateProductListQuery(search, changes) {
  const params = new URLSearchParams(search);
  for (const [field, value] of Object.entries(changes)) {
    if (value === "" || value === 0) params.delete(field); else params.set(field, String(value));
  }
  return params;
}
