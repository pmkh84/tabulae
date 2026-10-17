import { isolateText, chartValue, chartTooltipStyle, chartLegendStyle, movementTypeLabel } from "../i18n/display.js";
import { formatNumber, formatDate } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getWarehouseHistory } from "../api/stock";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import Pagination from "../components/Pagination";
import { checkedWarehouseStockPage, warehouseErrorFeedback } from "../utils/warehouseForm.js";
import { warehouseListContext, warehouseReturnTo, warehouseStockReturnTo, updateWarehouseQuery } from "../utils/warehouseNavigation.js";

export default function WarehouseStockHistory() {
  const [loadError, setLoadError] = useState("");
  const { warehouse_id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = warehouseReturnTo(location.state);
  const stockReturnTo = warehouseStockReturnTo(location.state, warehouse_id);
  const [searchParams, setSearchParams] = useSearchParams();
  const { offset } = warehouseListContext(searchParams);
  const [revision, setRevision] = useState(0);
  const [tableError, setTableError] = useState("");
  const [chartLoading, setChartLoading] = useState(true);

  const [warehouseName, setWarehouseName] = useState("");
  const [stockChart, setStockChart] = useState([]);
  const [historyTable, setHistoryTable] = useState([]);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load chart data (once)
  useEffect(() => {
    let current = true;
    const fetchChart = async () => {
      try {
        setChartLoading(true);
        setStockChart([]); setWarehouseName("");
        setLoadError("");
        const result = await getWarehouseHistory(
          warehouse_id,
          accessToken,
          100
        );
        if (!current) return;
        const data = checkedWarehouseStockPage(result).data;

        if (data.length > 0) {
          setWarehouseName(data[0].warehouse_name || "");
        }

        const sorted = [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        let stock = 0;
        const cumulative = sorted.map((mov) => {
          const delta = mov.move_type === "incoming" ? mov.quantity : -mov.quantity;
          stock += delta;
          return {
            created_at: mov.created_at.split("T")[0],
            quantity: stock,
          };
        });

        setStockChart(cumulative);
      } catch (error) {
        if (current) setLoadError(warehouseErrorFeedback(error).message);
      } finally { if (current) setChartLoading(false); }
    };

    fetchChart();
    return () => { current = false; };
  }, [warehouse_id, accessToken, revision]);

  // Load table data (with pagination)
  useEffect(() => {
    let current = true;
    const fetchTable = async () => {
      try {
        setIsLoading(true);
        setTableError(""); setHistoryTable([]); setTotal(0);
        const result = await getWarehouseHistory(
          warehouse_id,
          accessToken,
          limit,
          offset
        );
        if (!current) return;
        checkedWarehouseStockPage(result);
        setHistoryTable(result.data);
        setTotal(result.total);
      } catch (error) {
        if (current) setTableError(warehouseErrorFeedback(error).message);
      } finally {
        if (current) setIsLoading(false);
      }
    };

    fetchTable();
    return () => { current = false; };
  }, [warehouse_id, accessToken, limit, offset, revision]);

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseStockHistory");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ warehouseReturnTo: returnTo, warehouseStockReturnTo: stockReturnTo }} linkTargets={{ "/warehouses/list": returnTo, [`/stock/warehouse/${warehouse_id}`]: stockReturnTo }} />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("stock.warehouseHistoryTitle", { warehouse: isolateText(warehouseName), id: isolateText(warehouse_id, "ltr") })}
          </h1>

          <button
            role="button"
            onClick={() => navigate(stockReturnTo, { state: { warehouseReturnTo: returnTo } })}
            className="text-indigo-600 hover:underline text-sm"
          >
            {"→ " + t("common.back")}
          </button>

          {/* Chart */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {t("charts.stockEvolution")}
            </h2>
            {chartLoading ? <p role="status" className="text-sm text-gray-600">{t("common.loading")}</p> : loadError ? <p role="alert" className="text-sm text-red-600">{loadError}</p> : stockChart.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <LineChart width={600} height={300} data={stockChart} style={{ direction: "ltr" }}>
                    <XAxis dataKey="created_at" tickFormatter={(value) => formatDate(value)} />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} labelFormatter={(value) => formatDate(value)} />
                    <Legend wrapperStyle={chartLegendStyle} />
                    <Line type="monotone" dataKey="quantity" stroke="#3b82f6" name={t("common.quantity")} />
                  </LineChart>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t("charts.notEnoughData")}
              </p>
            )}
          </div>

          {/* Table */}
          <h2 className="text-lg font-semibold text-gray-700">
            {t("stockMovements.history")}
          </h2>

          <div className="bg-white shadow rounded overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500">{t("common.loadingHistory")}</p>
            ) : tableError ? <p role="alert" className="text-sm text-red-600">{tableError}</p> : historyTable.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("stockMovements.empty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
                  <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="px-4 py-2">{t("common.movementId")}</th>
                      <th className="px-4 py-2">{t("common.date")}</th>
                      <th className="px-4 py-2">{t("common.type")}</th>
                      <th className="px-4 py-2">{t("common.sku")}</th>
                      <th className="px-4 py-2">{t("common.lot")}</th>
                      <th className="px-4 py-2">{t("common.quantity")}</th>
                      <th className="px-4 py-2">{t("common.product")}</th>
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
                        <td className="px-4 py-2"><bdi dir="ltr">{h.product_id}</bdi></td>
                        <td className="px-4 py-2"><bdi>{h.user_name}</bdi></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(loadError || tableError) && <button type="button" onClick={() => setRevision((value) => value + 1)} className="text-sm text-indigo-600 hover:underline">{t("warehouses.retry")}</button>}

          {/* Pagination */}
          <Pagination
            total={total}
            limit={limit}
            offset={offset}
            onPageChange={(value) => setSearchParams(updateWarehouseQuery(searchParams, { offset: value }), { replace: true })}
          />
        </div>
      </div>
    </>
  );
}
