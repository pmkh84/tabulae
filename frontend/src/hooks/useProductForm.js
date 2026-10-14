import { useEffect, useRef, useState } from "react";
import { createProduct, getProductById, updateProduct, deleteProduct } from "../api/products";
import { LocalizedApiError, errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { productFormValues, submitProductForm } from "../utils/productForm.js";
import { useProductCategories } from "./useProductCategories.js";

export function useProductForm({ id, accessToken }) {
  const categories = useProductCategories(accessToken);
  const [form, setForm] = useState(() => productFormValues());
  const [original, setOriginal] = useState(null);
  const [load, setLoad] = useState({ status: id ? "loading" : "ready", error: "", id, token: accessToken });
  const [revision, setRevision] = useState(0);
  const [errors, setErrors] = useState({});
  const [focusField, setFocusField] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const lock = useRef(false), categoryPending = useRef(false), generation = useRef(0), mounted = useRef(false);
  const scope = useRef({ id, revision: -1 }), loadedProduct = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (focusField) formRef.current?.elements.namedItem(focusField.name)?.focus();
  }, [focusField]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const reset = scope.current.id !== id || scope.current.revision !== revision;
    scope.current = { id, revision };
    if (reset) {
      setForm(productFormValues()); setOriginal(null); setErrors({}); setFocusField(null); setMessage("");
      loadedProduct.current = null;
    }
    // Refreshing an access token must not discard an administrator's unsaved input.
    setLoad({ status: id && !loadedProduct.current ? "loading" : "ready", error: "", id, token: accessToken });
    if (id && accessToken && !loadedProduct.current) {
      getProductById(id, accessToken).then((product) => {
        if (!product || String(product.id) !== String(id)) throw new LocalizedApiError(null, 502);
        if (current) {
          loadedProduct.current = product;
          setOriginal(product); setForm(productFormValues(product));
          setLoad({ status: "ready", error: "", id, token: accessToken });
        }
      }).catch((error) => {
        if (current) setLoad({ status: error.status === 404 ? "missing" : "error", error: errorMessage(error), id, token: accessToken });
      });
    }
    return () => { current = false; generation.current += 1; };
  }, [id, accessToken, revision]);

  const ready = load.id === id && load.token === accessToken && load.status === "ready";
  const canSubmit = ready && categories.status === "ready" && !isSubmitting && !isCreatingCategory;
  const pending = (value) => { if (mounted.current) setIsSubmitting(value); };

  const save = async () => {
    if (!ready || categories.status !== "ready" || categoryPending.current || lock.current) return null;
    const version = generation.current;
    setErrors({}); setMessage("");
    const result = await submitProductForm({
      form, original, categories: categories.data, lock, onPending: pending,
      persist: (payload) => id ? updateProduct(id, payload, accessToken) : createProduct(payload, accessToken),
    });
    if (!mounted.current || version !== generation.current) return null;
    if (result.status === "invalid" || result.status === "failed") {
      const fields = result.errors ?? result.fields;
      setErrors(fields);
      const name = Object.keys(fields).find((key) => fields[key]);
      if (name) setFocusField({ name });
    }
    if (result.status === "failed") setMessage(result.message);
    if (result.status === "unchanged") setMessage(t("products.unchanged"));
    if (result.status === "saved" && id) {
      loadedProduct.current = result.product;
      setOriginal(result.product); setForm(productFormValues(result.product));
    }
    return result.status === "saved" ? result.product : null;
  };

  const remove = async () => {
    if (!ready || !id || lock.current || categoryPending.current) return false;
    const version = generation.current;
    lock.current = true; pending(true); setMessage("");
    try {
      await deleteProduct(id, accessToken);
      return mounted.current && version === generation.current;
    } catch (error) {
      if (mounted.current && version === generation.current) setMessage(errorMessage(error));
      return false;
    } finally { lock.current = false; pending(false); }
  };

  return {
    form, formRef, original, categories, errors, message, isUnchanged: message === t("products.unchanged"),
    isSubmitting, isCreatingCategory, canSubmit, save, remove,
    load: ready ? load : { ...load, status: load.id !== id || load.token !== accessToken ? "loading" : load.status },
    retryProduct: () => setRevision((value) => value + 1),
    onChange: ({ target: { name, value, type, checked } }) => {
      setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
      setErrors((previous) => ({ ...previous, [name]: "" })); setMessage("");
    },
    onCategoryPending: (value) => { categoryPending.current = value; setIsCreatingCategory(value); },
    onCategoryCreated: (category) => {
      categories.add(category); setForm((previous) => ({ ...previous, category_id: category.id }));
      setErrors((previous) => ({ ...previous, category_id: "" }));
    },
  };
}
