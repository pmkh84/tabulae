import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import { createCategory } from "../api/products";
import { useAuth } from "../context/useAuth";

export default function CreateInlineCategory({ onCategoryCreated, onPendingChange, disabled = false }) {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleAdd = async () => {
    if (disabled || pending.current) return;
    if (!name.trim()) {
      setError(t("validation.required"));
      return;
    }
    if ([...name.trim()].length < 3 || [...name.trim()].length > 50) {
      setError(t("products.categoryNameConstraint"));
      return;
    }

    pending.current = true;
    setIsSubmitting(true); setError(""); onPendingChange?.(true);
    try {
      const newCategory = await createCategory(name.trim(), accessToken);
      if (mounted.current) {
        onCategoryCreated(newCategory);
        setName(""); setError("");
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e) || t("errors.actionFailed"));
    } finally {
      pending.current = false;
      if (mounted.current) { setIsSubmitting(false); onPendingChange?.(false); }
    }
  };

  return (
    <div className="mt-4 space-y-1">
      <label
        htmlFor="category"
        className="block text-sm font-medium text-gray-700"
      >
        {t("products.categoryHelp")}
      </label>
      <div className="flex gap-2">
        <input
          id="category"
          type="text"
          disabled={disabled || isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "inline-category-error" : undefined}
          minLength={3}
          maxLength={50}
          placeholder={t("products.newCategory")}
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          role="button"
          type="button"
          onClick={handleAdd}
          disabled={disabled || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t("common.submitting") : t("common.add")}
        </button>
      </div>
      <div id="inline-category-error"><ErrorMessage message={error} /></div>
    </div>
  );
}
