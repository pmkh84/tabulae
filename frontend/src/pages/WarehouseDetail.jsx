import { t } from "../i18n/index.js";
import { useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getWarehouseById } from "../api/warehouses";
import { useWarehouseRequest } from "../hooks/useWarehouseRequest.js";
import { checkedWarehouse } from "../utils/warehouseForm.js";
import { warehouseReturnTo } from "../utils/warehouseNavigation.js";
import WarehouseRequestFeedback from "../components/WarehouseRequestFeedback";

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const location = useLocation();
  const returnTo = warehouseReturnTo(location.state);
  const loader = useCallback(async () => checkedWarehouse(await getWarehouseById(id, accessToken), id), [id, accessToken]);
  const request = useWarehouseRequest(loader, location.key);
  const warehouse = request.data;

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseDetail");
  }, []);

  if (request.status !== "ready") {
    return (
      <>
        <Navbar />
        <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
        <div className="p-6 space-y-3">
          <WarehouseRequestFeedback request={request} />
          <button type="button" onClick={() => navigate(returnTo)} className="text-sm text-indigo-600 hover:underline">{t("common.backToList")}</button>
        </div>
      </>
    );
  }

  if (!warehouse) return null;

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {location.state?.warehouseFeedback === "updated" && <p role="status" className="text-sm text-green-700">{t("warehouses.updated")}</p>}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("breadcrumbs.warehouseDetail")}
          </h1>
          <button
            role="button"
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {"→ " + t("common.backToList")}
          </button>

          <div className="bg-white shadow rounded p-4 text-sm text-gray-700 space-y-2">
            <p>
              <strong>{t("common.id") + ':'}</strong> <bdi dir="ltr">{warehouse.id}</bdi>
            </p>
            <p>
              <strong>{t("common.name") + ':'}</strong> <bdi>{warehouse.name}</bdi>
            </p>
            <p>
              <strong>{t("common.status") + ':'}</strong> {warehouse.is_active ? t("common.active") : t("common.inactive")}
            </p>
          </div>

          {user?.role === "admin" && (
            <div className="flex gap-4 pt-4">
              <button
                role="button"
                onClick={() => navigate(`/warehouses/${warehouse.id}/edit`, { state: { warehouseReturnTo: returnTo } })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
              >
                {t("breadcrumbs.editWarehouse")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
