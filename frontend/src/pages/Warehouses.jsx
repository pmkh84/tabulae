import PersianPieLabel from "../components/PersianPieLabel";
import { chartValue, chartTooltipStyle, chartLegendStyle, isolateText } from "../i18n/display.js";
import { formatNumber } from "../utils/format.js";
import { t } from "../i18n/index.js";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../context/useAuth";
import {
  getWarehouseDetail,
  getProductsByWarehousePieChart,
} from "../api/stock";
import HoverMessage from "../components/HoverMessage";
import { generateColors } from "../utils/other";
import { useWarehouseRequest } from "../hooks/useWarehouseRequest.js";
import { checkedWarehouseChart } from "../utils/warehouseForm.js";
import WarehouseRequestFeedback from "../components/WarehouseRequestFeedback";
import { warehouseReturnTo } from "../utils/warehouseNavigation.js";

export default function Warehouses() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = warehouseReturnTo(location.state);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedWarehouseName, setSelectedWarehouseName] = useState(null);

  const warehouseLoader = useCallback(async () => checkedWarehouseChart(await getWarehouseDetail(accessToken)), [accessToken]);
  const overview = useWarehouseRequest(warehouseLoader, location.key);
  const warehouses = overview.data ?? [];
  const productLoader = useCallback(async () => selectedWarehouseId == null ? []
    : checkedWarehouseChart(await getProductsByWarehousePieChart(selectedWarehouseId, accessToken)), [selectedWarehouseId, accessToken]);
  const productRequest = useWarehouseRequest(productLoader, location.key);
  const productsByWarehouse = productRequest.data ?? [];

  useEffect(() => {
    document.title = t("navigation.warehouses");
  }, []);

  const handleWarehouseClick = (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    const warehouse = warehouses.find((w) => w.warehouse_id === warehouseId);
    setSelectedWarehouseName(warehouse?.warehouse_name || "");
  };

  const handleProductClick = (productId) => {
    if (!selectedWarehouseId) return;
    navigate(`/stock/warehouse/${selectedWarehouseId}/product/${productId}`);
  };

  const pieColors = generateColors(productsByWarehouse.length);

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.warehouses")}</h1>

          {/* Quick access */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg text-center font-semibold mb-4">
              {t("common.quickAccess")}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {user?.role === "admin" && (
                <Link
                  to="/warehouses/new"
                  state={{ warehouseReturnTo: returnTo }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {"+ " + t("navigation.createWarehouse")}
                </Link>
              )}
              <Link
                to={returnTo}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {"📋 " + t("common.viewList")}
              </Link>
            </div>
          </div>

          {/* Side-by-side charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart: stock by warehouse */}
            <div className="relative group bg-white rounded-lg shadow p-4">
              <h2 className="text-lg text-center font-bold text-gray-700 mb-6">
                {t("charts.stockByWarehouse")}
              </h2>
              <WarehouseRequestFeedback request={overview} />
              {overview.status === "ready" && warehouses.length === 0 && <p className="text-sm text-gray-500">{t("common.empty")}</p>}
              <div className="flex justify-center items-center">
                <div className="overflow-x-auto">
                  <div className="min-w-[400px]">
                    <BarChart width={350} height={200} data={warehouses} style={{ direction: "ltr" }}>
                      <XAxis dataKey="warehouse_name" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={chartLegendStyle} />
                      <Bar
                        dataKey="total_quantity"
                        fill="#3b82f6"
                        onClick={(data) =>
                          handleWarehouseClick(data.warehouse_id)
                        }
                        className="cursor-pointer"
                        name={t("charts.totalStock")}
                      />
                    </BarChart>
                  </div>
                </div>
                <HoverMessage text={t("charts.warehouseHelp")} />
              </div>
            </div>

            {/* Pie chart: products in selected warehouse */}
            <div className="relative group bg-white rounded-lg shadow p-4">
              <h2 className="text-lg text-center font-bold text-gray-700 mb-2">
                {t("charts.productsIn", { name: isolateText(selectedWarehouseName ?? t("charts.selectWarehouse")) })}
              </h2>
              {selectedWarehouseId != null && <WarehouseRequestFeedback request={productRequest} />}
              {selectedWarehouseId != null && productRequest.status === "ready" && productsByWarehouse.length === 0 && <p className="text-sm text-gray-500">{t("stock.emptyWarehouse")}</p>}
              <div className="flex justify-center items-center">
                <div className="overflow-x-auto">
                  <div className="min-w-[400px]">
                    <PieChart width={550} height={300} style={{ direction: "ltr" }}>
                      <Pie
                        data={productsByWarehouse}
                        dataKey="total_quantity"
                        nameKey="product_name"
                        outerRadius={80}
                        label={<PersianPieLabel />}
                        onClick={(data) =>
                          handleProductClick(data.product_id)
                        }
                        className="cursor-pointer"
                      >
                        {productsByWarehouse.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Legend align="right" verticalAlign="middle" width={200} wrapperStyle={chartLegendStyle} />
                      <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </div>
                </div>
                <HoverMessage text={t("charts.productStockHelp")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
