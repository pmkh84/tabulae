import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { chartValue, chartTooltipStyle, chartLegendStyle, isolateText } from "../i18n/display.js";
import PersianPieLabel from "../components/PersianPieLabel";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { getStockByCategory, getProductsByCategory } from "../api/stock";
import { useAuth } from "../context/useAuth";
import { generateColors } from "../utils/other";
import HoverMessage from "../components/HoverMessage";

export default function Products() {
  const [loadError, setLoadError] = useState("");
  const [categoryData, setCategoryData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productsInCategory, setProductsInCategory] = useState([]);
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError("");
        const data = await getStockByCategory(accessToken);
        setCategoryData(data);
      } catch (err) {
        setLoadError(errorMessage(err));
        console.error("Error fetching stock by category:", err.message);
      }
    };

    fetchData();
  }, [accessToken]);

  useEffect(() => {
    document.title = t("navigation.products");
  }, []);

  const goToExpiration = () => {
    navigate("/expiration?preset=expiring_soon");
  };

  const categoryColors = generateColors(categoryData.length);
  const productColors = generateColors(productsInCategory.length);

  const handleCategoryClick = async (category) => {
    try {
      setLoadError("");
      setSelectedCategory(category);
      const products = await getProductsByCategory(
        category.category_id,
        accessToken
      );
      setProductsInCategory(products);
    } catch (error) {
      setLoadError(errorMessage(error));
      console.error("Error loading products by category:", error.message);
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.products")}</h1>

          {/* Quick access buttons */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg text-center font-semibold mb-4">
              {t("common.quickAccess")}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {user?.role === "admin" && (
                <Link
                  to="/products/new"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {"+ " + t("navigation.createProduct")}
                </Link>
              )}
              <Link
                to="/products/list"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {"📋 " + t("common.viewList")}
              </Link>
              <button
                role="button"
                onClick={goToExpiration}
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {"🧪 " + t("navigation.expiringProducts")}
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie: Stock by category */}
            <div className="relative group bg-white rounded-lg shadow p-4">
              <h2 className="text-center text-lg font-semibold text-gray-700 mb-4">
                {t("charts.stockByCategory")}
              </h2>
              <div className="flex justify-center items-center">
                {categoryData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[400px]">
                      <PieChart style={{ direction: "ltr" }} width={550} height={250}>
                        <Pie
                          data={categoryData}
                          dataKey="total_quantity"
                          nameKey="category_name"
                          outerRadius={80}
                          label={<PersianPieLabel />}
                          onClick={(data) => handleCategoryClick(data)}
                          className="cursor-pointer"
                        >
                          {categoryData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={
                                categoryColors[index % categoryColors.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} />
                        <Legend wrapperStyle={chartLegendStyle} align="right" verticalAlign="middle" width={200} />
                      </PieChart>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t("common.loading")}</p>
                )}
              </div>
              <HoverMessage text={t("charts.categoryHelp")} />
            </div>

            {/* Pie: Products in selected category */}
            {selectedCategory && (
              <div className="relative group bg-white rounded-lg shadow p-4">
                <h2 className="text-center text-lg font-semibold text-gray-700 mb-4">
                  {t("charts.productsIn", { name: isolateText(selectedCategory.category_name) })}
                </h2>
                <div className="flex justify-center items-center">
                  {productsInCategory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-[400px]">
                        <PieChart style={{ direction: "ltr" }} width={550} height={250}>
                          <Pie
                            data={productsInCategory}
                            dataKey="total_quantity"
                            nameKey="product_name"
                            outerRadius={80}
                            label={<PersianPieLabel />}
                            onClick={(data) =>
                              navigate(`/products/${data.product_id}`)
                            }
                            className="cursor-pointer"
                          >
                            {productsInCategory.map((_, index) => (
                              <Cell
                                key={index}
                                fill={
                                  productColors[index % productColors.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={chartValue} contentStyle={chartTooltipStyle} />
                          <Legend wrapperStyle={chartLegendStyle} align="right" verticalAlign="middle" width={200} />
                        </PieChart>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("products.emptyCategory")}
                    </p>
                  )}
                </div>
                <HoverMessage text={t("charts.productDetailHelp")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
