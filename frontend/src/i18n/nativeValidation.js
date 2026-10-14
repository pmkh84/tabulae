import { t } from "./index.js";
import { formatNumber } from "../utils/format.js";

const localizedControls = new WeakSet();

export function nativeValidationMessage(control) {
  const validity = control.validity;
  if (validity.valueMissing) return t("validation.required");
  if (validity.typeMismatch) return t(control.type === "email" ? "validation.email" : "validation.format");
  if (validity.badInput || validity.stepMismatch) return t("validation.number");
  if (validity.tooShort) return t("validation.minLength", { count: formatNumber(control.minLength) });
  if (validity.tooLong) return t("validation.maxLength", { count: formatNumber(control.maxLength) });
  if (validity.rangeUnderflow) return t("validation.minimum", { count: formatNumber(Number(control.min)) });
  if (validity.rangeOverflow) return t("validation.maximum", { count: formatNumber(Number(control.max)) });
  if (validity.patternMismatch) return t(control.name === "sku" || control.id === "sku" ? "validation.sku" : "validation.format");
  return t("errors.validation");
}

export function localizeNativeValidation({ target }) {
  if (typeof target.setCustomValidity !== "function") return;
  // Preserve custom constraints owned by existing components.
  if (target.validity.customError && !localizedControls.has(target)) return;
  target.setCustomValidity(nativeValidationMessage(target));
  localizedControls.add(target);
}

export function clearLocalizedValidation({ target }) {
  if (!localizedControls.has(target)) return;
  target.setCustomValidity("");
  localizedControls.delete(target);
}
