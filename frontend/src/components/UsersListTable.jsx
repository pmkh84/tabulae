import { roleLabel } from "../i18n/display.js";
import { t } from "../i18n/index.js";
import { useNavigate } from "react-router-dom";

export default function UserListTable({
  users,
  onDelete,
  selected,
  toggleSelected,
  toggleAll,
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
        <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={users.length > 0 && selected.length === users.length}
                onChange={toggleAll}
                aria-label={t("common.selectAll")}
              />
            </th>
            <th className="px-4 py-3">{t("common.name")}</th>
            <th className="px-4 py-3">{t("common.email")}</th>
            <th className="px-4 py-3">{t("common.role")}</th>
            <th className="px-4 py-3">{t("common.active")}</th>
            <th className="px-4 py-3">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">{t("common.empty")}</td></tr>}
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggleSelected(u.id)}
                  aria-label={t("common.selectRow")}
                />
              </td>
              <td className="px-4 py-2"><bdi>{u.name}</bdi></td>
              <td className="px-4 py-2"><bdi dir="ltr">{u.email}</bdi></td>
              <td className="px-4 py-2 capitalize">{roleLabel(u.role)}</td>
              <td className="px-4 py-2">
                {u.is_active ? (
                  <span className="text-green-600 font-medium">{t("common.yes")}</span>
                ) : (
                  <span className="text-red-500 font-medium">{t("common.no")}</span>
                )}
              </td>
              <td className="px-4 py-2 space-x-2">
                <button
                  role="button"
                  onClick={() => navigate(`/users/${u.id}/edit`)}
                  className="text-indigo-600 hover:underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  role="button"
                  onClick={() => onDelete(u.id)}
                  className="text-red-600 hover:underline"
                >
                  {t("common.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
