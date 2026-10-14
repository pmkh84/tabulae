import { errorMessage } from "../i18n/errors.js";
import { isolateText } from "../i18n/display.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getStockByWarehouse } from "../api/stock";
import WarehouseStockSummaryTable from "../components/WarehouseStockSummaryTable";
import Pagination from "../components/Pagination";

export default function WarehouseStock() {
  const { warehouse_id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [warehouseName, setWarehouseName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setIsLoading(true);
        const { data, total } = await getStockByWarehouse(
          warehouse_id,
          accessToken,
          limit,
          offset
        );
        setStock(data);
        setTotal(total);

        if (data.length > 0) {
          setWarehouseName(data[0].warehouse_name);
        }
      } catch (error) {
        console.error("Failed to fetch warehouse stock:", error);
        alert(errorMessage(error));
        navigate("/warehouses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();
  }, [warehouse_id, accessToken, limit, offset, navigate]);

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseStock");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("stock.warehouseTitle", { warehouse: isolateText(warehouseName), id: isolateText(warehouse_id, "ltr") })}
          </h1>

          <button
            role="button"
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:underline text-sm"
          >
            {"→ " + t("common.back")}
          </button>

          {isLoading ? (
            <p className="text-sm text-gray-600">{t("common.loading")}</p>
          ) : stock.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t("stock.emptyWarehouse")}
            </p>
          ) : (
            <>
              <WarehouseStockSummaryTable
                stock={stock}
                onViewHistory={(type, item) => {
                  if (type === "product") {
                    navigate(
                      `/stock/warehouse/${item.warehouse_id}/products/${item.product_id}/history`
                    );
                  } else if (type === "total") {
                    navigate(`/stock/warehouse/${item.warehouse_id}/history`);
                  }
                }}
              />

              <Pagination
                total={total}
                limit={limit}
                offset={offset}
                onPageChange={(newOffset) => setOffset(newOffset)}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
