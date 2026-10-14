import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import ErrorMessage from "../components/ErrorMessage";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/products";

export default function CategoriesPage() {
  const [loadError, setLoadError] = useState("");
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [msg, setMsg] = useState("");

  const loadCategories = async () => {
    try {
      setLoadError("");
      const data = await getCategories(accessToken);
      setCategories(data);
    } catch (e) {
      setLoadError(errorMessage(e));
      console.error("Error loading categories:", e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [accessToken]);

  useEffect(() => {
    document.title = t("navigation.categories");
  }, []);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      setError(t("validation.required"));
      return;
    }
    if (newCategoryName.trim().length < 3) {
      setError(t("validation.nameMin"));
      return;
    }
    if (newCategoryName.trim().length > 50) {
      setError(t("validation.nameMax"));
      return;
    }
    try {
      const created = await createCategory(newCategoryName.trim(), accessToken);
      setCategories((prev) => [...prev, created]);
      setNewCategoryName("");
      setError("");
      showMsg(t("products.categoryCreated"));
    } catch (e) {
      setError(errorMessage(e) || t("errors.actionFailed"));
    }
  };

  const handleEdit = async (id) => {
    if (!editedName.trim()) return;
    if (editedName.trim().length < 3 || editedName.trim().length > 50) return;
    try {
      const updated = await updateCategory(id, editedName.trim(), accessToken);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      setEditedName("");
      showMsg(t("products.categoryUpdated"));
    } catch (e) {
      alert(errorMessage(e) || t("errors.actionFailed"));
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      t("products.confirmCategoryDelete")
    );
    if (!confirmDelete) return;
    try {
      await deleteCategory(id, accessToken);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showMsg(t("products.categoryDeleted"));
    } catch (e) {
      alert(errorMessage(e) || t("errors.actionFailed"));
    }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("navigation.categories")}</h1>
        <button
          role="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {"→ " + t("common.back")}
        </button>
        {msg && (
          <div className="text-sm text-green-700 bg-green-100 border border-green-300 rounded px-4 py-2">
            {msg}
          </div>
        )}

        {/* Create new */}
        <div>
          <label
            htmlFor={`input${newCategoryName}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("products.newCategory")}
          </label>
          <div className="flex gap-2">
            <input
              id={`input${newCategoryName}`}
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t("common.name")}
              minLength={3}
              maxLength={50}
              className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              role="button"
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.create")}
            </button>
          </div>
          <ErrorMessage message={error} />
        </div>

        {/* List */}
        <div className="bg-white shadow rounded divide-y divide-gray-200">
          {categories.length === 0 && <p className="p-3 text-sm text-gray-500">{t("common.empty")}</p>}
          {categories.map((cat) => (
            <div key={cat.id} className="p-3 flex justify-between items-center">
              {editingId === cat.id ? (
                <>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    minLength={3}
                    maxLength={50}
                  />
                  <div className="flex gap-2 ms-2">
                    <button
                      role="button"
                      onClick={() => handleEdit(cat.id)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      {t("common.save")}
                    </button>
                    <button
                      role="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditedName("");
                      }}
                      className="text-gray-500 hover:underline text-sm"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm"><bdi>{cat.name}</bdi></span>
                  <div className="flex gap-2">
                    <button
                      role="button"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditedName(cat.name);
                      }}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      role="button"
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
