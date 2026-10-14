import { useEffect, useState } from "react";
import { getAllProductCategories } from "../api/products";
import { errorMessage } from "../i18n/errors.js";

export function useProductCategories(accessToken) {
  const [state, setState] = useState({ data: [], status: "loading", error: "", token: accessToken });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ data: [], status: "loading", error: "", token: accessToken });
    if (accessToken) {
      getAllProductCategories(accessToken).then((data) => {
        if (current) setState({ data, status: "ready", error: "", token: accessToken });
      }).catch((error) => {
        if (current) setState({ data: [], status: "error", error: errorMessage(error), token: accessToken });
      });
    }
    return () => { current = false; };
  }, [accessToken, revision]);

  return {
    ...(state.token === accessToken ? state : { data: [], status: "loading", error: "" }),
    retry: () => setRevision((value) => value + 1),
    add: (category) => setState((value) => ({ ...value, data: [...value.data.filter((item) => item.id !== category.id), category] })),
  };
}
