import { t } from "./index.js";

// Translate the existing WebSocket presentation without changing its payload or storage.
export function translateNotification(message) {
  if (typeof message !== "string") return t("notifications.new");

  const movement = message.match(
    /^New stock movement recorded: (\d+) \((incoming|outgoing)\)$/
  );
  if (!movement) return t("notifications.new");

  return t("notifications.stockMovement", {
    // Keep the technical ID in Latin digits and isolate it within the Persian sentence.
    id: `\u2066${movement[1]}\u2069`,
    type: t(`notifications.${movement[2]}`),
  });
}
