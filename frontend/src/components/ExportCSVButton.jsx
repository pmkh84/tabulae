import { t } from "../i18n/index.js";
export default function ExportCSVButton({ onExport, label = t("common.exportCSV") }) {
  return (
    <button
      role="button"
      onClick={onExport}
      className="h-[36px] bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded text-sm"
    >
      {label}
    </button>
  );
}
