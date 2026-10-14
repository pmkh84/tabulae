import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { deleteProduct } from "../api/products";

export default function ProductListTable({
  products,
  onDelete,
  selectedIds,
  toggleSelected,
  toggleAll,
  returnTo = "/products/list",
}) {

  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(t("products.confirmDelete"));
    if (!confirmDelete) return;

    try {
      await deleteProduct(id, accessToken);
      alert(t("products.deleted"));
      onDelete?.(id);
    } catch (error) {
      alert(errorMessage(error) || t("errors.actionFailed"));
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
        <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={products.length > 0 && selectedIds.length === products.length}
                onChange={toggleAll}
                aria-label={t("common.selectAll")}
              />
            </th>
            <th className="px-4 py-3">{t("common.sku")}</th>
            <th className="px-4 py-3">{t("common.name")}</th>
            <th className="px-4 py-3">{t("common.category")}</th>
            <th className="px-4 py-3">{t("common.active")}</th>
            <th className="px-4 py-3">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">{t("common.empty")}</td></tr>}
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleSelected(product.id)}
                  aria-label={t("common.selectRow")}
                />
              </td>
              <td className="px-4 py-2"><bdi dir="ltr">{product.sku}</bdi></td>
              <td className="px-4 py-2"><bdi>{product.short_name}</bdi></td>
              <td className="px-4 py-2">
                {product.category_name || t("products.noCategory")}
              </td>
              <td className="px-4 py-2">
                {product.is_active ? (
                  <span className="text-green-600 font-medium">{t("common.yes")}</span>
                ) : (
                  <span className="text-red-500 font-medium">{t("common.no")}</span>
                )}
              </td>
              <td className="px-4 py-2 space-x-2">
                <button
                  role="button"
                  onClick={() => navigate(`/products/${product.id}`, { state: { productReturnTo: returnTo } })}
                  className="text-indigo-600 hover:underline"
                >
                  {t("common.view")}
                </button>
                <button
                  role="button"
                  onClick={() => navigate(`/products/${product.id}/stock`)}
                  className="text-indigo-600 hover:underline"
                >
                  {t("common.viewStock")}
                </button>
                {user?.role === "admin" && (
                  <>
                    <button
                      role="button"
                      onClick={() => navigate(`/products/${product.id}/edit`, { state: { productReturnTo: returnTo } })}
                      className="text-indigo-600 hover:underline"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      role="button"
                      onClick={() => handleDelete(product.id)}
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
