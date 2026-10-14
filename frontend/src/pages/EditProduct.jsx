import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/useAuth";
import {
  getProductById,
  updateProduct,
  getCategories,
  deleteProduct,
} from "../api/products";
import CreateInlineCategory from "../components/CreateInlineCategory";

export default function EditProduct() {
  const [loadError, setLoadError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const [form, setForm] = useState({
    sku: "",
    short_name: "",
    description: "",
    category_id: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchProduct = async () => {
      try {
        const product = await getProductById(id, accessToken);
        setForm({
          sku: product.sku,
          short_name: product.short_name,
          description: product.description || "",
          category_id: product.category_id,
          is_active: product.is_active,
        });
      } catch (error) {
        console.error("Error loading product:", error);
        alert(errorMessage(error));
        navigate("/products/list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, accessToken, navigate]);

  useEffect(() => {
    document.title = t("breadcrumbs.editProduct");
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
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
      await updateProduct(id, form, accessToken);
      alert(t("products.updated"));
      navigate(`/products/${id}`);
    } catch (error) {
      console.error("Error updating product:", error);
      alert(t("errors.actionFailed") + "\n" + errorMessage(error));
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      t("products.confirmDelete")
    );
    if (!confirm) return;

    try {
      await deleteProduct(id, accessToken);
      alert(t("products.deleted"));
      navigate("/products/list");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(t("errors.actionFailed") + "\n" + errorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Breadcrumb />
        <div className="p-6 text-gray-700">{t("products.loading")}</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">{t("breadcrumbs.editProduct")}</h1>

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
                onChange={handleChange}
                minLength={3}
                maxLength={20}
                pattern="[A-Z0-9]+"
                title={t("validation.sku")}
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
                value={form.short_name}
                onChange={handleChange}
                minLength={3}
                maxLength={100}
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
                value={form.description}
                onChange={handleChange}
                maxLength={500}
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
                onCategoryCreated={(newCat) => {
                  setCategories((prev) => [...prev, newCat]);
                  setForm((f) => ({ ...f, category_id: newCat.id }));
                }}
              />
              <ErrorMessage message={errors.category_id} />
            </div>

            {/* Active (only for admin) */}
            {user?.role === "admin" && (
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  {t("common.active")}
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
              >
                {t("common.saveChanges")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/products/list")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>

          {user?.role === "admin" && (
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm"
            >
              {t("products.delete")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
