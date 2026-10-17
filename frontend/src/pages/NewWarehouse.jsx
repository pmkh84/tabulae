import { t } from "../i18n/index.js";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import ErrorMessage from "../components/ErrorMessage";
import { useWarehouseForm } from "../hooks/useWarehouseForm.js";
import { warehouseReturnTo } from "../utils/warehouseNavigation.js";

export default function NewWarehouse() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = warehouseReturnTo(location.state);
  const editor = useWarehouseForm({ accessToken });
  const { form, errors, isSubmitting } = editor;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await editor.save()) {
      alert(t("warehouses.created"));
      navigate(returnTo, { state: { warehouseFeedback: "created" } });
    }
  };

  useEffect(() => {
    document.title = t("navigation.createWarehouse");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ warehouseReturnTo: returnTo }} linkTargets={{ "/warehouses/list": returnTo }} />
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.createWarehouse")}</h1>

          {editor.message && <ErrorMessage message={editor.message} />}
          <form ref={editor.formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.name")}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                disabled={isSubmitting}
                maxLength={255}
                required
                value={form.name}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                onChange={editor.onChange}
                className="w-full h-[36px] bg-white rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage id="name-error" message={errors.name} />
            </div>

            <div className="flex gap-3">
              <button
                role="button"
                type="submit"
                disabled={!editor.canSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
              >
                {isSubmitting ? t("common.submitting") : t("warehouses.save")}
              </button>
              <button
                role="button"
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
