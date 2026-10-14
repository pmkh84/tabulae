import { LocalizedApiError, errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import { getProductById } from "../api/products";
import { productReturnTo } from "../utils/productNavigation.js";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = productReturnTo(location.state);
  const { accessToken, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setIsLoading(true); setProduct(null); setLoadError("");
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id, accessToken);
        if (!data || String(data.id) !== String(id)) throw new LocalizedApiError(null, 502);
        if (current) setProduct(data);
      } catch (error) {
        if (current) setLoadError(errorMessage(error));
      } finally {
        if (current) setIsLoading(false);
      }
    };

    if (accessToken) fetchProduct();
    return () => { current = false; };
  }, [id, accessToken, retry, location.key]);

  useEffect(() => {
    document.title = t("breadcrumbs.productDetail");
  }, []);

  if (isLoading || (product && String(product.id) !== String(id))) {
    return (
      <>
        <Navbar />
        <Breadcrumb navigationState={{ productReturnTo: returnTo }} />
        <div className="p-6 text-gray-700">{t("products.loading")}</div>
      </>
    );
  }

  if (!product) return <>
    <Navbar /><Breadcrumb navigationState={{ productReturnTo: returnTo }} />
    <div className="p-6 space-y-3">
      <p role="alert">{loadError}</p>
      <button type="button" onClick={() => setRetry((value) => value + 1)} className="text-indigo-600 hover:underline">{t("products.retry")}</button>
      <button type="button" onClick={() => navigate(returnTo)} className="text-indigo-600 hover:underline">{t("common.backToList")}</button>
    </div>
  </>;

  return (
    <>
      <Navbar />
      <Breadcrumb navigationState={{ productReturnTo: returnTo }} />
      <div className="p-6">
        {location.state?.productFeedback === "updated" && <p role="status" className="mb-3 text-sm text-green-700">{t("products.updated")}</p>}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("breadcrumbs.productDetail")}
          </h1>
          <button
            role="button"
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {"→ " + t("common.back")}
          </button>

          <div className="bg-white shadow rounded p-4 text-sm text-gray-700 space-y-2">
            <p>
              <strong>{t("common.sku") + ':'}</strong> <bdi dir="ltr">{product.sku}</bdi>
            </p>
            <p>
              <strong>{t("common.name") + ':'}</strong> <bdi>{product.short_name}</bdi>
            </p>
            <p>
              <strong>{t("common.category") + ':'}</strong> <bdi>{product.category_name}</bdi>
            </p>
            <p>
              <strong>{t("common.description") + ':'}</strong> {product.description || "—"}
            </p>
            <p>
              <strong>{t("common.status") + ':'}</strong> {product.is_active ? t("common.active") : t("common.inactive")}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            {user?.role === "admin" && (
              <button
                role="button"
                onClick={() => navigate(`/products/${product.id}/edit`, { state: { productReturnTo: returnTo } })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
              >
                {t("breadcrumbs.editProduct")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
