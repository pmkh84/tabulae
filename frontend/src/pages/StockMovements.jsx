import { errorMessage } from "../i18n/errors.js";
import { chartValue, chartTooltipStyle, formatGregorianMonth, movementTypeLabel } from "../i18n/display.js";
import { formatNumber } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../context/useAuth";
import {
  countStockMovesByMoveType,
  movementsLastYearByMonth,
} from "../api/stock_moves";

export default function StockMovements() {
  const [loadError, setLoadError] = useState("");
  const { accessToken } = useAuth();
  const [byTypeData, setByTypeData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError("");
        const data = await countStockMovesByMoveType({ accessToken });
        setByTypeData(data);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error loading movement type data:", error);
      }
    };

    fetchData();
  }, [accessToken]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoadError("");
        const data = await movementsLastYearByMonth(accessToken);
        setMonthlyData(data);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error loading monthly data:", error);
      }
    };

    fetchMonthlyData();
  }, [accessToken]);

  useEffect(() => {
    document.title = t("navigation.stockMovements");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.stockMovements")}</h1>

          {/* Quick Access */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg text-center font-semibold mb-4">
              {t("common.quickAccess")}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/stock-movements/new"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {"+ " + t("navigation.createMovement")}
              </Link>
              <Link
                to="/stock-movements/list"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {"📋 " + t("common.viewList")}
              </Link>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart by Move Type */}
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-lg font-semibold mb-4">{t("charts.movementsByType")}</h2>
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={byTypeData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      style={{ direction: "ltr" }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="move_type" tickFormatter={(value) => movementTypeLabel(value)} />
                      <YAxis allowDecimals={false} tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} labelFormatter={(value) => movementTypeLabel(value)} />
                      <Bar dataKey="quantity" fill="#6366F1" name={t("common.quantity")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Line Chart by Month */}
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-lg font-semibold mb-4">
                {t("charts.monthlyTrend")}
              </h2>
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      style={{ direction: "ltr" }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={(value) => formatGregorianMonth(value)} />
                      <YAxis allowDecimals={false} tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} labelFormatter={(value) => formatGregorianMonth(value)} />
                      <Line
                        type="monotone"
                        dataKey="incoming"
                        stroke="#22C55E"
                        name={t("notifications.incoming")}
                      />
                      <Line
                        type="monotone"
                        dataKey="outgoing"
                        stroke="#EF4444"
                        name={t("notifications.outgoing")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
