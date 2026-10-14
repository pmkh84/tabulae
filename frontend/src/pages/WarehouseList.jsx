import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Pagination from "../components/Pagination";
import { getAllWarehouses, warehousesBulkUpdate, deleteWarehouse } from "../api/warehouses";
import { useNavigate } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import SelectFilter from "../components/SelectFilter";
import ContainerFilters from "../components/ContainerFilters";
import { showStatusSummary } from "../utils/showStatusSummary";
import ExportCSVButton from "../components/ExportCSVButton";
import { exportFilteredWarehousesCSV } from "../utils/export";
import API_URL from "../api/config";

export default function WarehouseList() {
  const [loadError, setLoadError] = useState("");
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActive, setStatus] = useState("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      setLoadError("");
      const response = await getAllWarehouses(
        accessToken,
        limit,
        offset,
        searchTerm,
        isActive
      );
      setWarehouses(response.data);
      setTotal(response.total);
    } catch (err) {
      setLoadError(errorMessage(err));
      console.error("Error loading warehouses:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [searchTerm, isActive, offset, limit, accessToken]);

  const toggleSelected = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(t("warehouses.confirmDelete"));
    if (!confirmDelete) return;

    try {
      await deleteWarehouse(id, accessToken);
      alert(t("warehouses.deleted"));
      fetchWarehouses();
    } catch (error) {
      alert(errorMessage(error) || t("errors.actionFailed"));
    }
  };

  useEffect(() => {
    document.title = t("breadcrumbs.warehouseList");
  }, []);

  const toggleAll = () => {
    if (selected.length === warehouses.length) {
      setSelected([]);
    } else {
      setSelected(warehouses.map((w) => w.id));
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6 mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{t("breadcrumbs.warehouseList")}</h1>
          {user?.role === "admin" && (
            <button
              role="button"
              onClick={() => navigate("/warehouses/new")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
            >
              {"+ " + t("navigation.createWarehouse")}
            </button>
          )}
        </div>

        <ContainerFilters
          extraContent={
            <ExportCSVButton
              onExport={() =>
                exportFilteredWarehousesCSV({
                  accessToken,
                  apiUrl: API_URL,
                  filters: {
                    searchTerm,
                    isActive,
                  },
                })
              }
              label={"📤 " + t("common.exportCSV")}
            />
          }
        >
          <SearchInput
            label={t("common.search")}
            placeholder={t("common.searchName")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOffset(0);
            }}
          />

          <SelectFilter
            label={t("common.status")}
            value={isActive}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            options={[
              { value: "", label: t("common.all") },
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.inactive") },
            ]}
          />
        </ContainerFilters>

        {user?.role === "admin" && selected.length > 0 && (
          <div className="flex gap-2">
            <button
              role="button"
              onClick={async () => {
                try {
                  const res = await warehousesBulkUpdate(
                    selected.map((c) => parseInt(c)),
                    true,
                    accessToken
                  );
                  showStatusSummary(res, "warehouses", "activate");
                  setSelected([]);
                  await fetchWarehouses();
                } catch (error) {
                  alert(
                    errorMessage(error) || t("errors.actionFailed")
                  );
                }
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.activateSelected")}
            </button>
            <button
              role="button"
              onClick={async () => {
                try {
                  const res = await warehousesBulkUpdate(
                    selected.map((c) => parseInt(c)),
                    false,
                    accessToken
                  );
                  showStatusSummary(res, "warehouses", "deactivate");
                  setSelected([]);
                  await fetchWarehouses();
                } catch (error) {
                  alert(
                    errorMessage(error) || t("errors.actionFailed")
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.deactivateSelected")}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500">{t("warehouses.loadingList")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto bg-white shadow rounded">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
              <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        warehouses.length > 0 &&
                        selected.length === warehouses.length
                      }
                      onChange={toggleAll}
                      aria-label={t("common.selectAll")}
                    />
                  </th>
                  <th className="px-4 py-3">{t("common.id")}</th>
                  <th className="px-4 py-3">{t("common.name")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="px-4 py-3">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warehouses.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">{t("common.empty")}</td></tr>}
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(w.id)}
                        onChange={() => toggleSelected(w.id)}
                        aria-label={t("common.selectRow")}
                      />
                    </td>
                    <td className="px-4 py-2"><bdi dir="ltr">{w.id}</bdi></td>
                    <td className="px-4 py-2"><bdi>{w.name}</bdi></td>
                    <td className="px-4 py-2">
                      {w.is_active ? (
                        <span className="text-green-600 font-medium">
                          {t("common.active")}
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium">
                          {t("common.inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        role="button"
                        onClick={() => navigate(`/warehouses/${w.id}`)}
                        className="text-indigo-600 hover:underline"
                      >
                        {t("common.view")}
                      </button>
                      <button
                        role="button"
                        onClick={() => {
                          navigate(`/stock/warehouse/${w.id}`);
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        {t("common.viewStock")}
                      </button>
                      {user?.role === "admin" && (
                        <>
                          <button
                            role="button"
                            onClick={() => navigate(`/warehouses/${w.id}/edit`)}
                            className="text-indigo-600 hover:underline"
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            role="button"
                            onClick={() => handleDelete(w.id)}
                            className="text-red-600 hover:underline"
                          >
                            {t("common.delete")}
                          </button>
                        </>
                      )}
                    </td>
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
    </>
  );
}
