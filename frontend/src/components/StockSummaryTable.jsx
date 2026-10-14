import { formatNumber } from "../utils/format.js";
import { t } from "../i18n/index.js";
export default function StockSummaryTable({ stock, onViewHistory }) {
  const totalQuantity = stock.reduce(
    (sum, item) => sum + item.total_quantity,
    0
  );

  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
        <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
          <tr>
            <th className="px-4 py-3">{t("common.warehouse")}</th>
            <th className="px-4 py-3">{t("common.warehouseId")}</th>
            <th className="px-4 py-3">{t("common.totalQuantity")}</th>
            <th className="px-4 py-3">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stock.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2"><bdi>{item.warehouse_name}</bdi></td>
              <td className="px-4 py-2"><bdi dir="ltr">{item.warehouse_id}</bdi></td>
              <td className="px-4 py-2">{formatNumber(item.total_quantity)}</td>
              <td className="px-4 py-2">
                <button
                  role="button"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  onClick={() => item && onViewHistory?.("warehouse", item)}
                >
                  {t("common.viewWarehouseHistory")}
                </button>
              </td>
            </tr>
          ))}

          {/* Total row */}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2" colSpan={2}>
              {t("common.total")}
            </td>
            <td className="px-4 py-2">{formatNumber(totalQuantity)}</td>
            <td className="px-4 py-2">
              <button
                role="button"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                onClick={() => stock[0] && onViewHistory?.("total", stock[0])}
              >
                {t("common.viewTotalHistory")}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
