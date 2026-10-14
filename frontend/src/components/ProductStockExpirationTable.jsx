import { formatNumber, formatDate } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { useNavigate } from "react-router-dom";

export default function ProductStockExpirationTable({
  stock,
  onViewHistory,
  showActions = true,
}) {
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
        <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
          <tr>
            <th className="px-4 py-3">{t("common.warehouse")}</th>
            <th className="px-4 py-3">{t("common.product")}</th>
            <th className="px-4 py-3">{t("common.sku")}</th>
            <th className="px-4 py-3">{t("common.lot")}</th>
            <th className="px-4 py-3">{t("common.expiration")}</th>
            <th className="px-4 py-3">{t("common.quantity")}</th>
            {showActions && <th className="px-4 py-3">{t("common.actions")}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stock.map((line, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2"><bdi>{line.warehouse_name}</bdi></td>
              <td className="px-4 py-2"><bdi>{line.product_name}</bdi></td>
              <td className="px-4 py-2"><bdi dir="ltr">{line.sku}</bdi></td>
              <td className="px-4 py-2"><bdi dir="ltr">{line.lot}</bdi></td>
              <td className="px-4 py-2">{formatDate(line.expiration_date)}</td>
              <td className="px-4 py-2">{formatNumber(line.quantity)}</td>
              {showActions && (
                <td className="px-4 py-2 space-y-1">
                  <button
                    role="button"
                    className="block text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    onClick={() => line && onViewHistory?.(line)}
                  >
                    {t("common.viewHistory")}
                  </button>
                  <button
                    role="button"
                    className="block text-green-600 hover:text-green-800 font-medium text-sm"
                    onClick={() =>
                      navigate("/stock-movements/new", {
                        state: {
                          type: "outgoing",
                          line: {
                            product_id: line.product_id,
                            warehouse_id: line.warehouse_id,
                            lot: line.lot,
                            expiration_date: line.expiration_date,
                            quantity: line.quantity,
                            product_label: line.product_name,
                            warehouse_label: line.warehouse_name,
                          },
                        },
                      })
                    }
                  >
                    {t("stockMovements.createOutgoing")}
                  </button>
                </td>
              )}
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2" colSpan={5}>
              {t("common.totalQuantity")}
            </td>
            <td className="px-4 py-2">{formatNumber(totalQuantity)}</td>
            <td className="px-4 py-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
