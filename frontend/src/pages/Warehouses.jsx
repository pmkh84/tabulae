import { errorMessage } from "../i18n/errors.js";
import PersianPieLabel from "../components/PersianPieLabel";
import { chartValue, chartTooltipStyle, chartLegendStyle, isolateText } from "../i18n/display.js";
import { formatNumber } from "../utils/format.js";
import { t } from "../i18n/index.js";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

export default function Warehouses() {
  const [loadError, setLoadError] = useState("");
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [productsByWarehouse, setProductsByWarehouse] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedWarehouseName, setSelectedWarehouseName] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError("");
        const data = await getWarehouseDetail(accessToken);
        setWarehouses(data);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error loading stock by warehouse:", error);
      }
    };

    fetchData();
  }, [accessToken]);

  useEffect(() => {
    document.title = t("navigation.warehouses");
  }, []);

  const handleWarehouseClick = async (warehouseId) => {
    try {
      setLoadError("");
      setSelectedWarehouseId(warehouseId);
      const warehouse = warehouses.find((w) => w.warehouse_id === warehouseId);
      setSelectedWarehouseName(warehouse?.warehouse_name || "");
      const products = await getProductsByWarehousePieChart(
        warehouseId,
        accessToken
      );
      setProductsByWarehouse(products);
    } catch (error) {
      setLoadError(errorMessage(error));
      console.error("Error fetching products by warehouse:", error.message);
    }
  };

  const handleProductClick = (productId) => {
    if (!selectedWarehouseId) return;
    navigate(`/stock/warehouse/${selectedWarehouseId}/product/${productId}`);
  };

  const pieColors = generateColors(productsByWarehouse.length);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {"+ " + t("navigation.createWarehouse")}
                </Link>
              )}
              <Link
                to="/warehouses/list"
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
