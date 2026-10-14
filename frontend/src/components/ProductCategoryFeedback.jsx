import { t } from "../i18n/index.js";

export default function ProductCategoryFeedback({ categories }) {
  if (categories.status === "ready") return null;
  if (categories.status === "loading") return <p role="status" className="mt-1 text-sm text-gray-500">{t("products.categoriesLoading")}</p>;
  return (
    <div role="alert" className="mt-1 text-sm text-red-600">
      <p>{t("products.categoriesFailed")}</p>
      <p>{categories.error}</p>
      <button type="button" onClick={categories.retry} className="text-indigo-600 hover:underline">{t("products.retry")}</button>
    </div>
  );
}
