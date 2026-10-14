import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import ProductStockExpirationTable from "../components/ProductStockExpirationTable";
import Pagination from "../components/Pagination";
import { getExpirationProducts } from "../api/stock";

export default function ExpirationStock() {
  const [loadError, setLoadError] = useState("");
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const preset = searchParams.get("preset");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError("");
        const data = await getExpirationProducts({
          accessToken,
          preset,
          fromDate,
          toDate,
          limit,
          offset,
        });

        setStock(data.data);
        setTotal(data.total);
      } catch (error) {
        setLoadError(errorMessage(error));
        console.error("Error:", error.message);
      }
    };

    // Requires at least one valid filter
    if (preset || fromDate || toDate) {
      fetchData();
    }
  }, [accessToken, preset, fromDate, toDate, limit, offset]);

  useEffect(() => {
    document.title = t("products.byExpiration");
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}

      <div className="p-6 mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("products.byExpiration")}
        </h1>

        <button
          role="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {"→ " + t("common.back")}
        </button>

        <ProductStockExpirationTable
          stock={stock}
          onViewHistory={(line) =>
            navigate(`/products/${line.product_id}/history`)
          }
        />

        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
        />
      </div>
    </>
  );
}
