import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { createServer } from "vite";
import { t } from "../src/i18n/index.js";
import { apiFetch, LocalizedApiError, backendErrorMessage, errorMessage } from "../src/i18n/errors.js";
import { nativeValidationMessage, localizeNativeValidation, clearLocalizedValidation } from "../src/i18n/nativeValidation.js";
import { roleLabel, movementTypeLabel, formatGregorianMonth, chartValue } from "../src/i18n/display.js";
import { selectLiveMessages, selectResultStatus } from "../src/i18n/select.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const routes = [
  ["/login", "Login", "guest"], ["/register", "Register", "guest"],
  ["/users", "Users", "admin"], ["/users/new", "NewUser", "admin"],
  ["/users/:id/edit", "EditUser", "admin"], ["/products/new", "NewProduct", "admin"],
  ["/products/:id/edit", "EditProduct", "admin"], ["/warehouses/new", "NewWarehouse", "admin"],
  ["/warehouses/:id/edit", "EditWarehouse", "admin"], ["/categories", "Categories", "admin"],
  ["/dashboard", "Dashboard", "user"], ["/products", "Products", "user"],
  ["/stock-movements", "StockMovements", "user"], ["/warehouses", "Warehouses", "user"],
  ["/profile", "Profile", "user"], ["/expiration", "ExpirationStock", "user"],
  ["/stock-movements/new", "CreateMovement", "user"], ["/stock-movements/list", "MovementList", "user"],
  ["/stock-movements/:id", "MovementDetail", "user"], ["/products/list", "ProductList", "user"],
  ["/products/:id", "ProductDetail", "user"], ["/products/:id/stock", "ProductStock", "user"],
  ["/products/:id/history", "ProductHistory", "user"],
  ["/stock/warehouse/:warehouse_id/products/:product_id/history", "ProductHistoryByWarehouse", "user"],
  ["/warehouses/list", "WarehouseList", "user"], ["/warehouses/:id", "WarehouseDetail", "user"],
  ["/stock/warehouse/:warehouse_id/product/:product_id", "ProductStockByWarehouse", "user"],
  ["/stock/warehouse/:warehouse_id", "WarehouseStock", "user"],
  ["/stock/warehouse/:warehouse_id/history", "WarehouseStockHistory", "user"],
];
let server, AuthContext;
const originalFetch = globalThis.fetch;

before(async () => {
  // Never permit a localization check to reach an actual backend or database.
  globalThis.fetch = async () => { throw new Error("Unexpected transport in localization check"); };
  server = await createServer({
    root, configFile: false, logLevel: "silent", esbuild: { jsx: "automatic" },
    ssr: { resolve: { externalConditions: ["node", "module-sync"] } },
    define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://example.test") },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  ({ AuthContext } = await server.ssrLoadModule("/src/context/AuthProvider.jsx"));
});
after(async () => { globalThis.fetch = originalFetch; await server?.close(); });

async function source(file) { return readFile(root + file, "utf8"); }
function walk(node, visit, ancestors = []) {
  if (!node || typeof node !== "object") return;
  visit(node, ancestors);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc") continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit, [...ancestors, node]));
    else if (value && typeof value === "object") walk(value, visit, [...ancestors, node]);
  }
}
function tree(value) { return parse(value, { sourceType: "module", plugins: ["jsx"] }); }
function render(component, { path = "/dashboard", pattern = path, role = "admin", guest = false } = {}) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(AuthContext.Provider, { value: {
      user: { id: 1, name: "کاربر آزمایشی", email: "fixture@example.test", role },
      accessToken: null, isLoading: false, isAuthenticated: !guest, login() {}, logout() {}, setUser() {},
    } }, React.createElement(Routes, null, React.createElement(Route, { path: pattern, element: component })))
  ));
}
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

test("route audit includes every existing page and retains route access groups", async () => {
  const actual = [];
  walk(tree(await source("src/router/AppRouter.jsx")), (node, ancestors) => {
    if (node.type !== "JSXOpeningElement" || node.name.name !== "Route") return;
    const path = node.attributes.find((a) => a.name?.name === "path")?.value?.value;
    if (!path || path === "/") return;
    const component = node.attributes.find((a) => a.name?.name === "element")?.value?.expression?.openingElement?.name?.name;
    const guard = ancestors.filter((n) => n.type === "JSXElement" && n.openingElement.name.name === "Route")
      .map((n) => n.openingElement.attributes.find((a) => a.name?.name === "element")?.value?.expression?.openingElement?.name?.name)
      .find((name) => ["PublicRoute", "AdminRoute", "PrivateRoute"].includes(name));
    actual.push([path, component, { PublicRoute: "guest", AdminRoute: "admin", PrivateRoute: "user" }[guard]]);
  });
  assert.deepEqual(actual, routes);
});

test("every page assigns a Persian title and has no static English JSX presentation", async () => {
  for (const [, name] of routes) {
    let title = false;
    walk(tree(await source(`src/pages/${name}.jsx`)), (node, ancestors) => {
      if (node.type === "AssignmentExpression" && node.left.object?.name === "document" && node.left.property?.name === "title") {
        const key = node.right.arguments?.[0]?.value;
        assert.match(t(key), /[ء-ی]/u, name); title = true;
      }
      if (node.type === "JSXText") assert.doesNotMatch(node.value, /[A-Za-z]/, `${name}: ${node.value.trim()}`);
      if (node.type === "StringLiteral" && ancestors.at(-1)?.type === "JSXAttribute" && ["placeholder", "label", "aria-label", "title", "text"].includes(ancestors.at(-1).name.name)) {
        assert.doesNotMatch(node.value, /[A-Za-z]/, `${name}: ${node.value}`);
      }
    });
    assert.equal(title, true, name);
  }
});

test("all static translation references resolve across frontend source", async () => {
  async function audit(directory) {
    for (const item of await readdir(root + directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) await audit(file);
      else if (/\.jsx?$/.test(item.name)) walk(tree(await source(file)), (node) => {
        if (node.type === "CallExpression" && node.callee.name === "t" && node.arguments[0]?.type === "StringLiteral") {
          const key = node.arguments[0].value;
          assert.notEqual(t(key), key, `${file}: missing ${key}`);
        }
      });
    }
  }
  await audit("src");
});

test("all 29 route components render guest/user/admin initial states without live effects", async () => {
  for (const [pattern, name, access] of routes) {
    const { default: Component } = await server.ssrLoadModule(`/src/pages/${name}.jsx`);
    const previousDocument = globalThis.document;
    // Only the portal target is read during CreateMovement's initial render; no DOM effects run.
    if (name === "CreateMovement") globalThis.document = { body: {} };
    try {
      const path = pattern.replace(/:[^/]+/g, "7");
      const markup = render(React.createElement(Component), { path, pattern, role: access === "admin" ? "admin" : "user", guest: access === "guest" });
      assert.match(markup, /[ء-ی]/u, name);
      const text = markup.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]*>/g, "");
      assert.doesNotMatch(text, /\b(Dashboard|Products|Warehouses|Incoming|Outgoing|Loading|Select|Password|Search|Save|Cancel)\b/, name);
    } finally {
      if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    }
  }
});

test("structured validation feedback is Persian and retains raw field paths/details", () => {
  const detail = [
    { type: "string_too_short", loc: ["body", "short_name"], msg: "String should have at least 3 characters", ctx: { min_length: 3 } },
    { type: "greater_than", loc: ["body", "lines", 0, "quantity"], msg: "Input should be greater than 0", ctx: { gt: 0 } },
    { type: "missing", loc: ["body", "email"], msg: "Field required" },
  ];
  const error = new LocalizedApiError(detail, 422);
  assert.match(error.message, /نام کوتاه:.*۳/);
  assert.match(error.message, /ردیف ۱ — تعداد:.*۰/);
  assert.deepEqual(error.fieldErrors[1].path, ["body", "lines", 0, "quantity"]);
  assert.equal(error.detail, detail);
  assert.equal(Object.keys(error).includes("detail"), false);
  assert.doesNotMatch(error.message, /String|Input|Field required/);
  const malformed = new LocalizedApiError([
    null,
    { type: "string_too_short", loc: ["body", "name"] },
    { type: "greater_than", ctx: null, loc: {} },
  ], 422);
  assert.equal(malformed.status, 422);
  assert.doesNotMatch(malformed.message, /undefined|NaN/);
});

test("known errors and unknown/server errors use safe Persian presentation", () => {
  for (const [message, status, key] of [
    ["SKU is already registered.", 400, "errors.duplicateSku"],
    ["Invalid credentials.", 401, "errors.credentials"],
    ["User is inactive. Please contact an administrator to activate your account.", 403, "errors.inactiveUser"],
    ["Warehouse 7 is not empty and therefore cannot be deactivated.", 403, "errors.warehouseStock"],
    ["Internal SQL failure with private diagnostics", 500, "errors.server"],
    ["unknown", 404, "errors.notFound"],
  ]) assert.equal(backendErrorMessage(message, status), t(key));
  assert.equal(errorMessage(new Error("arbitrary diagnostics")), t("errors.unexpected"));
});

test("HTTP errors retain status and network errors retain their original cause", async () => {
  globalThis.fetch = async () => jsonResponse({ detail: "You do not have permission to perform this action." }, 403);
  await assert.rejects(apiFetch("http://example.test"), (error) => error.status === 403 && error.message === t("errors.forbidden"));
  const cause = new TypeError("Failed to fetch");
  globalThis.fetch = async () => { throw cause; };
  await assert.rejects(apiFetch("http://example.test"), (error) => error.cause === cause && error.message === t("errors.network"));
});

test("native form feedback preserves values/constraints and clears only owned custom messages", () => {
  const input = { type: "email", value: "raw@example.test", validity: { valueMissing: true },
    setCustomValidity(message) { this.message = message; this.validity.customError = Boolean(message); } };
  localizeNativeValidation({ target: input });
  assert.equal(input.message, t("validation.required"));
  assert.equal(input.value, "raw@example.test");
  clearLocalizedValidation({ target: input }); assert.equal(input.message, "");
  input.validity = { typeMismatch: true }; assert.equal(nativeValidationMessage(input), t("validation.email"));
  input.validity = { tooShort: true }; input.minLength = 8;
  assert.match(nativeValidationMessage(input), /۸/);
  const other = { validity: { customError: true }, setCustomValidity() { assert.fail("must preserve another component's constraint"); } };
  localizeNativeValidation({ target: other }); clearLocalizedValidation({ target: other });
});

test("React Select default, result and screen-reader state messages are Persian", () => {
  assert.equal(selectResultStatus({ count: 12 }), "۱۲ گزینه در دسترس است.");
  assert.equal(selectLiveMessages.onChange({ action: "clear" }), t("select.cleared"));
  assert.equal(selectLiveMessages.onChange({ action: "select-option", label: "Raw Product" }), t("select.selected", { label: "Raw Product" }));
  assert.equal(selectLiveMessages.onFocus({ label: "Raw SKU", isDisabled: true }), t("select.disabled"));
  assert.match(selectLiveMessages.guidance(), /جهت‌نما/);
});

test("display enums/chart values are translated without altering source data/month buckets", () => {
  const record = Object.freeze({ move_type: "incoming", role: "admin", quantity: 1234, month: "2025-05" });
  assert.equal(movementTypeLabel(record.move_type), t("notifications.incoming"));
  assert.equal(roleLabel(record.role), t("users.roles.admin"));
  assert.deepEqual(chartValue(record.quantity, "Raw Product"), ["۱٬۲۳۴", "Raw Product"]);
  assert.match(formatGregorianMonth(record.month), /۲۰۲۵/);
  assert.equal(record.month, "2025-05"); assert.equal(record.move_type, "incoming");
});

test("localized tables keep stored names/SKUs/IDs and render counts/dates/roles in Persian", async () => {
  const { default: StockTable } = await server.ssrLoadModule("/src/components/ProductStockExpirationTable.jsx");
  const data = Object.freeze({ warehouse_name: "Raw Warehouse", product_name: "Raw Product", sku: "SKU001", lot: "LOT001", quantity: 12, expiration_date: "2024-03-20", product_id: 7, warehouse_id: 8 });
  const markup = render(React.createElement(StockTable, { stock: [data] }));
  assert.match(markup, /Raw Warehouse/); assert.match(markup, /SKU001/);
  assert.match(markup, /<bdi dir="ltr">LOT001<\/bdi>/);
  assert.match(markup, /۱۴۰۳\/۰۱\/۰۱/); assert.match(markup, />۱۲</);
  assert.equal(data.quantity, 12); assert.equal(data.sku, "SKU001");
  const { default: ErrorMessage } = await server.ssrLoadModule("/src/components/ErrorMessage.jsx");
  const feedback = render(React.createElement(ErrorMessage, { message: new LocalizedApiError("Product not found", 404).message }));
  assert.match(feedback, /role="alert"/); assert.match(feedback, /محصول یافت نشد/);
  const { default: UsersTable } = await server.ssrLoadModule("/src/components/UsersListTable.jsx");
  const users = [{ id: 7, name: "Raw User", email: "user@example.test", role: "admin", is_active: true }];
  const userMarkup = render(React.createElement(UsersTable, { users, selected: [], toggleSelected() {}, toggleAll() {} }));
  assert.match(userMarkup, /Raw User/); assert.match(userMarkup, /مدیر سیستم/);
  assert.match(userMarkup, /<bdi dir="ltr">user@example.test<\/bdi>/);
});

test("bulk status summaries localize response counts and keep response data intact", async () => {
  const { showStatusSummary } = await server.ssrLoadModule("/src/utils/showStatusSummary.js");
  const originalAlert = globalThis.alert, messages = [];
  const response = Object.freeze({ message: "12 products updated", skipped: 2 });
  try {
    globalThis.alert = (message) => messages.push(message);
    showStatusSummary(response, "products", "deactivated");
    assert.match(messages[0], /۱۲.*محصولات.*غیرفعال/);
    assert.match(messages[0], /۲.*بدون تغییر/);
    assert.equal(response.message, "12 products updated");
  } finally { globalThis.alert = originalAlert; }
});

test("create/update/auth request contracts stay raw and successful results stay unchanged", async () => {
  const products = await server.ssrLoadModule("/src/api/products.js");
  const warehouses = await server.ssrLoadModule("/src/api/warehouses.js");
  const movements = await server.ssrLoadModule("/src/api/stock_moves.js");
  const auth = await server.ssrLoadModule("/src/api/auth.js");
  const calls = [], result = { id: 7, quantity: 12, token_type: "bearer" };
  globalThis.fetch = async (input, options) => { calls.push({ input: String(input), options }); return jsonResponse(result); };
  const product = { sku: "SKU001", short_name: "Raw Product", category_id: 3, description: "" };
  assert.deepEqual(await products.createProduct(product, "fixture-token"), result);
  await products.updateProduct(7, product, "fixture-token");
  await warehouses.createWarehouse({ name: "Raw Warehouse" }, "fixture-token");
  await warehouses.warehouseUpdate(8, { name: "Raw Warehouse", is_active: true }, "fixture-token");
  const movement = { move_type: "outgoing", lines: [{ product_id: 7, warehouse_id: 8, lot: "LOT001", expiration_date: "2024-03-20", quantity: 12 }] };
  await movements.createMovement(movement, "fixture-token");
  await auth.login({ email: "raw@example.test", password: "fixture-password" });
  assert.deepEqual(JSON.parse(calls[0].options.body), product);
  assert.deepEqual(JSON.parse(calls[4].options.body), movement);
  assert.equal(calls[1].input.endsWith("/products/7"), true);
  assert.equal(calls[3].options.method, "PUT");
  assert.equal(calls[0].options.headers.Authorization, "Bearer fixture-token");
  assert.equal(new URLSearchParams(calls[5].options.body).get("username"), "raw@example.test");
  assert.equal(calls[5].options.credentials, "include");
});

test("CSV exports localize headers/status/date and preserve raw stored values/numbers", async () => {
  const exports = await server.ssrLoadModule("/src/utils/export.js");
  const originalDocument = globalThis.document, originalCreate = URL.createObjectURL;
  let blob;
  globalThis.document = { body: { appendChild() {}, removeChild() {} }, createElement() { return { setAttribute() {}, click() {} }; } };
  URL.createObjectURL = (value) => { blob = value; return "blob:fixture"; };
  try {
    let productExportUrl;
    globalThis.fetch = async (input) => {
      productExportUrl = new URL(input);
      return jsonResponse({ data: [{ sku: "SKU001", short_name: "Raw Product", category_name: "Raw Category", is_active: true }] });
    };
    await exports.exportFilteredProductsCSV({
      accessToken: "fixture-token", apiUrl: "http://example.test",
      filters: { searchTerm: "Raw", category_id: "3", isActive: "false", stockStatus: "out_of_stock" },
    });
    assert.equal(productExportUrl.searchParams.get("search"), "Raw");
    assert.equal(productExportUrl.searchParams.get("category_id"), "3");
    assert.equal(productExportUrl.searchParams.get("is_active"), "false");
    assert.equal(productExportUrl.searchParams.get("stock_status"), "out_of_stock");
    const bytes = Buffer.from(await blob.arrayBuffer());
    assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    const csv = bytes.toString("utf8");
    assert.match(csv, /کد محصول \(SKU\);نام;دسته‌بندی;وضعیت/);
    assert.match(csv, /SKU001;Raw Product;Raw Category;فعال/);
    await exports.exportFilteredProductsCSV({ accessToken: "fixture-token", apiUrl: "http://example.test", filters: { searchTerm: " " } });
    assert.equal(productExportUrl.searchParams.get("search"), " ");
    assert.equal(productExportUrl.searchParams.has("stock_status"), false);
    globalThis.fetch = async () => jsonResponse({ data: [{ id: 7, move_type: "outgoing", user_name: "Raw User", created_at: "2024-03-20T00:30:00+03:30", lines: [{}, {}] }] });
    await exports.exportFilteredMovementsCSV({ accessToken: "fixture-token", apiUrl: "http://example.test", filters: {} });
    const movementCSV = Buffer.from(await blob.arrayBuffer()).toString("utf8");
    assert.match(movementCSV, /7;خروج کالا;Raw User;۱۴۰۳\/۰۱\/۰۱;2/);
  } finally {
    URL.createObjectURL = originalCreate;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});
