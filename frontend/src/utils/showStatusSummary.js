// Utility: showStatusSummary(res, type = "items", action = "updated")
// Displays a summary message after performing a batch action
import { t } from "../i18n/index.js";
import { formatNumber } from "./format.js";

export function showStatusSummary(
  res,
  type = "items",
  action = "updated"
) {
  // Read the existing numeric response without changing its contract or enum values.
  const parsed = typeof res.message === "string" ? res.message.match(/^(\d+) (products|warehouses|users) updated$/) : null;
  const count = parsed ? Number(parsed[1]) : res.updated?.length;
  const resourceKey = { products: "navigation.products", warehouses: "navigation.warehouses", users: "navigation.users" }[type];
  const actionKey = { activate: "common.activated", activated: "common.activated", deactivate: "common.deactivated", deactivated: "common.deactivated" }[action] || "common.updated";
  const message =
    count === undefined ? t("notifications.updateSuccess") : resourceKey
      ? t("notifications.bulkUpdated", { count: formatNumber(count), resource: t(resourceKey), action: t(actionKey) })
      : t("notifications.updated", { count: formatNumber(count) });
  const skipped = res.skipped || 0;

  // Show an alert with the summary and the number of skipped items if any
  if (skipped > 0) {
    alert(`${message}\n${t("notifications.skipped", { count: formatNumber(skipped) })}`);
  } else {
    alert(message);
  }
}


/*
showStatusSummary(
  { updated: [1, 2, 3], skipped: 1 },
  "products",
  "activated"
);
// ➝ alert: "3 products activated.\n1 products were skipped."
*/
