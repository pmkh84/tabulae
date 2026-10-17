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
import { warehouseFormValues, validateWarehouseForm, warehousePayload, submitWarehouseForm, checkedWarehouse, checkedWarehousePage, checkedWarehouseBulk, warehouseErrorFeedback } from "../src/utils/warehouseForm.js";
import { warehouseListContext, warehouseReturnTo, warehouseStockReturnTo, updateWarehouseQuery, warehousePageOffset } from "../src/utils/warehouseNavigation.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const originalFetch = globalThis.fetch;
const original = Object.freeze({ id: 7, name: "انبار اصلی", is_active: false });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const page = (data, total = data.length) => ({ data, total, limit: 10, offset: 0 });
let server, api, useWarehouseForm, useWarehouseRequest, useWarehouseActions, AuthContext;

before(async () => {
  globalThis.fetch = async () => { throw new Error("Live transport is prohibited in frontend checks"); };
  server = await createServer({
    root, configFile: false, logLevel: "silent", esbuild: { jsx: "automatic" },
    ssr: { resolve: { externalConditions: ["node", "module-sync"] } },
    define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://example.test") },
    server: { middlewareMode: true, hmr: false, watch: null },
    plugins: [{
      name: "warehouse-hook-unit-fixture",
      resolveId(id) { if (id === "virtual:warehouse-hook-fixture") return "\0" + id; },
      load(id) {
        if (id !== "\0virtual:warehouse-hook-fixture") return;
        return ["useState", "useRef", "useEffect"].map((name) =>
          `import { ${name} as real${name} } from 'react'; export const ${name} = (...args) => globalThis.__warehouseHookFixture ? globalThis.__warehouseHookFixture.${name}(...args) : real${name}(...args);`
        ).join("\n");
      },
      transform(code, id) {
        if (/\/src\/hooks\/useWarehouse(Form|Request|Actions)\.js$/.test(id.replaceAll("\\", "/"))) {
          return code.replace('from "react"', 'from "virtual:warehouse-hook-fixture"');
        }
      },
    }],
  });
  api = await server.ssrLoadModule("/src/api/warehouses.js");
  ({ useWarehouseForm } = await server.ssrLoadModule("/src/hooks/useWarehouseForm.js"));
  ({ useWarehouseRequest } = await server.ssrLoadModule("/src/hooks/useWarehouseRequest.js"));
  ({ useWarehouseActions } = await server.ssrLoadModule("/src/hooks/useWarehouseActions.js"));
  ({ AuthContext } = await server.ssrLoadModule("/src/context/AuthProvider.jsx"));
});
after(async () => { delete globalThis.__warehouseHookFixture; globalThis.fetch = originalFetch; await server?.close(); });

const fixtureFor = (hook, input) => createHookFixture(hook, input, "__warehouseHookFixture");
const formFixture = (input = {}) => fixtureFor(useWarehouseForm, { accessToken: "fixture-token", ...input });
const change = (fixture, name, value) => fixture.value.onChange({ target: { name, value, type: typeof value === "boolean" ? "checkbox" : "text", checked: value } });

function transport({ warehouse = original, failSave, failLoad } = {}) {
  let stored = { ...warehouse };
  const calls = [];
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, "http://example.test");
    calls.push({ url, options });
    if (options.method === "POST" || options.method === "PUT") {
      if (failSave) return failSave();
      stored = { ...stored, ...JSON.parse(options.body) };
      return response(stored, options.method === "POST" ? 201 : 200);
    }
    return failLoad ? failLoad() : response(stored);
  };
  return { calls, get stored() { return stored; } };
}

test("required name and 255-code-point maximum without uniqueness/minimum-length rules or normalization", () => {
  for (const name of ["", " ", "\n\t"]) assert.equal(validateWarehouseForm({ name }).name, t("validation.required"));
  for (const name of ["a", original.name, " انبار ", "الف".slice(0, 1), "😀".repeat(255)]) {
    const form = { name }; assert.deepEqual(validateWarehouseForm(form), {}); assert.equal(form.name, name);
  }
  for (const name of ["a".repeat(256), "😀".repeat(256)]) assert.equal(validateWarehouseForm({ name }).name, t("warehouses.nameConstraint"));
  assert.deepEqual(warehousePayload({ name: " انبار ", id: 99, stock: 100, is_active: false }), { name: " انبار " });
});

test("changed-field payload preserves ID/relationships and omits unchanged false and true flags", () => {
  for (const is_active of [false, true]) {
    const record = { ...original, is_active, stock: [10], history: [20] };
    const form = { ...warehouseFormValues(record), name: "نام جدید", id: 999, stock: [], history: [] };
    assert.deepEqual(warehousePayload(form, record), { name: "نام جدید" });
    assert.deepEqual(warehousePayload({ ...form, is_active: !is_active }, record), { name: "نام جدید", is_active: !is_active });
    assert.equal(record.id, 7); assert.deepEqual(record.stock, [10]); assert.deepEqual(record.history, [20]);
  }
});

test("invalid fields stop persistence before the pending state", async () => {
  let calls = 0;
  const result = await submitWarehouseForm({ form: { name: "" }, lock: { current: false }, persist() { calls++; }, onPending() { calls++; } });
  assert.equal(result.status, "invalid"); assert.equal(result.errors.name, t("validation.required")); assert.equal(calls, 0);
});

test("successful creation uses the existing POST, raw name and Persian success label", async () => {
  const network = transport({ warehouse: { ...original, is_active: true } }); const fixture = formFixture();
  try {
    await fixture.settle(); change(fixture, "name", " انبار تازه "); await fixture.settle();
    const saved = await fixture.value.save(); await fixture.settle();
    assert.equal(saved.id, 7); assert.equal(saved.name, " انبار تازه ");
    assert.equal(network.calls.length, 1);
    const { url, options } = network.calls[0]; assert.equal(url.pathname, "/warehouses"); assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer fixture-token"); assert.deepEqual(JSON.parse(options.body), { name: " انبار تازه " });
    assert.equal(fixture.value.isSubmitting, false); assert.match(t("warehouses.created"), /موفقیت/);
  } finally { fixture.stop(); }
});

test("editing prepopulates and sends only the changed name, preserving the inactive warehouse ID", async () => {
  const network = transport(); const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); assert.deepEqual(fixture.value.form, warehouseFormValues(original));
    change(fixture, "name", "نام ویرایش‌شده"); await fixture.settle();
    const saved = await fixture.value.save(); await fixture.settle();
    const call = network.calls.find((call) => call.options.method === "PUT");
    assert.equal(call.url.pathname, "/warehouses/7"); assert.deepEqual(JSON.parse(call.options.body), { name: "نام ویرایش‌شده" });
    assert.equal(saved.id, 7); assert.equal(saved.is_active, false); assert.equal(fixture.value.original.id, 7);
    assert.equal(fixture.value.original.name, "نام ویرایش‌شده");
  } finally { fixture.stop(); }
});

test("unchanged edits make no PUT or confirmation and report a Persian notice", async () => {
  const network = transport(); const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); assert.equal(await fixture.value.save(() => assert.fail("No confirmation for unchanged status")), null);
    await fixture.settle(); assert.equal(network.calls.length, 1); assert.equal(fixture.value.message, t("warehouses.unchanged")); assert.equal(fixture.value.isNotice, true);
  } finally { fixture.stop(); }
});

test("intentional deactivation confirms before PUT; activation does not require disruptive confirmation", async () => {
  for (const is_active of [true, false]) {
    const network = transport({ warehouse: { ...original, is_active } }); const fixture = formFixture({ id: "7" });
    let confirmations = 0;
    try {
      await fixture.settle(); change(fixture, "is_active", !is_active); await fixture.settle();
      const saved = await fixture.value.save(() => { confirmations++; assert.equal(network.calls.length, 1); return true; });
      await fixture.settle(); assert.equal(saved.is_active, !is_active); assert.equal(confirmations, is_active ? 1 : 0);
      assert.deepEqual(JSON.parse(network.calls[1].options.body), { is_active: !is_active });
    } finally { fixture.stop(); }
  }
  assert.match(t("warehouses.confirmDeactivate"), /گردش موجودی جدید/); assert.match(t("warehouses.confirmDeactivate"), /حذف نمی‌شوند/);
});

test("canceling deactivation sends no mutation, restores status and preserves the unsaved name", async () => {
  const network = transport({ warehouse: { ...original, is_active: true } }); const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); change(fixture, "name", "پیش‌نویس"); change(fixture, "is_active", false); await fixture.settle();
    assert.equal(await fixture.value.save(() => false), null); await fixture.settle();
    assert.equal(network.calls.length, 1); assert.equal(network.stored.name, original.name); assert.equal(network.stored.is_active, true);
    assert.equal(fixture.value.form.name, "پیش‌نویس"); assert.equal(fixture.value.form.is_active, true);
    assert.equal(fixture.value.message, t("warehouses.cancelled")); assert.equal(fixture.value.isSubmitting, false);
  } finally { fixture.stop(); }
});

test("deactivation cannot persist without an explicit confirmation result", async () => {
  let writes = 0;
  const result = await submitWarehouseForm({ form: { name: original.name, is_active: false }, original: { ...original, is_active: true }, lock: { current: false },
    onPending() {}, persist() { writes++; } });
  assert.equal(result.status, "cancelled"); assert.equal(writes, 0);
});

test("synchronous lock prevents rapid repeated save/Enter and edits during pending submission", async () => {
  let resolveSave;
  const network = transport({ failSave: () => new Promise((resolve) => { resolveSave = resolve; }) }); const fixture = formFixture();
  try {
    await fixture.settle(); change(fixture, "name", "پیش‌نویس"); await fixture.settle();
    const pending = fixture.value.save(); assert.equal(await fixture.value.save(), null); await fixture.settle();
    assert.equal(fixture.value.isSubmitting, true); assert.equal(fixture.value.canSubmit, false);
    change(fixture, "name", "تغییر حین ارسال"); await fixture.settle(); assert.equal(fixture.value.form.name, "پیش‌نویس");
    assert.equal(network.calls.length, 1); resolveSave(response({ ...original, name: "پیش‌نویس" }, 201));
    assert.equal((await pending).name, "پیش‌نویس"); await fixture.settle(); assert.equal(fixture.value.isSubmitting, false);
  } finally { fixture.stop(); }
});

test("network failure preserves input, releases the guard and gives Persian uncertain-save feedback", async () => {
  let fail = true;
  transport({ failSave: () => { if (fail) throw new TypeError("Failed to fetch"); return response({ ...original, name: "پیش‌نویس" }, 201); } });
  const fixture = formFixture();
  try {
    await fixture.settle(); change(fixture, "name", "پیش‌نویس"); await fixture.settle();
    assert.equal(await fixture.value.save(), null); await fixture.settle();
    assert.equal(fixture.value.form.name, "پیش‌نویس"); assert.equal(fixture.value.isSubmitting, false);
    assert.match(fixture.value.message, /ارتباط/); assert.match(fixture.value.message, /فهرست انبارها/); assert.doesNotMatch(fixture.value.message, /Failed to fetch/);
    fail = false; assert.equal((await fixture.value.save()).id, 7); await fixture.settle(); assert.equal(fixture.value.message, "");
  } finally { fixture.stop(); }
});

test("backend 422 validation appears next to the name field without exposing raw messages", async () => {
  transport({ failSave: () => response({ detail: [{ loc: ["body", "name"], type: "string_too_long", ctx: { max_length: 255 }, msg: "String should have at most 255 characters" }] }, 422) });
  const fixture = formFixture();
  try {
    await fixture.settle(); change(fixture, "name", "پیش‌نویس"); await fixture.settle(); await fixture.value.save(); await fixture.settle();
    assert.match(fixture.value.errors.name, /۲۵۵/); assert.equal(fixture.value.message, t("warehouses.correctFields"));
    assert.equal(fixture.value.form.name, "پیش‌نویس"); assert.doesNotMatch(fixture.value.errors.name, /String should/);
  } finally { fixture.stop(); }
});

test("backend stock rejection preserves draft status/name and the original warehouse", async () => {
  transport({ warehouse: { ...original, is_active: true }, failSave: () => response({ detail: "Warehouse 7 is not empty and therefore cannot be deactivated." }, 403) });
  const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); change(fixture, "is_active", false); change(fixture, "name", "پیش‌نویس"); await fixture.settle();
    assert.equal(await fixture.value.save(() => true), null); await fixture.settle();
    assert.equal(fixture.value.errors.is_active, t("errors.warehouseStock")); assert.equal(fixture.value.form.is_active, false);
    assert.equal(fixture.value.form.name, "پیش‌نویس"); assert.equal(fixture.value.original.is_active, true); assert.equal(fixture.value.original.id, 7);
  } finally { fixture.stop(); }
});

test("missing warehouse and failed load have Persian feedback and recover with explicit retry", async () => {
  for (const status of [404, 500]) {
    let failed = true;
    transport({ failLoad: () => failed ? response({ detail: status === 404 ? "Warehouse not found." : "Internal server error." }, status) : response(original) });
    const fixture = formFixture({ id: "7" });
    try {
      await fixture.settle(); assert.equal(fixture.value.load.status, status === 404 ? "missing" : "error"); assert.equal(fixture.value.canSubmit, false);
      assert.match(fixture.value.load.error, /[\u0600-\u06ff]/); failed = false; fixture.value.retry(); await fixture.settle();
      assert.equal(fixture.value.load.status, "ready"); assert.equal(fixture.value.original.id, 7);
    } finally { fixture.stop(); }
  }
});

test("malformed successful saves never produce success or replace the edit baseline", async () => {
  for (const invalid of [null, {}, { ...original, id: 8, name: "ویرایش" }, { ...original, name: "ویرایش", is_active: "false" }, original, "invalid-json"]) {
    transport({ failSave: () => invalid === "invalid-json" ? new Response("not JSON", { status: 200 }) : response(invalid) });
    const fixture = formFixture({ id: "7" });
    try {
      await fixture.settle(); change(fixture, "name", "ویرایش"); await fixture.settle();
      assert.equal(await fixture.value.save(), null); await fixture.settle();
      assert.equal(fixture.value.original.name, original.name); assert.equal(fixture.value.form.name, "ویرایش");
      assert.match(fixture.value.message, /معتبر نیست/); assert.match(fixture.value.message, /فهرست انبارها/); assert.equal(fixture.value.isSubmitting, false);
    } finally { fixture.stop(); }
  }
});

test("malformed create responses do not produce a created warehouse", async () => {
  transport({ failSave: () => response({ message: "created" }, 201) }); const fixture = formFixture();
  try {
    await fixture.settle(); change(fixture, "name", "انبار"); await fixture.settle();
    assert.equal(await fixture.value.save(), null); await fixture.settle(); assert.match(fixture.value.message, /معتبر نیست/); assert.equal(fixture.value.form.name, "انبار");
  } finally { fixture.stop(); }
});

test("a wrong-ID read response is rejected rather than prepopulating another warehouse", async () => {
  transport({ warehouse: { ...original, id: 8 } }); const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); assert.equal(fixture.value.load.status, "error"); assert.equal(fixture.value.original, null); assert.equal(fixture.value.form.name, "");
  } finally { fixture.stop(); }
});

test("token refresh preserves an unsaved draft and the outcome of an in-flight edit", async () => {
  let resolveSave;
  const network = transport({ failSave: () => new Promise((resolve) => { resolveSave = resolve; }) }); const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); change(fixture, "name", "پیش‌نویس"); await fixture.settle();
    fixture.update({ accessToken: "refreshed-token" }); await fixture.settle(); assert.equal(fixture.value.form.name, "پیش‌نویس"); assert.equal(network.calls.length, 1);
    const pending = fixture.value.save(); await fixture.settle(); fixture.update({ accessToken: "another-token" }); await fixture.settle();
    resolveSave(response({ ...original, name: "پیش‌نویس" })); assert.equal((await pending).id, 7); await fixture.settle();
    assert.equal(fixture.value.original.name, "پیش‌نویس"); assert.equal(fixture.value.isSubmitting, false);
  } finally { fixture.stop(); }
});

test("switching routes ignores late reads for the previous warehouse", async () => {
  const pending = new Map(); globalThis.fetch = (url) => new Promise((resolve) => pending.set(new URL(url).pathname, resolve));
  const fixture = formFixture({ id: "7" });
  try {
    await fixture.settle(); fixture.update({ id: "8" }); await fixture.settle();
    pending.get("/warehouses/8")(response({ ...original, id: 8, name: "انبار دوم" })); await fixture.settle();
    pending.get("/warehouses/7")(response(original)); await fixture.settle();
    assert.equal(fixture.value.original.id, 8); assert.equal(fixture.value.form.name, "انبار دوم");
  } finally { fixture.stop(); }
});

test("unmounted forms do not update state or report success after a pending save", async () => {
  let resolveSave; transport({ failSave: () => new Promise((resolve) => { resolveSave = resolve; }) }); const fixture = formFixture();
  await fixture.settle(); change(fixture, "name", "انبار"); await fixture.settle();
  const pending = fixture.value.save(); fixture.stop(); resolveSave(response({ ...original, name: "انبار" }));
  assert.equal(await pending, null); assert.deepEqual(fixture.lateUpdates, []);
});

test("navigation retains search/status/page, unknown query values and safe internal return paths", () => {
  const search = "?search=" + encodeURIComponent("انبار & A") + "&is_active=false&offset=30&extra=keep";
  assert.deepEqual(warehouseListContext(search), { searchTerm: "انبار & A", isActive: "false", offset: 30 });
  assert.equal(warehouseReturnTo({ warehouseReturnTo: "/warehouses/list" + search }), "/warehouses/list" + search);
  for (const value of ["https://example.test", "//example.test/warehouses/list", "/warehouses/list-other", "/products/list", "javascript:alert(1)"]) assert.equal(warehouseReturnTo({ warehouseReturnTo: value }), "/warehouses/list");
  assert.equal(warehouseStockReturnTo({ warehouseStockReturnTo: "/stock/warehouse/7?offset=20" }, "7"), "/stock/warehouse/7?offset=20");
  assert.equal(warehouseStockReturnTo({ warehouseStockReturnTo: "/stock/warehouse/8?offset=20" }, "7"), "/stock/warehouse/7");
  const changed = updateWarehouseQuery(search, { search: "new", offset: 0 });
  assert.equal(changed.get("search"), "new"); assert.equal(changed.has("offset"), false); assert.equal(changed.get("is_active"), "false"); assert.equal(changed.get("extra"), "keep");
  assert.deepEqual(warehouseListContext("?offset=-1&is_active=invalid"), { searchTerm: "", isActive: "", offset: 0 });
  assert.equal(warehousePageOffset(20, 20), 10); assert.equal(warehousePageOffset(20, 0), 0); assert.equal(warehousePageOffset(20, 35), 20);
});

test("list reads refresh after successful edits while preserving exact filter/pagination API arguments", async () => {
  let stored = { ...original }; const calls = [];
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input); calls.push({ url, options });
    if (options.method === "PUT") { stored = { ...stored, ...JSON.parse(options.body) }; return response(stored); }
    return response(page([stored], 40));
  };
  const loader = async () => checkedWarehousePage(await api.getAllWarehouses("token", 10, 20, "انبار", "false"));
  const fixture = fixtureFor(({ refreshKey }) => useWarehouseRequest(loader, refreshKey), { refreshKey: "list-first" });
  try {
    await fixture.settle(); assert.equal(fixture.value.data.data[0].name, original.name);
    await api.warehouseUpdate(7, { name: "انبار جدید" }, "token"); fixture.update({ refreshKey: "return-after-edit" }); await fixture.settle();
    assert.equal(fixture.value.data.data[0].name, "انبار جدید");
    const reads = calls.filter((call) => !call.options.method); assert.equal(reads.length, 2);
    for (const { url } of reads) assert.deepEqual(Object.fromEntries(url.searchParams), { limit: "10", offset: "20", search: "انبار", is_active: "false" });
  } finally { fixture.stop(); }
});

test("read retry clears failures and stale requests cannot overwrite current warehouse views", async () => {
  let oldResolve;
  const slow = () => new Promise((resolve) => { oldResolve = resolve; });
  const fixture = fixtureFor(({ loader }) => useWarehouseRequest(loader), { loader: slow });
  try {
    await fixture.settle(); fixture.update({ loader: async () => { throw new LocalizedApiError("Warehouse not found", 404); } }); await fixture.settle();
    assert.equal(fixture.value.status, "missing"); assert.equal(fixture.value.data, null);
    const recovered = async () => [original]; fixture.update({ loader: recovered }); await fixture.settle();
    oldResolve([{ ...original, id: 8 }]); await fixture.settle(); assert.equal(fixture.value.data[0].id, 7);
    fixture.value.retry(); await fixture.settle(); assert.equal(fixture.value.status, "ready");
  } finally { fixture.stop(); }
});

test("bulk actions respect cancelled deactivation, partial summaries and refresh only after confirmed success", async () => {
  let refreshes = 0; const calls = [];
  globalThis.fetch = async (input, options) => { calls.push({ input, options }); return response({ message: "1 warehouses updated", skipped: 1 }); };
  const fixture = fixtureFor(useWarehouseActions, { accessToken: "token", onChanged: () => { refreshes++; } });
  try {
    await fixture.settle(); assert.equal(await fixture.value.bulk([7, 8], false, () => false), null); await fixture.settle();
    assert.equal(calls.length, 0); assert.equal(refreshes, 0);
    const result = await fixture.value.bulk([7, 8], false, () => true); await fixture.settle();
    assert.equal(result.skipped, 1); assert.equal(refreshes, 1); assert.deepEqual(JSON.parse(calls[0].options.body), { ids: [7, 8], is_active: false });
    assert.equal(new URL(calls[0].input).pathname, "/warehouses/bulk-active");
  } finally { fixture.stop(); }
});

test("bulk synchronous guard prevents repeated status requests and rejects malformed summaries", async () => {
  let resolveSave, refreshes = 0, calls = 0;
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { resolveSave = resolve; }); };
  const fixture = fixtureFor(useWarehouseActions, { accessToken: "token", onChanged: () => { refreshes++; } });
  try {
    await fixture.settle(); const pending = fixture.value.bulk([7], true); assert.equal(await fixture.value.bulk([7], true), null); await fixture.settle();
    assert.equal(calls, 1); assert.equal(fixture.value.pending, true);
    resolveSave(response({ message: "all succeeded", skipped: 0 })); assert.equal(await pending, null); await fixture.settle();
    assert.equal(refreshes, 0); assert.match(fixture.value.error, /معتبر نیست/); assert.equal(fixture.value.pending, false);
  } finally { fixture.stop(); }
});

test("delete keeps existing backend restrictions, checks response IDs, and refreshes only after success", async () => {
  let refreshes = 0, calls = 0, fail = true;
  globalThis.fetch = async () => { calls++; return fail ? response({ detail: "Cannot delete this warehouse because it has registered movements." }, 409) : response(original); };
  const fixture = fixtureFor(useWarehouseActions, { accessToken: "token", onChanged: () => { refreshes++; } });
  try {
    await fixture.settle(); assert.equal(await fixture.value.remove(7, () => false), null); assert.equal(calls, 0);
    assert.equal(await fixture.value.remove(7, () => true), null); await fixture.settle(); assert.match(fixture.value.error, /گردش/); assert.equal(refreshes, 0);
    fail = false; assert.equal(await fixture.value.remove(7, () => true), true); await fixture.settle(); assert.equal(refreshes, 1);
  } finally { fixture.stop(); }
});

test("response checks preserve raw values and reject unexpected IDs, page data and counts", () => {
  assert.equal(checkedWarehouse(original, "7"), original);
  for (const invalid of [{ ...original, id: "7" }, { ...original, id: 8 }, { ...original, name: null }]) assert.throws(() => checkedWarehouse(invalid, "7"));
  for (const invalid of [{ data: null, total: 0 }, { data: [null], total: 1 }, { data: [], total: -1 }]) assert.throws(() => checkedWarehousePage(invalid));
  assert.throws(() => checkedWarehouseBulk({ message: "2 warehouses updated", skipped: 1 }, 2));
  assert.match(warehouseErrorFeedback(new SyntaxError("raw parser error")).message, /معتبر نیست/);
});

function render(element, role = "admin", entry = "/warehouses/new") {
  delete globalThis.__warehouseHookFixture;
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [entry] },
    React.createElement(AuthContext.Provider, { value: { user: { role, name: "Fixture User" }, accessToken: null, logout() {}, isLoggingOut: false } }, element)));
}

test("real React SSR renders Persian warehouse fields and admin-only table actions", async () => {
  const { default: Table } = await server.ssrLoadModule("/src/components/WarehouseListTable.jsx");
  const table = React.createElement(Table, { warehouses: [original], selected: [], toggleAll() {}, toggleSelected() {}, handleDelete() {} });
  assert.match(render(table), /ویرایش/); assert.match(render(table), /حذف/); assert.match(render(table), /dir="ltr">7/);
  const regular = render(table, "user"); assert.doesNotMatch(regular, /ویرایش|حذف/); assert.match(regular, /disabled=""/);
  const { default: NewWarehouse } = await server.ssrLoadModule("/src/pages/NewWarehouse.jsx");
  const form = render(React.createElement(NewWarehouse));
  const name = form.match(/<input[^>]*id="name"[^>]*>/)[0]; assert.match(name, /name="name"/); assert.match(name, /maxLength="255"/); assert.match(name, /required=""/);
  assert.match(form, /noValidate=""/); assert.match(form, /افزودن انبار/); assert.doesNotMatch(form, /Create Warehouse|Warehouse name/);
});

test("real React SSR renders Persian missing/retry states and breadcrumb links retain list queries", async () => {
  const { default: Feedback } = await server.ssrLoadModule("/src/components/WarehouseRequestFeedback.jsx");
  const markup = render(React.createElement(Feedback, { request: { status: "missing", error: t("errors.warehouseNotFound"), retry() {} } }));
  assert.match(markup, /role="alert"/); assert.match(markup, /تلاش دوباره/); assert.match(markup, /انبار/);
  const { default: Breadcrumb } = await server.ssrLoadModule("/src/components/Breadcrumb.jsx");
  const breadcrumbs = render(React.createElement(Breadcrumb, { navigationState: { warehouseReturnTo: "/warehouses/list?offset=20" }, linkTargets: { "/warehouses/list": "/warehouses/list?offset=20" } }), "admin", "/stock/warehouse/7");
  assert.match(breadcrumbs, /href="\/warehouses\/list\?offset=20"/);
});
