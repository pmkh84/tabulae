import { t } from "../i18n/index.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function WarehouseListTable({ warehouses, selected, toggleAll, toggleSelected, handleDelete, pending = false, returnTo = "/warehouses/list" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigationState = { warehouseReturnTo: returnTo };
  return (
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
            disabled={pending || user?.role !== "admin"}
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
              disabled={pending || user?.role !== "admin"}
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
              onClick={() => navigate(`/warehouses/${w.id}`, { state: navigationState })}
              className="text-indigo-600 hover:underline"
            >
              {t("common.view")}
            </button>
            <button
              role="button"
              onClick={() => {
                navigate(`/stock/warehouse/${w.id}`, { state: navigationState });
              }}
              className="text-indigo-600 hover:underline"
            >
              {t("common.viewStock")}
            </button>
            {user?.role === "admin" && (
              <>
                <button
                  role="button"
                  onClick={() => navigate(`/warehouses/${w.id}/edit`, { state: navigationState })}
                  className="text-indigo-600 hover:underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  role="button"
                  disabled={pending}
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
  );
}
