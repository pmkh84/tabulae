import { t } from "../i18n/index.js";
import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/useAuth";
import { useWarehouseForm } from "../hooks/useWarehouseForm.js";
import { warehouseReturnTo } from "../utils/warehouseNavigation.js";
import WarehouseRequestFeedback from "../components/WarehouseRequestFeedback";

export default function EditWarehouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const location = useLocation();
  const returnTo = warehouseReturnTo(location.state);
  const editor = useWarehouseForm({ id, accessToken });
  const { form, errors, isSubmitting, onChange: handleChange } = editor;

  useEffect(() => {
    document.title = t("breadcrumbs.editWarehouse");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await editor.save(() => window.confirm(t("warehouses.confirmDeactivate")))) {
      alert(t("warehouses.updated"));
      navigate(`/warehouses/${id}`, { state: { warehouseReturnTo: returnTo, warehouseFeedback: "updated" } });
    }
  };

  if (editor.load.status !== "ready") {
    return (
      <>
        <Navbar />
        <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
        <div className="p-6 space-y-3">
          <WarehouseRequestFeedback request={{ ...editor.load, retry: editor.retry }} />
          <button type="button" onClick={() => navigate(returnTo)} className="text-sm text-indigo-600 hover:underline">{t("common.backToList")}</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("breadcrumbs.editWarehouse")}</h1>

          {editor.message && <p role={editor.isNotice ? "status" : "alert"} className="text-sm whitespace-pre-line">{editor.message}</p>}
          <form ref={editor.formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.name")}
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                maxLength={255}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage id="name-error" message={errors.name} />
            </div>

            {/* Active (admin only) */}
            {user?.role === "admin" && (
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.is_active)}
                  aria-describedby={errors.is_active ? "is-active-error" : undefined}
                  onChange={handleChange}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  {t("common.active")}
                </label>
              </div>
            )}
            <ErrorMessage id="is-active-error" message={errors.is_active} />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!editor.canSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
              >
                {isSubmitting ? t("common.submitting") : t("common.saveChanges")}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate(returnTo)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
