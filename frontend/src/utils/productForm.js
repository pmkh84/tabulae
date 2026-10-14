import { t } from "../i18n/index.js";
import { errorMessage } from "../i18n/errors.js";

const length = (value) => [...value].length;

export function productFormValues(product) {
  return {
    sku: product?.sku ?? "", short_name: product?.short_name ?? "",
    description: product?.description ?? "", category_id: product?.category_id ?? "",
    ...(product ? { is_active: product.is_active } : {}),
  };
}

export function validateProductForm(form, categories) {
  const errors = {};
  if (!form.sku.trim()) errors.sku = t("validation.required");
  else if (form.sku.length < 3 || form.sku.length > 20 || /[^A-Z0-9]/.test(form.sku)) errors.sku = t("products.skuConstraint");
  if (!form.short_name.trim()) errors.short_name = t("validation.required");
  else if (length(form.short_name) < 3 || length(form.short_name) > 100) errors.short_name = t("products.nameConstraint");
  if (length(form.description ?? "") > 500) errors.description = t("products.descriptionConstraint");
  const id = Number(form.category_id);
  if (form.category_id === "" || form.category_id == null) errors.category_id = t("validation.required");
  else if (!/^\d+$/.test(String(form.category_id)) || !Number.isSafeInteger(id) || id <= 0 || !categories.some((category) => category.id === id)) {
    errors.category_id = t("products.categoryInvalid");
  }
  return errors;
}

export function productPayload(form, original) {
  const values = {
    sku: form.sku, short_name: form.short_name, description: form.description,
    category_id: Number(form.category_id),
  };
  if (!original) return values;
  const payload = {};
  for (const [field, value] of Object.entries(values)) {
    // An untouched nullable description renders as an empty input, but stays null in storage.
    if (value !== (field === "description" ? original[field] ?? "" : original[field])) payload[field] = value;
  }
  if (form.is_active !== original.is_active) payload.is_active = form.is_active;
  return payload;
}

export function productErrorFeedback(error) {
  const fields = {};
  for (const issue of error?.fieldErrors ?? []) {
    if (["sku", "short_name", "description", "category_id", "is_active"].includes(issue.field)) {
      fields[issue.field] = [fields[issue.field], issue.message].filter(Boolean).join("\n");
    }
  }
  if (typeof error?.detail === "string") {
    if (/^SKU is already (registered|in use)/i.test(error.detail)) fields.sku = t("errors.duplicateSku");
    if (/category.*(not found|does not exist)/i.test(error.detail)) fields.category_id = t("errors.categoryNotFound");
    if (/remaining stock.*cannot be deactivated/i.test(error.detail)) fields.is_active = t("errors.productStock");
  }
  return { fields, message: Object.keys(fields).length ? t("products.correctFields") : errorMessage(error) };
}

// A synchronous lock protects against rapid clicks/Enter before React renders the disabled button.
export async function submitProductForm({ form, original, categories, lock, persist, onPending }) {
  if (lock.current) return { status: "ignored" };
  const errors = validateProductForm(form, categories);
  if (Object.keys(errors).length) return { status: "invalid", errors };
  const payload = productPayload(form, original);
  if (original && !Object.keys(payload).length) return { status: "unchanged" };
  lock.current = true;
  try {
    onPending(true);
    const product = await persist(payload);
    return { status: "saved", product };
  } catch (error) {
    return { status: "failed", ...productErrorFeedback(error) };
  } finally {
    lock.current = false;
    onPending(false);
  }
}
