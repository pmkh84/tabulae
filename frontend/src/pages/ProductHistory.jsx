import { errorMessage } from "../i18n/errors.js";
import { isolateText, chartValue, chartTooltipStyle, chartLegendStyle, movementTypeLabel } from "../i18n/display.js";
import { formatNumber, formatDate } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { getProductHistory } from "../api/stock";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import Pagination from "../components/Pagination";

export default function ProductHistory() {
  const [loadError, setLoadError] = useState("");
  const { id } = useParams();
  const { accessToken } = useAuth();

  const [stockChart, setStockChart] = useState([]);
  const [historyTable, setHistoryTable] = useState([]);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [sku, setSku] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Stock evolution chart (limit = 100)
  useEffect(() => {
    const fetchChart = async () => {
      try {
        setLoadError("");
        const data = await getProductHistory(id, accessToken, 100, 0);
        if (data.data.length > 0) {
          setSku(data.data[0].sku);
        }

        const sorted = [...data.data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        let stock = 0;
        const accumulated = sorted.map((mov) => {
          const moveType = mov.move_type?.toLowerCase().trim();
          const change = moveType === "incoming" ? mov.quantity : -mov.quantity;
          stock += change;
          return {
            created_at: mov.created_at?.split("T")[0] ?? "No date",
            quantity: stock,
          };
        });

        setStockChart(accumulated);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error fetching chart data:", error.message);
      }
    };

    fetchChart();
  }, [id, accessToken]);

  useEffect(() => {
    document.title = t("breadcrumbs.productHistory");
  }, []);

  // Table data (limit = 10, paginated)
  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoadError("");
        setIsLoading(true);
        const data = await getProductHistory(id, accessToken, limit, offset);
        setHistoryTable(data.data);
        setTotal(data.total);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error fetching history:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTable();
  }, [id, accessToken, limit, offset]);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("stock.productHistoryTitle", { sku: isolateText(sku, "ltr") })}
        </h1>
        <button
          role="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {"→ " + t("common.back")}
        </button>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            {t("charts.stockEvolution")}
          </h2>
          {stockChart.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <LineChart width={600} height={250} data={stockChart} style={{ direction: "ltr" }}>
                  <XAxis dataKey="created_at" tickFormatter={(value) => formatDate(value)} />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} labelFormatter={(value) => formatDate(value)} />
                  <Legend wrapperStyle={chartLegendStyle} />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t("common.quantity")}
                  />
                </LineChart>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("common.noData")}</p>
          )}
        </div>

        {/* Table */}
        <h2 className="text-lg font-bold text-gray-700">
          {t("stockMovements.history")}
        </h2>

        <div className="bg-white shadow rounded overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loadingHistory")}</p>
          ) : historyTable.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t("stockMovements.empty")}
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
              <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-2">{t("common.movementId")}</th>
                  <th className="px-4 py-2">{t("common.date")}</th>
                  <th className="px-4 py-2">{t("common.type")}</th>
                  <th className="px-4 py-2">{t("common.sku")}</th>
                  <th className="px-4 py-2">{t("common.lot")}</th>
                  <th className="px-4 py-2">{t("common.quantity")}</th>
                  <th className="px-4 py-2">{t("common.warehouse")}</th>
                  <th className="px-4 py-2">{t("common.user")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyTable.map((h, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2"><bdi dir="ltr">{h.move_id}</bdi></td>
                    <td className="px-4 py-2">
                      {formatDate(h.created_at)}
                    </td>
                    <td className="px-4 py-2 capitalize">{movementTypeLabel(h.move_type)}</td>
                    <td className="px-4 py-2"><bdi dir="ltr">{h.sku}</bdi></td>
                    <td className="px-4 py-2"><bdi dir="ltr">{h.lot}</bdi></td>
                    <td className="px-4 py-2">{formatNumber(h.quantity)}</td>
                    <td className="px-4 py-2"><bdi dir="ltr">{h.warehouse_id}</bdi></td>
                    <td className="px-4 py-2"><bdi>{h.user_name}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
        />
      </div>
    </>
  );
}
