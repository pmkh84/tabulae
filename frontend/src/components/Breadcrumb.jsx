import { Link, useLocation } from "react-router-dom";
import { t } from "../i18n/index.js";

// Main mapping: route -> breadcrumb label
const breadcrumbNameMap = {
  "/dashboard": "navigation.dashboard",

  // Products
  "/products": "navigation.products",
  "/products/list": "breadcrumbs.productList",
  "/products/new": "breadcrumbs.newProduct",
  "/products/:id": "breadcrumbs.productDetail",
  "/products/:id/edit": "breadcrumbs.editProduct",
  "/products/:id/stock": "breadcrumbs.productStock",
  "/products/:id/history": "breadcrumbs.productHistory",

  // Expiring stock
  "/expiration": "navigation.expiringProducts",

  // Categories
  "/categories": "navigation.categories",

  // Warehouses
  "/warehouses": "navigation.warehouses",
  "/warehouses/list": "breadcrumbs.warehouseList",
  "/warehouses/new": "breadcrumbs.newWarehouse",
  "/warehouses/:id": "breadcrumbs.warehouseDetail",
  "/warehouses/:id/edit": "breadcrumbs.editWarehouse",

  // Stock by warehouse
  "/stock/warehouse/:warehouse_code": "breadcrumbs.warehouseStock",
  "/stock/warehouse/:warehouse_code/product/:product_code": "breadcrumbs.productStockByWarehouse",
  "/stock/warehouse/:warehouse_code/history": "breadcrumbs.warehouseStockHistory",
  "/stock/warehouse/:warehouse_id/products/:product_id/history": "breadcrumbs.productHistoryByWarehouse",

  // Movements
  "/stock-movements": "navigation.stockMovements",
  "/stock-movements/list": "breadcrumbs.movementList",
  "/stock-movements/new": "breadcrumbs.newMovement",
  "/stock-movements/:id": "breadcrumbs.movementDetail",

  // Users
  "/users": "navigation.users",
  "/users/new": "breadcrumbs.newUser",
  "/users/:id/edit": "breadcrumbs.editUser",

  // Profile
  "/profile": "breadcrumbs.profile",
};

// Manual overrides for paths with unclear hierarchy
const breadcrumbOverrides = {
  "/stock/warehouse/:warehouse_code": [
    { path: "/warehouses", label: "navigation.warehouses" },
    { path: "/warehouses/list", label: "breadcrumbs.warehouseList" },
    { path: null, label: "breadcrumbs.warehouseStock" },
  ],
  "/stock/warehouse/:warehouse_code/product/:product_code": [
    { path: "/products", label: "navigation.products" },
    { path: null, label: "breadcrumbs.productStockByWarehouse" },
  ],
};

const matchOverride = (pathname) => {
  for (const pattern in breadcrumbOverrides) {
    const regex = new RegExp(
      "^" + pattern.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/") + "$"
    );
    if (regex.test(pathname)) return breadcrumbOverrides[pattern];
  }
  return null;
};

const getBreadcrumbLabel = (path) => {
  for (const pattern in breadcrumbNameMap) {
    const regex = new RegExp(
      "^" + pattern.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/") + "$"
    );
    if (regex.test(path)) return breadcrumbNameMap[pattern];
  }
  return null;
};

export default function Breadcrumb({ navigationState, linkTargets = {} }) {
  const location = useLocation();
  const pathname = location.pathname;

  const override = matchOverride(pathname);
  const items = [];

  if (override) {
    override.forEach((item, index) => {
      items.push({
        path: item.path,
        label: item.label,
        isLast: index === override.length - 1,
      });
    });
  } else {
    const segments = pathname.split("/").filter(Boolean);
    let pathAccumulator = "";

    segments.forEach((segment, index) => {
      pathAccumulator += `/${segment}`;
      const label = getBreadcrumbLabel(pathAccumulator);
      if (label) {
        items.push({
          path: pathAccumulator,
          label,
          isLast: index === segments.length - 1,
        });
      }
    });
  }

  return (
    <nav aria-label={t("breadcrumbs.label")} className="bg-white px-4 py-2">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
        <li>
          <Link to="/dashboard" className="opacity-60 flex items-center gap-1 me-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            {t("common.home")}
          </Link>
        </li>

        {items.map(({ path, label, isLast }) => (
          <li key={path || label} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {isLast || !path ? (
              <span aria-current="page">{t(label)}</span>
            ) : (
              <Link to={linkTargets[path] ?? path} state={navigationState} className="opacity-60">
                {t(label)}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
