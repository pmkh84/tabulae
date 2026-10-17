import { useEffect, useState } from "react";
import { warehouseErrorFeedback } from "../utils/warehouseForm.js";

// Read-only requests: clear stale views, ignore superseded responses, and allow retry.
export function useWarehouseRequest(loader, refreshKey) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ status: "loading", data: null, error: "" });
  useEffect(() => {
    let current = true;
    setResult({ status: "loading", data: null, error: "", loader, revision, refreshKey });
    Promise.resolve().then(loader).then((data) => {
      if (current) setResult({ status: "ready", data, error: "", loader, revision, refreshKey });
    }).catch((error) => {
      if (current) setResult({ status: error.status === 404 ? "missing" : "error", data: null, error: warehouseErrorFeedback(error).message, loader, revision, refreshKey });
    });
    return () => { current = false; };
  }, [loader, revision, refreshKey]);
  return {
    ...(result.loader === loader && result.revision === revision && result.refreshKey === refreshKey ? result : { status: "loading", data: null, error: "" }),
    retry: () => setRevision((value) => value + 1),
  };
}
