import { t } from "../i18n/index.js";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/useAuth";
import CreateInlineCategory from "../components/CreateInlineCategory";
import ProductCategoryFeedback from "../components/ProductCategoryFeedback";
import { useProductForm } from "../hooks/useProductForm.js";
import { productReturnTo } from "../utils/productNavigation.js";

export default function NewProduct() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = productReturnTo(location.state);
  const editor = useProductForm({ accessToken });
  const { form, errors, categories, onChange: handleChange, isSubmitting } = editor;

  useEffect(() => {
    document.title = t("navigation.createProduct");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await editor.save()) {
      alert(t("products.created"));
      navigate(returnTo, { state: { productFeedback: "created" } });
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ productReturnTo: returnTo }} />
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.createProduct")}</h1>

          {editor.message && <p role={editor.isUnchanged ? "status" : "alert"} className={`text-sm whitespace-pre-line ${editor.isUnchanged ? "text-gray-600" : "text-red-600"}`}>{editor.message}</p>}
          <form ref={editor.formRef} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4">
            {/* SKU */}
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.sku")}
              </label>
              <input
                id="sku"
                type="text"
                name="sku"
                disabled={isSubmitting}
                required
                aria-invalid={Boolean(errors.sku)}
                aria-describedby={errors.sku ? "sku-error" : undefined}
                value={form.sku}
                minLength={3}
                maxLength={20}
                pattern="[A-Z0-9]+"
                title={t("validation.sku")}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage id="sku-error" message={errors.sku} />
            </div>

            {/* Short name */}
            <div>
              <label
                htmlFor="short_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.shortName")}
              </label>
              <input
                id="short_name"
                type="text"
                name="short_name"
                disabled={isSubmitting}
                required
                aria-invalid={Boolean(errors.short_name)}
                aria-describedby={errors.short_name ? "short_name-error" : undefined}
                minLength={3}
                maxLength={100}
                value={form.short_name}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage id="short_name-error" message={errors.short_name} />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.description")}
              </label>
              <textarea
                id="description"
                name="description"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "description-error" : undefined}
                maxLength={500}
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage id="description-error" message={errors.description} />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.category")}
              </label>
              <select
                id="category_id"
                name="category_id"
                aria-invalid={Boolean(errors.category_id)}
                aria-describedby={errors.category_id ? "category_id-error" : undefined}
                disabled={categories.status !== "ready" || isSubmitting || editor.isCreatingCategory}
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full bg-white h-[36px] rounded border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t("products.selectCategory")}</option>
                {categories.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ProductCategoryFeedback categories={categories} />

              {/* Inline category creation */}
              <CreateInlineCategory
                disabled={categories.status !== "ready" || isSubmitting}
                onPendingChange={editor.onCategoryPending}
                onCategoryCreated={editor.onCategoryCreated}
              />
              <ErrorMessage id="category_id-error" message={errors.category_id} />
            </div>

            <div className="flex gap-3">
              <button
                role="button"
                type="submit"
                disabled={!editor.canSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("common.submitting") : t("products.save")}
              </button>
              <button
                role="button"
                type="button"
                disabled={isSubmitting || editor.isCreatingCategory}
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
