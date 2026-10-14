import { locale, t } from "./index.js";
import { formatNumber } from "../utils/format.js";

export function isolateText(value, direction = "auto") {
  return `${direction === "ltr" ? "\u2066" : "\u2068"}${value ?? ""}\u2069`;
}

export function movementTypeLabel(value) {
  return ["incoming", "outgoing"].includes(value) ? t(`notifications.${value}`) : t("common.unknown");
}

export function roleLabel(value) {
  return ["user", "admin"].includes(value) ? t(`users.roles.${value}`) : t("common.unknown");
}

// The API groups by Gregorian month. Keep those buckets, with Persian month names/digits.
export function formatGregorianMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value || "")) return t("common.notAvailable");
  const date = new Date(`${value}-01T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 7) !== value) return t("common.notAvailable");
  return new Intl.DateTimeFormat(locale, { calendar: "gregory", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export const chartTooltipStyle = { direction: "rtl", textAlign: "start", fontFamily: "var(--font-sans)" };
export const chartLegendStyle = { direction: "rtl", textAlign: "start" };
export function chartValue(value, name) {
  return [formatNumber(value), name];
}
