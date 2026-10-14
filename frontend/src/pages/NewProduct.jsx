import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/useAuth";
import { getCategories, createProduct } from "../api/products";
import CreateInlineCategory from "../components/CreateInlineCategory";

export default function NewProduct() {
  const [loadError, setLoadError] = useState("");
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sku: "",
    short_name: "",
    description: "",
    category_id: "",
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadError("");
        const list = await getCategories(accessToken);
        setCategories(list);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, [accessToken]);

  useEffect(() => {
    document.title = t("navigation.createProduct");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.sku.trim()) newErrors.sku = t("validation.required");
    if (!form.short_name.trim()) newErrors.short_name = t("validation.required");
    if (!form.category_id) newErrors.category_id = t("validation.required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createProduct(form, accessToken);
      alert(t("products.created"));
      navigate("/products/list");
    } catch (error) {
      console.error(error);
      alert(t("errors.actionFailed") + "\n" + errorMessage(error));
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.createProduct")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={form.sku}
                minLength={3}
                maxLength={20}
                pattern="[A-Z0-9]+"
                title={t("validation.sku")}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage message={errors.sku} />
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
                minLength={3}
                maxLength={100}
                value={form.short_name}
                onChange={handleChange}
                className="h-[36px] bg-white w-full rounded border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <ErrorMessage message={errors.short_name} />
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
                maxLength={500}
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
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
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full bg-white h-[36px] rounded border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t("products.selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Inline category creation */}
              <CreateInlineCategory
                onCategoryCreated={(newCategory) => {
                  setCategories((prev) => [...prev, newCategory]);
                  setForm((f) => ({ ...f, category_id: newCategory.id }));
                }}
              />
              <ErrorMessage message={errors.category_id} />
            </div>

            <div className="flex gap-3">
              <button
                role="button"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
              >
                {t("products.save")}
              </button>
              <button
                role="button"
                type="button"
                onClick={() => navigate("/products/list")}
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
