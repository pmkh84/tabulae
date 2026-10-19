import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Pagination from "../components/Pagination";
import {
  getProducts,
  productBulkStatus,
} from "../api/products";
import { useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";
import ProductListTable from "../components/ProductListTable";
import ExportCSVButton from "../components/ExportCSVButton";
import { exportFilteredProductsCSV } from "../utils/export";
import API_URL from "../api/config";
import SearchInput from "../components/SearchInput";
import SelectFilter from "../components/SelectFilter";
import ContainerFilters from "../components/ContainerFilters";
import { showStatusSummary } from "../utils/showStatusSummary";
import { useProductCategories } from "../hooks/useProductCategories.js";
import ProductCategoryFeedback from "../components/ProductCategoryFeedback";
import { productListContext, updateProductListQuery } from "../utils/productNavigation.js";

export default function ProductList() {
  const [loadError, setLoadError] = useState("");
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchTerm, offset, isActive, selectedCategoryId } = productListContext(searchParams);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const searchTimer = useRef(null);
  const appliedSearch = useRef(searchTerm);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const changeQuery = (changes) => {
    const next = updateProductListQuery(searchParamsRef.current, changes);
    searchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  };
  const changeQueryRef = useRef(changeQuery);
  changeQueryRef.current = changeQuery;
  const setOffset = (value) => changeQuery({ offset: value });
  const returnTo = location.pathname + location.search;
  const categories = useProductCategories(accessToken);
  const requestVersion = useRef(0);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (searchTerm !== appliedSearch.current || navigationType === "POP") { 
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
      setSearchInput(searchTerm);
    }
    appliedSearch.current = searchTerm;
  }, [searchTerm, location.key, navigationType]);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = null;
    if (value === "") changeQueryRef.current({ search: "", offset: 0 });
    else if (value !== searchTerm) {
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null;
        changeQueryRef.current({ search: value, offset: 0 });
      }, 400);
    }
  };

  const fetchProducts = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    try {
      setLoadError("");
      const { data, total } = await getProducts({
        accessToken,
        limit,
        offset,
        searchTerm,
        category_id: selectedCategoryId,
        is_active: isActive,
      });
      if (version !== requestVersion.current) return;
      if (offset > 0 && offset >= total) {
        setSearchParams(updateProductListQuery(searchParams, { offset: Math.max(0, Math.ceil(total / limit) - 1) * limit }), { replace: true });
        return;
      }
      setProducts(data || []); setTotal(total || 0); setSelectedIds([]);
    } catch (error) {
      if (version === requestVersion.current) {
        setProducts([]); setTotal(0); setSelectedIds([]); setLoadError(errorMessage(error));
      }
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [accessToken, offset, searchTerm, selectedCategoryId, isActive, searchParams, setSearchParams]);

  useEffect(() => {
    fetchProducts();
    return () => { requestVersion.current += 1; };
  }, [fetchProducts]);

  useEffect(() => {
    document.title = t("breadcrumbs.productList");
  }, []);

  const handleDeleteFromList = (deletedId) => {
    setSelectedIds((previous) => previous.filter((value) => value !== deletedId));
    if (products.length === 1 && offset >= limit) setOffset(offset - limit);
    else fetchProducts();
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      {loadError && <button type="button" onClick={fetchProducts} className="px-6 text-sm text-indigo-600 hover:underline">{t("products.retry")}</button>}
      <div className="p-6 mx-auto space-y-6">
        {location.state?.productFeedback === "created" && <p role="status" className="text-sm text-green-700">{t("products.created")}</p>}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{t("breadcrumbs.productList")}</h1>
          {user?.role === "admin" && (
            <button
              role="button"
              onClick={() => navigate("/products/new", { state: { productReturnTo: returnTo } })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
            >
              {"+ " + t("navigation.createProduct")}
            </button>
          )}
        </div>

        <ContainerFilters
          extraContent={
            <ExportCSVButton
              onExport={() => {
                exportFilteredProductsCSV({
                  accessToken,
                  apiUrl: API_URL,
                  filters: {
                    searchTerm,
                    category_id: selectedCategoryId,
                    is_active: isActive,
                  },
                });
              }}
              label={"📤 " + t("common.exportCSV")}
            />
          }
        >
          <SearchInput
            label={t("common.search")}
            placeholder={t("products.search")}
            value={searchInput}
            onChange={handleSearchChange}
          />

          {categories.status === "ready" ? <SelectFilter
            label={t("common.category")}
            value={selectedCategoryId}
            onChange={(e) => {
              changeQuery({ category_id: e.target.value, offset: 0 });
            }}
            options={[
              { value: "", label: t("products.allCategories") },
              ...categories.data.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
          /> : <ProductCategoryFeedback categories={categories} />}

          <SelectFilter
            label={t("common.status")}
            value={isActive}
            onChange={(e) => {
              changeQuery({ is_active: e.target.value, offset: 0 });
            }}
            options={[
              { value: "", label: t("common.all") },
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.inactive") },
            ]}
          />
        </ContainerFilters>

        {user?.role === "admin" && selectedIds.length > 0 && (
          <div className="flex gap-2">
            <button
              role="button"
              onClick={async () => {
                try {
                  const res = await productBulkStatus(
                    selectedIds.map((c) => parseInt(c)),
                    true,
                    accessToken
                  );

                  showStatusSummary(res, "products", "activate");

                  setSelectedIds([]);
                  await fetchProducts();
                } catch (error) {
                  alert(
                    errorMessage(error) ||
                    t("errors.actionFailed")
                  );
                }
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.activateSelected")}
            </button>
            <button
              role="button"
              onClick={async () => {
                try {
                  const res = await productBulkStatus(
                    selectedIds.map((c) => parseInt(c)),
                    false,
                    accessToken
                  );

                  showStatusSummary(
                    res,
                    "products",
                    "deactivate",
                    "still have stock"
                  );

                  setSelectedIds([]);
                  await fetchProducts();
                } catch (error) {
                  alert(
                    errorMessage(error) ||
                    t("errors.actionFailed")
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.deactivateSelected")}
            </button>
          </div>
        )}  

        <div className="mt-4">
          {isLoading || searchInput !== searchTerm ? (
            <p className="text-sm text-gray-500">{t("products.loadingList")}</p>
          ) : loadError ? null : (
            <ProductListTable
              products={products}
              returnTo={returnTo}
              onDelete={handleDeleteFromList}
              selectedIds={selectedIds}
              toggleSelected={toggleSelected}
              toggleAll={toggleAll}
            />
          )}
        </div>

        {!loadError && !isLoading && searchInput === searchTerm && <Pagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
        />}
      </div>
    </>
  );
}
