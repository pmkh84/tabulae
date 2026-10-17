import { isolateText } from "../i18n/display.js";
import { t } from "../i18n/index.js";
import { useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getStockByWarehouse } from "../api/stock";
import WarehouseStockSummaryTable from "../components/WarehouseStockSummaryTable";
import Pagination from "../components/Pagination";
import WarehouseRequestFeedback from "../components/WarehouseRequestFeedback";
import { useWarehouseRequest } from "../hooks/useWarehouseRequest.js";
import { checkedWarehouseStockPage } from "../utils/warehouseForm.js";
import { warehouseListContext, warehouseReturnTo, warehousePageOffset, updateWarehouseQuery } from "../utils/warehouseNavigation.js";

export default function WarehouseStock() {
  const { warehouse_id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { offset } = warehouseListContext(searchParams);
  const returnTo = warehouseReturnTo(location.state);
  const navigationState = { warehouseReturnTo: returnTo, warehouseStockReturnTo: location.pathname + location.search };
  const limit = 10;
  const loader = useCallback(async () => checkedWarehouseStockPage(await getStockByWarehouse(warehouse_id, accessToken, limit, offset)), [warehouse_id, accessToken, offset]);
  const request = useWarehouseRequest(loader, location.key);
  const stock = request.data?.data ?? [];
  const total = request.data?.total ?? 0;
  const warehouseName = stock[0]?.warehouse_name ?? "";
  useEffect(() => {
    if (request.status !== "ready") return;
    const next = warehousePageOffset(offset, total, limit);
    if (next !== offset) setSearchParams(updateWarehouseQuery(searchParams, { offset: next }), { replace: true });
  }, [request.status, offset, total, searchParams, setSearchParams]);

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseStock");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={navigationState} linkTargets={{ "/warehouses/list": returnTo }} />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("stock.warehouseTitle", { warehouse: isolateText(warehouseName), id: isolateText(warehouse_id, "ltr") })}
          </h1>

          <button
            role="button"
            onClick={() => navigate(returnTo)}
            className="text-indigo-600 hover:underline text-sm"
          >
            {"→ " + t("common.back")}
          </button>

          <WarehouseRequestFeedback request={request} />
          {request.status !== "ready" ? null : stock.length === 0 ? (
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
                      `/stock/warehouse/${item.warehouse_id}/products/${item.product_id}/history`, { state: navigationState }
                    );
                  } else if (type === "total") {
                    navigate(`/stock/warehouse/${item.warehouse_id}/history`, { state: navigationState });
                  }
                }}
              />

              <Pagination
                total={total}
                limit={limit}
                offset={offset}
                onPageChange={(value) => setSearchParams(updateWarehouseQuery(searchParams, { offset: value }), { replace: true })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
