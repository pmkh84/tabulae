import { t } from "../i18n/index.js";
import ErrorMessage from "./ErrorMessage";

export default function WarehouseRequestFeedback({ request }) {
  if (request.status === "loading") return <p role="status" className="text-sm text-gray-600">{t("warehouses.loading")}</p>;
  if (!["error", "missing"].includes(request.status)) return null;
  return <div className="space-y-2">
    <ErrorMessage message={request.error} />
    <button type="button" onClick={request.retry} className="text-sm text-indigo-600 hover:underline">{t("warehouses.retry")}</button>
  </div>;
}
