import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { createHookFixture } from "./helpers/hookFixture.mjs";
import { t } from "../src/i18n/index.js";
import { LocalizedApiError } from "../src/i18n/errors.js";
import { productFormValues, validateProductForm, productPayload, productErrorFeedback, submitProductForm } from "../src/utils/productForm.js";
import { productListContext, productReturnTo, updateProductListQuery } from "../src/utils/productNavigation.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const originalFetch = globalThis.fetch;
const category = { id: 120, name: "Raw Category" };
const originalProduct = Object.freeze({ id: 7, sku: "SKU007", short_name: "Raw Product", description: null, category_id: 120, category_name: category.name, is_active: false });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const page = (items, offset = 0, total = items.length) => ({ data: items, total, limit: 100, offset });
let server, api, useProductForm, AuthContext;

before(async () => {
  globalThis.fetch = async () => { throw new Error("Live transport is prohibited in frontend checks"); };
  server = await createServer({
    root, configFile: false, logLevel: "silent", esbuild: { jsx: "automatic" },
    ssr: { resolve: { externalConditions: ["node", "module-sync"] } },
    define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://example.test") },
    server: { middlewareMode: true, hmr: false, watch: null },
    plugins: [{
      name: "product-hook-unit-fixture",
      resolveId(id) { if (id === "virtual:product-hook-fixture") return "\0" + id; },
      load(id) {
        if (id !== "\0virtual:product-hook-fixture") return;
        return ["useState", "useRef", "useEffect"].map((name) =>
          `import { ${name} as real${name} } from 'react'; export const ${name} = (...args) => globalThis.__productHookFixture ? globalThis.__productHookFixture.${name}(...args) : real${name}(...args);`
        ).join("\n");
      },
      transform(code, id) {
        if (/\/src\/hooks\/useProduct(Form|Categories)\.js$/.test(id.replaceAll("\\", "/"))) {
          return code.replace('from "react"', 'from "virtual:product-hook-fixture"');
        }
      },
    }],
  });
  api = await server.ssrLoadModule("/src/api/products.js");
  ({ useProductForm } = await server.ssrLoadModule("/src/hooks/useProductForm.js"));
  ({ AuthContext } = await server.ssrLoadModule("/src/context/AuthProvider.jsx"));
});
after(async () => { delete globalThis.__productHookFixture; globalThis.fetch = originalFetch; await server?.close(); });

function hookFixture(input) {
  return createHookFixture(useProductForm, input, "__productHookFixture");
}

function productTransport({ product = originalProduct, failSave, failCategories, missing = false } = {}) {
  let stored = { ...product };
  const calls = [];
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input); calls.push({ url, options });
    if (url.pathname === "/categories") return failCategories ? response({ detail: "Database failure" }, 500) : response(page([category]));
    if (options.method === "POST" || options.method === "PUT") {
      if (failSave) return failSave();
      stored = { ...stored, ...JSON.parse(options.body) };
      return response(stored, options.method === "POST" ? 201 : 200);
    }
    return missing ? response({ detail: "Product not found" }, 404) : response(stored);
  };
  return { calls, get stored() { return stored; } };
}

test("required fields and exact SKU constraints are Persian without normalizing values", () => {
  assert.deepEqual(validateProductForm(productFormValues(), []), { sku: t("validation.required"), short_name: t("validation.required"), category_id: t("validation.required") });
  for (const sku of ["AB", "A".repeat(21), "abc", " AB123", "AB123 ", "SKU۱۲۳", "AB-123", "ABC\n"]) {
    const form = { ...productFormValues(originalProduct), sku };
    assert.equal(validateProductForm(form, [category]).sku, t("products.skuConstraint")); assert.equal(form.sku, sku);
  }
  for (const sku of ["ABC", "A".repeat(20)]) assert.equal(validateProductForm({ ...productFormValues(originalProduct), sku }, [category]).sku, undefined);
});

test("name/description/category validation matches backend lengths and positive IDs", () => {
  const form = productFormValues(originalProduct);
  assert.equal(validateProductForm({ ...form, short_name: "ab" }, [category]).short_name, t("products.nameConstraint"));
  assert.equal(validateProductForm({ ...form, short_name: "a".repeat(101) }, [category]).short_name, t("products.nameConstraint"));
  assert.equal(validateProductForm({ ...form, short_name: "😀".repeat(100), description: "😀".repeat(500) }, [category]).description, undefined);
  assert.equal(validateProductForm({ ...form, description: "a".repeat(501) }, [category]).description, t("products.descriptionConstraint"));
  for (const category_id of [0, "0", "-1", "1.5", "999", "not-an-id", "0x78"]) assert.equal(validateProductForm({ ...form, category_id }, [category]).category_id, t("products.categoryInvalid"));
});

test("metadata payload omits unchanged status/null description and unrelated relationships", () => {
  const form = { ...productFormValues(originalProduct), short_name: "Edited Product", category_id: "120", id: 999, stock: 999, history: [] };
  assert.deepEqual(productPayload(form, originalProduct), { short_name: "Edited Product" });
  assert.deepEqual(productPayload({ ...form, is_active: true }, originalProduct), { short_name: "Edited Product", is_active: true });
  assert.equal(originalProduct.id, 7); assert.equal(originalProduct.description, null); assert.equal(originalProduct.is_active, false);
});

test("successful create uses the existing POST, Persian feedback and a guarded pending state", async () => {
  const transport = productTransport(); const fixture = hookFixture({ accessToken: "create-fixture" });
  try {
    await fixture.settle();
    for (const [name, value] of Object.entries({ sku: "NEW001", short_name: "محصول تازه", description: "", category_id: "120" })) fixture.value.onChange({ target: { name, value } });
    await fixture.settle(); const saved = await fixture.value.save(); await fixture.settle();
    assert.equal(saved.sku, "NEW001");
    const call = transport.calls.find((item) => item.options.method === "POST");
    assert.equal(call.url.pathname, "/products"); assert.equal(call.options.headers.Authorization, "Bearer create-fixture");
    assert.deepEqual(JSON.parse(call.options.body), { sku: "NEW001", short_name: "محصول تازه", description: "", category_id: 120 });
    assert.equal(fixture.value.isSubmitting, false); assert.match(t("products.created"), /موفقیت/);
  } finally { fixture.stop(); }
});

test("editing prepopulates, sends only changes, refreshes its baseline and keeps ID/status", async () => {
  const transport = productTransport(); const fixture = hookFixture({ id: "7", accessToken: "edit-fixture" });
  try {
    await fixture.settle(); assert.deepEqual(fixture.value.form, productFormValues(originalProduct));
    fixture.value.onChange({ target: { name: "short_name", value: "Edited Product" } }); await fixture.settle();
    const saved = await fixture.value.save(); await fixture.settle();
    assert.deepEqual(JSON.parse(transport.calls.find((item) => item.options.method === "PUT").options.body), { short_name: "Edited Product" });
    assert.equal(saved.id, 7); assert.equal(saved.is_active, false); assert.equal(saved.description, null);
    assert.equal(fixture.value.original.short_name, "Edited Product");
    assert.equal(await fixture.value.save(), null); await fixture.settle(); assert.equal(fixture.value.message, t("products.unchanged"));
    assert.equal(transport.calls.filter((item) => item.options.method === "PUT").length, 1);
    assert.equal((await api.getProductById(7, "edit-fixture")).short_name, "Edited Product");
  } finally { fixture.stop(); }
});

test("validation blocks transport and duplicate/structured failures retain entered form data", async () => {
  const fixture = hookFixture({ accessToken: "validation-fixture" });
  const transport = productTransport({ failSave: async () => response({ detail: "SKU is already registered." }, 400) });
  try {
    await fixture.settle(); await fixture.value.save(); await fixture.settle();
    assert.equal(transport.calls.some((call) => call.options.method === "POST"), false);
    assert.equal(fixture.value.errors.sku, t("validation.required"));
    for (const [name, value] of Object.entries(productFormValues(originalProduct))) fixture.value.onChange({ target: { name, value, type: name === "is_active" ? "checkbox" : "text", checked: value } });
    await fixture.settle(); await fixture.value.save(); await fixture.settle();
    assert.equal(fixture.value.errors.sku, t("errors.duplicateSku")); assert.equal(fixture.value.form.sku, "SKU007");
    assert.equal(fixture.value.message, t("products.correctFields"));
    const detail = [{ loc: ["body", "description"], type: "string_too_long", ctx: { max_length: 500 }, msg: "Raw validation" }];
    const feedback = productErrorFeedback(new LocalizedApiError(detail, 422));
    assert.match(feedback.fields.description, /۵۰۰/); assert.doesNotMatch(feedback.message, /Raw/);
    assert.equal(productErrorFeedback(new LocalizedApiError("SKU is already in use", 400)).fields.sku, t("errors.duplicateSku"));
  } finally { fixture.stop(); }
});

test("network/server failures release submission lock, preserve values and allow a retry", async () => {
  for (const failure of [async () => { throw new TypeError("Failed to fetch"); }, async () => response({ detail: "Internal diagnostics" }, 500)]) {
    const lock = { current: false }, pending = [], form = productFormValues(originalProduct);
    globalThis.fetch = failure;
    const failed = await submitProductForm({ form, categories: [category], lock, onPending: (value) => pending.push(value), persist: (payload) => api.createProduct(payload, "failure-fixture") });
    assert.equal(failed.status, "failed"); assert.match(failed.message, /[ء-ی]/u);
    assert.equal(lock.current, false); assert.deepEqual(pending, [true, false]); assert.deepEqual(form, productFormValues(originalProduct));
    globalThis.fetch = async () => response(originalProduct, 201);
    assert.equal((await submitProductForm({ form, categories: [category], lock, onPending() {}, persist: (payload) => api.createProduct(payload, "failure-fixture") })).status, "saved");
  }
});

test("rapid repeated saves make one request and disable the actual form hook until completion", async () => {
  let finish;
  const transport = productTransport({ failSave: () => new Promise((resolve) => { finish = resolve; }) });
  const fixture = hookFixture({ id: "7", accessToken: "repeat-fixture" });
  try {
    await fixture.settle(); fixture.value.onChange({ target: { name: "short_name", value: "Pending Product" } }); await fixture.settle();
    const first = fixture.value.save(); const second = fixture.value.save(); await fixture.settle();
    assert.equal(fixture.value.isSubmitting, true); assert.equal(fixture.value.canSubmit, false);
    assert.equal(await second, null); assert.equal(transport.calls.filter((call) => call.options.method === "PUT").length, 1);
    finish(response({ ...originalProduct, short_name: "Pending Product" })); await first; await fixture.settle();
    assert.equal(fixture.value.isSubmitting, false);
  } finally { fixture.stop(); }
});

test("product not found remains a visible Persian missing state with no writable form", async () => {
  productTransport({ missing: true }); const fixture = hookFixture({ id: "7", accessToken: "missing-fixture" });
  try {
    await fixture.settle(); assert.equal(fixture.value.load.status, "missing");
    assert.equal(fixture.value.load.error, t("errors.productNotFound")); assert.equal(fixture.value.canSubmit, false);
    assert.equal(await fixture.value.save(), null);
  } finally { fixture.stop(); }
});

test("field feedback focuses on submission without moving focus during subsequent typing", async () => {
  productTransport(); const fixture = hookFixture({ accessToken: "focus-fixture" }); const focused = [];
  try {
    await fixture.settle();
    fixture.value.formRef.current = { elements: { namedItem(name) { return { focus() { focused.push(name); } }; } } };
    await fixture.value.save(); await fixture.settle(); assert.deepEqual(focused, ["sku"]);
    fixture.value.onChange({ target: { name: "sku", value: "ABC123" } }); await fixture.settle(); assert.deepEqual(focused, ["sku"]);
    await fixture.value.save(); await fixture.settle(); assert.deepEqual(focused, ["sku", "short_name"]);
  } finally { fixture.stop(); }
});

test("an intended status change preserves backend stock refusal and field feedback", async () => {
  const product = { ...originalProduct, is_active: true };
  const transport = productTransport({ product, failSave: async () => response({ detail: "This product still has remaining stock and cannot be deactivated." }, 400) });
  const fixture = hookFixture({ id: "7", accessToken: "stock-rule-fixture" });
  try {
    await fixture.settle(); fixture.value.onChange({ target: { name: "is_active", type: "checkbox", checked: false } }); await fixture.settle();
    await fixture.value.save(); await fixture.settle();
    assert.deepEqual(JSON.parse(transport.calls.find((call) => call.options.method === "PUT").options.body), { is_active: false });
    assert.equal(fixture.value.errors.is_active, t("errors.productStock"));
    assert.equal(fixture.value.original.is_active, true); assert.equal(fixture.value.form.is_active, false);
  } finally { fixture.stop(); }
});

test("category pagination collects beyond 100 using backend totals and existing offsets", async () => {
  const items = Array.from({ length: 235 }, (_, index) => ({ id: index + 1, name: `Category ${index + 1}` })), offsets = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input), offset = Number(url.searchParams.get("offset")); offsets.push(offset);
    assert.equal(url.searchParams.get("limit"), "100"); return response(page(items.slice(offset, offset + 100), offset, items.length));
  };
  const all = await api.getAllProductCategories("pagination-fixture");
  assert.equal(all.length, 235); assert.deepEqual(offsets, [0, 100, 200]);
  assert.equal(validateProductForm({ ...productFormValues(originalProduct), category_id: 235 }, all).category_id, undefined);
});

test("partial category-load failures never expose an incomplete list and can retry from zero", async () => {
  const items = Array.from({ length: 101 }, (_, index) => ({ id: index + 1, name: `Category ${index}` }));
  let fail = true;
  globalThis.fetch = async (input) => {
    const offset = Number(new URL(input).searchParams.get("offset"));
    return offset && fail ? response({ detail: "Database failure" }, 500) : response(page(items.slice(offset, offset + 100), offset, 101));
  };
  await assert.rejects(api.getAllProductCategories("partial-fixture"), (error) => error.status === 500);
  fail = false; assert.equal((await api.getAllProductCategories("partial-fixture")).length, 101);
  productTransport({ failCategories: true }); const fixture = hookFixture({ id: "7", accessToken: "category-failure-fixture" });
  try {
    await fixture.settle(); assert.equal(fixture.value.categories.status, "error"); assert.deepEqual(fixture.value.categories.data, []);
    assert.equal(fixture.value.canSubmit, false); assert.equal(await fixture.value.save(), null);
    assert.equal(fixture.value.form.category_id, 120);
    fixture.value.onChange({ target: { name: "short_name", value: "Unsaved Category Retry" } }); await fixture.settle();
    productTransport(); fixture.value.categories.retry(); await fixture.settle(); assert.equal(fixture.value.categories.status, "ready");
    assert.equal(fixture.value.form.short_name, "Unsaved Category Retry"); assert.equal(fixture.value.form.category_id, 120);
  } finally { fixture.stop(); }
});

test("concurrent category consumers share only pending requests, not a stale completed cache", async () => {
  let requests = 0; globalThis.fetch = async () => { requests++; return response(page([category])); };
  const a = api.getAllProductCategories("shared-fixture"), b = api.getAllProductCategories("shared-fixture");
  assert.equal(a, b); await Promise.all([a, b]); assert.equal(requests, 1);
  await api.getAllProductCategories("shared-fixture"); assert.equal(requests, 2);
  assert.deepEqual(await api.getCategories("legacy-fixture"), [category]);
});

test("malformed, shifting or duplicate category pages fail visibly instead of truncating", async () => {
  for (const data of [page([], 0, 5), page([category, category]), { data: [category] }, page([category], 99)]) {
    globalThis.fetch = async () => response(data);
    await assert.rejects(api.getAllProductCategories("bad-page-fixture"), (error) => error.status === 502);
  }
  const items = Array.from({ length: 102 }, (_, index) => ({ id: index + 1 }));
  globalThis.fetch = async (input) => {
    const offset = Number(new URL(input).searchParams.get("offset"));
    return response(page(items.slice(offset, offset + 100), offset, offset ? 102 : 101));
  };
  await assert.rejects(api.getAllProductCategories("shifting-page-fixture"), (error) => error.status === 502);
});

test("token refresh and category creation preserve unsaved values and selected category", async () => {
  productTransport(); const fixture = hookFixture({ id: "7", accessToken: "old-token-fixture" });
  try {
    await fixture.settle(); fixture.value.onChange({ target: { name: "short_name", value: "Unsaved Product" } }); await fixture.settle();
    fixture.update({ accessToken: "new-token-fixture" }); await fixture.settle();
    assert.equal(fixture.value.form.short_name, "Unsaved Product"); assert.equal(fixture.value.form.category_id, 120);
    fixture.value.onCategoryPending(true); await fixture.settle(); assert.equal(fixture.value.canSubmit, false);
    fixture.value.onCategoryCreated({ id: 121, name: "New Category" }); fixture.value.onCategoryPending(false); await fixture.settle();
    assert.equal(fixture.value.form.category_id, 121); assert.equal(fixture.value.form.short_name, "Unsaved Product");
    assert.equal(fixture.value.categories.data.at(-1).id, 121);
  } finally { fixture.stop(); }
});

test("late load responses after unmount do not update form or category state", async () => {
  const requests = [];
  globalThis.fetch = () => new Promise((resolve) => requests.push(resolve));
  const fixture = hookFixture({ id: "7", accessToken: "unmount-fixture" }); fixture.stop();
  requests[0](response(page([category]))); requests[1](response(originalProduct));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fixture.lateUpdates, []);
});

test("changing product routes ignores an older product response and initializes the new ID", async () => {
  const pending = new Map();
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === "/categories") return response(page([category]));
    return new Promise((resolve) => pending.set(url.pathname, resolve));
  };
  const fixture = hookFixture({ id: "7", accessToken: "route-fixture" });
  try {
    await fixture.settle(); fixture.update({ id: "8" }); await fixture.settle();
    pending.get("/products/8")(response({ ...originalProduct, id: 8, sku: "SKU008" })); await fixture.settle();
    pending.get("/products/7")(response(originalProduct)); await fixture.settle();
    assert.equal(fixture.value.original.id, 8); assert.equal(fixture.value.form.sku, "SKU008");
  } finally { fixture.stop(); }
});

test("navigation preserves query context and rejects external/unrelated return destinations", () => {
  const search = "?search=" + encodeURIComponent("محصول & SKU") + "&category_id=120&is_active=false&offset=30&extra=keep";
  assert.deepEqual(productListContext(search), { searchTerm: "محصول & SKU", selectedCategoryId: "120", isActive: "false", offset: 30 });
  assert.equal(productReturnTo({ productReturnTo: "/products/list" + search }), "/products/list" + search);
  for (const productReturnToValue of ["https://example.test", "//example.test/products/list", "/products/list-other", "/warehouses/list", "javascript:alert(1)"]) assert.equal(productReturnTo({ productReturnTo: productReturnToValue }), "/products/list");
  const changed = updateProductListQuery(search, { search: "new", offset: 0 });
  assert.equal(changed.get("search"), "new"); assert.equal(changed.has("offset"), false); assert.equal(changed.get("extra"), "keep");
  assert.equal(productListContext("?offset=-1&is_active=invalid&category_id=bad").offset, 0);
});

function render(element, role = "admin", path = "/products/new") {
  delete globalThis.__productHookFixture;
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(AuthContext.Provider, { value: { user: { role, name: "Fixture User" }, accessToken: null, logout() {}, isLoggingOut: false } }, element)));
}

test("real React SSR shows Persian category failures and administrator-only product actions", async () => {
  const { default: Table } = await server.ssrLoadModule("/src/components/ProductListTable.jsx");
  const table = React.createElement(Table, { products: [originalProduct], selectedIds: [], toggleSelected() {}, toggleAll() {} });
  assert.match(render(table), /ویرایش/); assert.match(render(table), /حذف/);
  assert.doesNotMatch(render(table, "user"), /ویرایش|حذف/);
  const { default: Feedback } = await server.ssrLoadModule("/src/components/ProductCategoryFeedback.jsx");
  const markup = render(React.createElement(Feedback, { categories: { status: "error", error: t("errors.network"), retry() {} } }));
  assert.match(markup, /role="alert"/); assert.match(markup, /فهرست کامل/); assert.match(markup, /تلاش دوباره/);
  const { default: NewProduct } = await server.ssrLoadModule("/src/pages/NewProduct.jsx");
  const form = render(React.createElement(NewProduct));
  const sku = form.match(/<input[^>]*id="sku"[^>]*>/)[0];
  assert.match(sku, /name="sku"/); assert.match(sku, /minLength="3"/); assert.match(sku, /maxLength="20"/);
  assert.match(sku, /pattern="\[A-Z0-9\]\+"/);
  assert.match(form, /type="submit" disabled=""/); assert.match(form, /بارگذاری همه دسته‌بندی/);
  assert.match(form, /noValidate=""/); assert.doesNotMatch(form, /Create Product|Loading categories/);
});
