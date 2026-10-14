import { t } from "./index.js";
import { formatNumber } from "../utils/format.js";

export const selectResultStatus = ({ count }) => t("select.results", { count: formatNumber(count) });
export const selectLiveMessages = {
  guidance: () => t("select.guidance"),
  onChange: ({ action, label, labels, isDisabled }) => {
    if (isDisabled) return t("select.disabled");
    if (action === "clear") return t("select.cleared");
    const name = label || labels?.join("، ") || "";
    if (!name) return t("select.guidance");
    return t(["remove-value", "pop-value", "deselect-option"].includes(action) ? "select.removed" : "select.selected", { label: name });
  },
  onFilter: ({ resultsMessage }) => resultsMessage,
  onFocus: ({ label, isDisabled }) => isDisabled ? t("select.disabled") : t("select.focused", { label }),
};
