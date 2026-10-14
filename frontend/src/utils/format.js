import { locale, t } from "../i18n/index.js";

export function formatNumber(value, options = {}) {
  if (
    (typeof value !== "number" && typeof value !== "bigint") ||
    (typeof value === "number" && !Number.isFinite(value))
  ) {
    return t("common.notAvailable");
  }

  return new Intl.NumberFormat(locale, options).format(value);
}

function isValidDateOnly(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function dateContext(value) {
  if (value instanceof Date || typeof value === "number") {
    const date = new Date(value instanceof Date ? value.getTime() : value);
    return Number.isFinite(date.getTime()) ? { date, timeZone: "UTC" } : null;
  }

  if (typeof value !== "string") return null;

  // Calendar dates have no time zone: never shift them to the previous/next day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return isValidDateOnly(value)
      ? { date: new Date(`${value}T00:00:00Z`), dateOnly: true, timeZone: "UTC" }
      : null;
  }

  // Require an explicit zone instead of guessing the zone of a naive timestamp.
  const timestamp = value.match(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/
  );
  if (!timestamp || !isValidDateOnly(value.slice(0, 10))) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return { date, timeZone: timestamp[1] === "Z" ? "UTC" : timestamp[1] };
}

function formatDateValue(value, options) {
  const context = dateContext(value);
  if (!context) return t("common.notAvailable");

  return new Intl.DateTimeFormat(locale, {
    calendar: "persian",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
    // Preserve a timestamp's supplied offset unless the caller explicitly requests a zone.
    // Date objects/epoch numbers carry no source zone, so their default is UTC.
    timeZone: context.dateOnly ? "UTC" : options.timeZone ?? context.timeZone,
  }).format(context.date);
}

export function formatDate(value, options = {}) {
  return formatDateValue(value, options);
}

export function formatDateTime(value, options = {}) {
  return formatDateValue(value, {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}
