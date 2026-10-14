import { t } from "./index.js";
import { formatNumber } from "../utils/format.js";

const fieldKeys = {
  name: "common.name", short_name: "common.shortName", email: "common.email",
  password: "common.password", sku: "common.sku", category_id: "common.category",
  description: "common.description", role: "common.role", is_active: "common.status",
  id: "common.id", ids: "common.id", quantity: "common.quantity", lot: "common.lot",
  warehouse_id: "common.warehouse", product_id: "common.product",
  expiration_date: "common.expiration", move_type: "stockMovements.type",
  lines: "stockMovements.lines", date_from: "common.fromDate", from_date: "common.fromDate",
  date_to: "common.toDate", to_date: "common.toDate",
};

export function validationMessage(issue) {
  const { type } = issue;
  const ctx = issue.ctx && typeof issue.ctx === "object" ? issue.ctx : {};
  const loc = Array.isArray(issue.loc) ? issue.loc : [];
  const field = loc.at(-1);
  const count = (value) => ({ count: formatNumber(Number(value)) });
  const numericConstraint = ({ string_too_short: "min_length", string_too_long: "max_length", greater_than: "gt", greater_than_equal: "ge", less_than: "lt", less_than_equal: "le" })[type];
  if (numericConstraint && (ctx[numericConstraint] == null || !Number.isFinite(Number(ctx[numericConstraint])))) return t("errors.validation");
  if (type === "missing") return t("validation.required");
  if (field === "email") return t("validation.email");
  if (type === "string_too_short") return t("validation.minLength", count(ctx.min_length));
  if (type === "string_too_long") return t("validation.maxLength", count(ctx.max_length));
  if (type === "string_pattern_mismatch") return t(field === "sku" ? "validation.sku" : "validation.format");
  if (type === "greater_than") return t("validation.greaterThan", count(ctx.gt));
  if (type === "greater_than_equal") return t("validation.minimum", count(ctx.ge));
  if (type === "less_than") return t("validation.lessThan", count(ctx.lt));
  if (type === "less_than_equal") return t("validation.maximum", count(ctx.le));
  if (/^(int|float|decimal|finite_number)/.test(type || "")) return t("validation.number");
  if (/^(date|datetime)/.test(type || "")) return t("validation.date");
  if (["literal_error", "enum", "bool_parsing", "bool_type"].includes(type)) return t("validation.choice");
  if (field === "lines" && type === "too_short") return t("errors.linesRequired");
  if (field === "lines" && type === "too_long") return t("errors.linesMaximum");
  return t("errors.validation");
}

export function localizeValidationErrors(detail) {
  return detail.map((originalIssue) => {
    const issue = originalIssue && typeof originalIssue === "object" ? originalIssue : {};
    const path = Array.isArray(issue.loc) ? [...issue.loc] : [];
    const key = fieldKeys[path.at(-1)];
    const row = path.find((part) => typeof part === "number");
    const label = [
      row === undefined ? "" : t("validation.line", { number: formatNumber(row + 1) }),
      key ? t(key) : t("common.unknown"),
    ].filter(Boolean).join(" — ");
    const message = validationMessage(issue);
    return { path, field: path.at(-1), message, display: t("validation.field", { field: label, message }) };
  });
}

export function backendErrorMessage(detail, status) {
  if (typeof detail === "string") {
    const message = detail.trim().toLowerCase().replace(/\.$/, "");
    const exact = {
      "invalid credentials": "errors.credentials", "incorrect password": "auth.incorrectPassword",
      "email is already registered": "errors.duplicateEmail", "email is already in use": "errors.duplicateEmail",
      "sku is already registered": "errors.duplicateSku", "sku is already in use": "errors.duplicateSku",
      "product not found": "errors.productNotFound", "warehouse not found": "errors.warehouseNotFound",
      "category not found": "errors.categoryNotFound", "the specified category does not exist": "errors.categoryNotFound",
      "user not found": "errors.userNotFound", "user not found or deleted": "errors.userNotFound",
      "movement not found": "errors.movementNotFound", "this warehouse is inactive": "errors.warehouseInactive",
      "invalid role. must be 'user' or 'admin'": "errors.invalidRole",
      "warehouse must be inactive before it can be deleted": "errors.warehouseMustBeInactive",
      "a category with that name already exists": "errors.duplicateCategory",
      "another category with that name already exists": "errors.duplicateCategory",
      "this product still has remaining stock and cannot be deactivated": "errors.productStock",
      "the movement must contain at least one line": "errors.linesRequired",
      "the maximum number of allowed lines is 100": "errors.linesMaximum",
    };
    if (Object.hasOwn(exact, message)) return t(exact[message]);
    if (message.startsWith("user is inactive")) return t("errors.inactiveUser");
    if (/^(invalid (refresh )?token|token |refresh token |not authenticated)/.test(message)) return t("errors.session");
    if (message.startsWith("you do not have permission")) return t("errors.forbidden");
    if (/^warehouse \d+ is not empty/.test(message)) return t("errors.warehouseStock");
    if (/^(cannot delete.*registered movements|this product has associated movements)/.test(message)) return t("errors.hasMovements");
    if (message.startsWith("this category cannot be deleted")) return t("errors.categoryHasProducts");
    if (message.startsWith("the following warehouses")) return t("errors.inactiveWarehouses");
    if (message.startsWith("the following products")) return t("errors.inactiveProducts");
    if (/expired|expiration date.*past/.test(message)) return t("errors.expiredLot");
    if (/insufficient stock/.test(message)) return t("errors.insufficientStock");
    if (/different expiration date|no lot.*expiration|expiration.*no lot/.test(message)) return t("errors.lotExpiration");
    if (/integrity error|invalid reference/.test(message)) return t("errors.integrity");
    if (/date range|start date|end date/.test(message)) return t("errors.dateRange");
    if (/preset|from_date|to_date/.test(message)) return t("errors.expirationFilter");
  }
  if (status === 401) return t("errors.session");
  if (status === 403) return t("errors.forbidden");
  if (status === 404) return t("errors.notFound");
  if (status === 409) return t("errors.duplicate");
  if (status === 422 || status === 400) return t("errors.validation");
  if (status >= 500) return t("errors.server");
  return t("errors.unexpected");
}

export class LocalizedApiError extends Error {
  constructor(detail, status, cause) {
    const fieldErrors = Array.isArray(detail) ? localizeValidationErrors(detail) : [];
    super(fieldErrors.length ? fieldErrors.map((error) => error.display).join("\n") : backendErrorMessage(detail, status), { cause });
    this.name = "LocalizedApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    // Retain raw response details for diagnostics without rendering/logging input values by default.
    Object.defineProperty(this, "detail", { value: detail });
  }
}

export function errorMessage(error) {
  if (error instanceof LocalizedApiError) return error.message;
  if (/failed to fetch|fetch failed|networkerror|network request/i.test(error?.message || "")) return t("errors.network");
  return t("errors.unexpected");
}

// The same fetch arguments and successful Response object are preserved.
export async function apiFetch(input, options) {
  let response;
  try {
    response = await fetch(input, options);
  } catch (cause) {
    const error = new LocalizedApiError(null, 0, cause);
    error.message = t("errors.network");
    throw error;
  }
  if (!response.ok) {
    let detail;
    try {
      const body = await response.clone().json();
      detail = body.detail ?? body.message;
    } catch {
      detail = await response.clone().text();
    }
    throw new LocalizedApiError(detail, response.status);
  }
  return response;
}
