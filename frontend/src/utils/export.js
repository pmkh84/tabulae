/*CSV Export Utilities
This file provides reusable functions to export filtered data from various endpoints (e.g., movements, products, warehouses, users) to CSV format using PapaParse.
import Papa from "papaparse";
*/
import Papa from "papaparse";
import { t } from "../i18n/index.js";
import { apiFetch, errorMessage } from "../i18n/errors.js";
import { roleLabel, movementTypeLabel } from "../i18n/display.js";
import { formatDate } from "./format.js";

// Generic function to export data from any endpoint as a CSV
export async function exportCSVGeneric({
  accessToken,
  apiUrl,
  endpoint,
  queryParams = {},
  filename = "export.csv",
  mapFn,
  preserveWhitespace = false,
}) {
  try {
    // Build full URL with query parameters
    const url = new URL(`${apiUrl}${endpoint}`);
    for (const [key, value] of Object.entries(queryParams)) {
      if (
        value !== null &&
        value !== undefined &&
        !(typeof value === "string" && (preserveWhitespace ? value === "" : value.trim() === ""))
      ) {
        url.searchParams.append(key, value);
      }
    }

    // Fetch data with authentication header
    const response = await apiFetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    const items = data.data || [];

    // Convert data to CSV using PapaParse
    const csv = Papa.unparse(items.map(mapFn), { delimiter: ";" });
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const urlBlob = URL.createObjectURL(blob);

    // Trigger file download in browser
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    alert(t("exports.failed", { message: errorMessage(error) }));
  }
}

/*Export Specific Datasets
Each function below configures the right filters and mapping logic to call the generic exporter for a specific resource.

exportFilteredMovementsCSV
*/

export async function exportFilteredMovementsCSV({
  accessToken,
  filters,
  apiUrl,
}) {
  const queryParams = {
    limit: 1000,
    offset: 0,
  };

  if (filters.searchTerm?.trim()) queryParams.search = filters.searchTerm;
  if (filters.filterType) queryParams.move_type = filters.filterType;
  if (filters.dateFrom) queryParams.from = filters.dateFrom;
  if (filters.dateTo) queryParams.to = filters.dateTo;
  if (filters.userId) queryParams.user_id = filters.userId;

  return exportCSVGeneric({
    accessToken,
    apiUrl,
    endpoint: "/stock-movements",
    queryParams,
    filename: "stock-movements.csv",
    mapFn: (m) => ({
      [t("common.id")]: m.id,
      [t("common.type")]: movementTypeLabel(m.move_type),
      [t("common.user")]: m.user_name,
      [t("common.date")]: formatDate(m.created_at),
      [t("common.lines")]: m.lines?.length ?? 0,
    }),
  });
}

//exportFilteredProductsCSV

export async function exportFilteredProductsCSV({
  accessToken,
  filters,
  apiUrl,
}) {
  const queryParams = {
    limit: 1000,
    offset: 0,
  };

  if (filters.searchTerm) queryParams.search = filters.searchTerm;
  if (filters.category_id) queryParams.category_id = filters.category_id;
  if (filters.isActive === "true" || filters.isActive === "false") {
    queryParams.is_active = filters.isActive === "true";
  }
  if (filters.stockStatus) queryParams.stock_status = filters.stockStatus;

  return exportCSVGeneric({
    accessToken,
    apiUrl,
    endpoint: "/products",
    queryParams,
    preserveWhitespace: true,
    filename: "products.csv",
    mapFn: (p) => ({
      [t("common.sku")]: p.sku,
      [t("common.name")]: p.short_name,
      [t("common.category")]: p.category_name,
      [t("common.status")]: p.is_active ? t("common.active") : t("common.inactive"),
    }),
  });
}


//exportFilteredWarehousesCSV

export async function exportFilteredWarehousesCSV({
  accessToken,
  apiUrl,
  filters,
}) {
  const queryParams = {
    limit: 1000,
    offset: 0,
  };

  if (filters.searchTerm?.trim()) queryParams.search = filters.searchTerm;
  if (filters.isActive === "true" || filters.isActive === "false") {
    queryParams.is_active = filters.isActive === "true";
  }

  return exportCSVGeneric({
    accessToken,
    apiUrl,
    endpoint: "/warehouses",
    queryParams,
    filename: "warehouses.csv",
    mapFn: (a) => ({
      [t("common.id")]: a.id,
      [t("common.name")]: a.name,
      [t("common.status")]: a.is_active ? t("common.active") : t("common.inactive"),
    }),
  });
}

//exportFilteredUsersCSV

export async function exportFilteredUsersCSV({
  accessToken,
  filters,
  apiUrl,
}) {
  const queryParams = {
    limit: 1000,
    offset: 0,
  };

  if (filters.isActive === "true" || filters.isActive === "false") {
    queryParams.is_active = filters.isActive === "true";
  }
  if (filters.searchTerm?.trim()) {
    queryParams.search = filters.searchTerm;
  }

  return exportCSVGeneric({
    accessToken,
    apiUrl,
    endpoint: "/users",
    queryParams,
    filename: "users.csv",
    mapFn: (u) => ({
      [t("common.id")]: u.id,
      [t("common.name")]: u.name,
      [t("common.email")]: u.email,
      [t("common.role")]: roleLabel(u.role),
      [t("common.status")]: u.is_active ? t("common.active") : t("common.inactive"),
    }),
  });
}
