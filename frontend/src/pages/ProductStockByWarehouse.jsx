import { errorMessage } from "../i18n/errors.js";
import { isolateText } from "../i18n/display.js";
import { chartValue, chartTooltipStyle, chartLegendStyle } from "../i18n/display.js";
import { formatNumber, formatDate } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import {
  getProductStockByWarehouse,
  getProductHistoryByWarehouse,
} from "../api/stock";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import Pagination from "../components/Pagination";

export default function ProductStockByWarehouse() {
  const { warehouse_id, product_id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warehouseName, setWarehouseName] = useState("");
  const [productName, setProductName] = useState("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.title = t("breadcrumbs.productStockByWarehouse");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductStockByWarehouse(
          warehouse_id,
          product_id,
          accessToken,
          limit,
          offset
        );
        setStock(data.data);
        setTotal(data.total);

        if (data.data.length > 0) {
          setWarehouseName(data.data[0].warehouse_name);
          setProductName(data.data[0].product_name);
        }

        const historyData = await getProductHistoryByWarehouse(
          warehouse_id,
          product_id,
          accessToken
        );

        const sorted = [...historyData.data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        let accumulatedStock = 0;
        const chartData = sorted.map((entry) => {
          const moveType = entry.move_type?.toLowerCase().trim();
          const change = moveType === "incoming" ? entry.quantity : -entry.quantity;
          accumulatedStock += change;
          return {
            created_at: entry.created_at?.split("T")[0] ?? "No date",
            quantity: accumulatedStock,
          };
        });

        setHistory(chartData);

      } catch (error) {
        console.error("Error fetching product stock:", error);
        alert(errorMessage(error));
        navigate("/warehouses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [warehouse_id, product_id, accessToken, navigate, limit, offset]);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("stock.productWarehouseTitle", { product: isolateText(productName), warehouse: isolateText(warehouseName), id: isolateText(warehouse_id, "ltr") })}
          </h1>

          <button
            role="button"
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:underline text-sm"
          >
            {"→ " + t("common.back")}
          </button>

          {/* History chart */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("charts.stockHistory")}
          </h2>
          <div className="bg-white rounded shadow p-4">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("stockMovements.emptyProduct")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <LineChart width={600} height={300} data={history} style={{ direction: "ltr" }}>
                    <XAxis dataKey="created_at" tickFormatter={(value) => formatDate(value)} />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} labelFormatter={(value) => formatDate(value)} />
                    <Legend wrapperStyle={chartLegendStyle} />
                    <Line type="monotone" dataKey="quantity" stroke="#10b981" name={t("common.quantity")} />
                  </LineChart>
                </div>
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("stock.current")}
          </h2>
          {isLoading ? (
            <p className="text-sm text-gray-600">{t("common.loading")}</p>
          ) : stock.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t("stock.emptyProductWarehouse")}
            </p>
          ) : (
            <div className="overflow-x-auto bg-white shadow rounded">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
                <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{t("common.sku")}</th>
                    <th className="px-4 py-3">{t("common.lot")}</th>
                    <th className="px-4 py-3">{t("common.expiration")}</th>
                    <th className="px-4 py-3">{t("common.quantity")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stock.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2"><bdi dir="ltr">{item.sku}</bdi></td>
                      <td className="px-4 py-2"><bdi dir="ltr">{item.lot}</bdi></td>
                      <td className="px-4 py-2">
                        {formatDate(item.expiring)}
                      </td>
                      <td className="px-4 py-2">{formatNumber(item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            total={total}
            limit={limit}
            offset={offset}
            onPageChange={(newOffset) => setOffset(newOffset)}
          />
        </div>
      </div>
    </>
  );
}
