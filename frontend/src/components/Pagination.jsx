import { t } from "../i18n/index.js";
import { formatNumber } from "../utils/format.js";

export default function Pagination({ total, limit, offset, onPageChange }) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handlePrevious = () => {
    if (offset > 0) onPageChange(offset - limit);
  };

  const handleNext = () => {
    if (offset + limit < total) onPageChange(offset + limit);
  };

  return (
    <nav aria-label={t("pagination.label")} className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 gap-2">
      <div>
        {total === 0 ? t("pagination.empty") : (
          <>
            {t("pagination.page", {
              current: formatNumber(currentPage),
              total: formatNumber(totalPages),
            })}
            {" — "}
            {t("pagination.range", {
              from: formatNumber(offset + 1),
              to: formatNumber(Math.min(offset + limit, total)),
              total: formatNumber(total),
            })}
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button
          role="button"
          type="button"
          onClick={handlePrevious}
          disabled={offset === 0}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {t("pagination.previous")}
        </button>
        <button
          role="button"
          type="button"
          onClick={handleNext}
          disabled={offset + limit >= total}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {t("pagination.next")}
        </button>
      </div>
    </nav>
  );
}
