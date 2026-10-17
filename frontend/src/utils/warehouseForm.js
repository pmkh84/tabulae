import { t } from "../i18n/index.js";
import { LocalizedApiError, errorMessage } from "../i18n/errors.js";

export function warehouseFormValues(warehouse) {
  return { name: warehouse?.name ?? "", ...(warehouse ? { is_active: warehouse.is_active } : {}) };
}

export function validateWarehouseForm(form) {
  const errors = {};
  if (typeof form.name !== "string" || !form.name.trim()) errors.name = t("validation.required");
  else if ([...form.name].length > 255) errors.name = t("warehouses.nameConstraint");
  if ("is_active" in form && typeof form.is_active !== "boolean") errors.is_active = t("validation.choice");
  return errors;
}

export function warehousePayload(form, original) {
  if (!original) return { name: form.name };
  const payload = {};
  if (form.name !== original.name) payload.name = form.name;
  // Submitting even an unchanged false flag triggers the server's stock restriction.
  if (form.is_active !== original.is_active) payload.is_active = form.is_active;
  return payload;
}

export class WarehouseResponseError extends LocalizedApiError {
  constructor(cause) {
    super(null, 502, cause);
    this.message = t("warehouses.invalidResponse");
  }
}

export function checkedWarehouse(warehouse, expectedId) {
  if (!warehouse || !Number.isSafeInteger(warehouse.id) || typeof warehouse.name !== "string"
    || [...warehouse.name].length > 255 || typeof warehouse.is_active !== "boolean"
    || (expectedId != null && String(warehouse.id) !== String(expectedId))) {
    throw new WarehouseResponseError();
  }
  return warehouse;
}

export function checkedWarehousePage(response) {
  checkedWarehouseStockPage(response);
  response.data.forEach((warehouse) => checkedWarehouse(warehouse));
  return response;
}

export function checkedWarehouseStockPage(response) {
  if (!Array.isArray(response?.data) || !Number.isSafeInteger(response.total) || response.total < 0) throw new WarehouseResponseError();
  return response;
}

export function checkedWarehouseChart(response) {
  if (!Array.isArray(response)) throw new WarehouseResponseError();
  return response;
}

export function checkedWarehouseBulk(response, count) {
  const match = typeof response?.message === "string" && response.message.match(/^(\d+) warehouses updated$/);
  if (!match || !Number.isSafeInteger(response.skipped) || response.skipped < 0
    || Number(match[1]) + response.skipped !== count) throw new WarehouseResponseError();
  return response;
}

export function warehouseErrorFeedback(error, saving = false) {
  const fields = {};
  for (const issue of error?.fieldErrors ?? []) {
    if (["name", "is_active"].includes(issue.field)) {
      fields[issue.field] = [fields[issue.field], issue.message].filter(Boolean).join("\n");
    }
  }
  if (typeof error?.detail === "string" && /not empty.*cannot be deactivated/i.test(error.detail)) {
    fields.is_active = t("errors.warehouseStock");
  }
  const malformed = error instanceof WarehouseResponseError || error instanceof SyntaxError;
  const uncertain = saving && (malformed || error?.status === 0 || !(error instanceof LocalizedApiError) || error.status >= 500);
  const message = Object.keys(fields).length ? t("warehouses.correctFields")
    : malformed ? t("warehouses.invalidResponse") : errorMessage(error);
  return { fields, message: uncertain ? message + "\n" + t("warehouses.uncertainSave") : message };
}

export async function submitWarehouseForm({ form, original, lock, persist, onPending, confirmDeactivation }) {
  if (lock.current) return { status: "ignored" };
  const errors = validateWarehouseForm(form);
  if (Object.keys(errors).length) return { status: "invalid", errors };
  const payload = warehousePayload(form, original);
  if (original && !Object.keys(payload).length) return { status: "unchanged" };
  lock.current = true;
  try {
    onPending(true);
    if (payload.is_active === false && await confirmDeactivation?.() !== true) return { status: "cancelled" };
    const warehouse = checkedWarehouse(await persist(payload), original?.id);
    // A valid object with different saved values is also not a confirmed save.
    if (Object.entries(payload).some(([field, value]) => warehouse[field] !== value)) throw new WarehouseResponseError();
    return { status: "saved", warehouse };
  } catch (error) {
    return { status: "failed", ...warehouseErrorFeedback(error, true) };
  } finally {
    lock.current = false;
    onPending(false);
  }
}
