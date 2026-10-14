import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getWarehouseById } from "../api/warehouses";

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const data = await getWarehouseById(id, accessToken);
        setWarehouse(data);
      } catch (error) {
        console.error("Failed to load warehouse:", error);
        alert(errorMessage(error));
        navigate("/warehouses/list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouse();
  }, [id, accessToken, navigate]);

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseDetail");
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Breadcrumb />
        <div className="p-6 text-gray-700">{t("warehouses.loading")}</div>
      </>
    );
  }

  if (!warehouse) return null;

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("breadcrumbs.warehouseDetail")}
          </h1>
          <button
            role="button"
            onClick={() => navigate(`/warehouses/list`)}
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
                onClick={() => navigate(`/warehouses/${warehouse.id}/edit`)}
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
