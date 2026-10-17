import { useEffect, useRef, useState } from "react";
import { createWarehouse, getWarehouseById, warehouseUpdate } from "../api/warehouses";
import { t } from "../i18n/index.js";
import { checkedWarehouse, warehouseErrorFeedback, warehouseFormValues, submitWarehouseForm } from "../utils/warehouseForm.js";

export function useWarehouseForm({ id, accessToken }) {
  const [form, setForm] = useState(() => warehouseFormValues());
  const [original, setOriginal] = useState(null);
  const [load, setLoad] = useState({ status: id ? "loading" : "ready", error: "", id, token: accessToken });
  const [revision, setRevision] = useState(0);
  const [errors, setErrors] = useState({});
  const [focusField, setFocusField] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lock = useRef(false), generation = useRef(0), mounted = useRef(false);
  const scope = useRef({ id, revision: -1 }), loaded = useRef(null), formRef = useRef(null);

  useEffect(() => {
    if (focusField) formRef.current?.elements.namedItem(focusField.name)?.focus();
  }, [focusField]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, []);
  useEffect(() => {
    let current = true;
    if (scope.current.id !== id || scope.current.revision !== revision) {
      generation.current += 1;
      setForm(warehouseFormValues()); setOriginal(null); setErrors({}); setFocusField(null); setMessage("");
      loaded.current = null;
    }
    scope.current = { id, revision };
    // Token refresh does not erase drafts or invalidate an in-flight save's feedback.
    setLoad({ status: id && !loaded.current ? "loading" : "ready", error: "", id, token: accessToken });
    if (id && accessToken && !loaded.current) {
      getWarehouseById(id, accessToken).then((data) => checkedWarehouse(data, id)).then((warehouse) => {
        if (current) {
          loaded.current = warehouse; setOriginal(warehouse); setForm(warehouseFormValues(warehouse));
          setLoad({ status: "ready", error: "", id, token: accessToken });
        }
      }).catch((error) => {
        if (current) setLoad({ status: error.status === 404 ? "missing" : "error", error: warehouseErrorFeedback(error).message, id, token: accessToken });
      });
    }
    return () => { current = false; };
  }, [id, accessToken, revision]);

  const ready = load.id === id && load.token === accessToken && load.status === "ready" && !!accessToken;
  const save = async (confirmDeactivation) => {
    if (!ready || lock.current) return null;
    const version = generation.current;
    setErrors({}); setMessage("");
    const result = await submitWarehouseForm({
      form, original, lock, confirmDeactivation,
      onPending: (value) => { if (mounted.current) setIsSubmitting(value); },
      persist: (payload) => id ? warehouseUpdate(id, payload, accessToken) : createWarehouse(payload, accessToken),
    });
    if (!mounted.current || version !== generation.current) return null;
    if (result.status === "invalid" || result.status === "failed") {
      const fields = result.errors ?? result.fields;
      setErrors(fields);
      const name = Object.keys(fields).find((key) => fields[key]);
      if (name) setFocusField({ name });
    }
    if (result.status === "failed") setMessage(result.message);
    if (result.status === "unchanged") setMessage(t("warehouses.unchanged"));
    if (result.status === "cancelled") {
      setForm((previous) => ({ ...previous, is_active: original.is_active }));
      setMessage(t("warehouses.cancelled"));
    }
    if (result.status === "saved" && id) {
      loaded.current = result.warehouse; setOriginal(result.warehouse); setForm(warehouseFormValues(result.warehouse));
    }
    return result.status === "saved" ? result.warehouse : null;
  };
  return {
    form, formRef, original, errors, message, isSubmitting, canSubmit: ready && !isSubmitting, save,
    isNotice: [t("warehouses.unchanged"), t("warehouses.cancelled")].includes(message),
    load: load.id !== id || load.token !== accessToken ? { status: "loading", error: "" } : load,
    retry: () => setRevision((value) => value + 1),
    onChange: ({ target: { name, value, type, checked } }) => {
      if (!["name", "is_active"].includes(name) || lock.current) return;
      setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
      setErrors((previous) => ({ ...previous, [name]: "" })); setMessage("");
    },
  };
}
