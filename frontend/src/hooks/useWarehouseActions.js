import { useEffect, useRef, useState } from "react";
import { deleteWarehouse, warehousesBulkUpdate } from "../api/warehouses";
import { checkedWarehouse, checkedWarehouseBulk, warehouseErrorFeedback } from "../utils/warehouseForm.js";

export function useWarehouseActions({ accessToken, onChanged }) {
  const lock = useRef(false), mounted = useRef(false), refresh = useRef(onChanged);
  refresh.current = onChanged;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const run = async (confirm, persist) => {
    if (lock.current) return null;
    lock.current = true; setPending(true); setError("");
    try {
      if (await confirm() !== true) return null;
      const result = await persist();
      if (!mounted.current) return null;
      refresh.current();
      return result;
    } catch (failure) {
      if (mounted.current) setError(warehouseErrorFeedback(failure, true).message);
      return null;
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return {
    pending, error,
    bulk: (ids, status, confirm) => run(status === false ? confirm : () => true,
      async () => checkedWarehouseBulk(await warehousesBulkUpdate(ids, status, accessToken), ids.length)),
    remove: (id, confirm) => run(confirm, async () => {
      checkedWarehouse(await deleteWarehouse(id, accessToken), id);
      return true;
    }),
  };
}
