import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { direction, language, locale, t } from "../src/i18n/index.js";
import { translateNotification } from "../src/i18n/notifications.js";
import { formatDate, formatDateTime, formatNumber } from "../src/utils/format.js";

let server;
let Navbar;
let Breadcrumb;
let Pagination;
let AuthContext;

async function loadShell() {
  if (Navbar && Breadcrumb && Pagination && AuthContext && MemoryRouter) return;
  // Existing Vite/React tooling compiles the real components; no new test framework.
  // Server rendering does not run effects, open sockets, call APIs or access a database.
  server ??= await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    logLevel: "silent",
    esbuild: { jsx: "automatic" },
    // Match Node's ESM entry for React Router's conditional package exports.
    ssr: { resolve: { externalConditions: ["node", "module-sync"] } },
    define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://example.test") },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  ({ default: Navbar } = await server.ssrLoadModule("/src/components/Navbar.jsx"));
  ({ default: Breadcrumb } = await server.ssrLoadModule("/src/components/Breadcrumb.jsx"));
  ({ default: Pagination } = await server.ssrLoadModule("/src/components/Pagination.jsx"));
  ({ AuthContext } = await server.ssrLoadModule("/src/context/AuthProvider.jsx"));
}

after(async () => {
  await server?.close();
});

function renderShell(component, { role = "user", path = "/dashboard", name = "Test User" } = {}) {
  return renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(AuthContext.Provider, {
        value: { user: { name, role }, accessToken: null, logout() {} },
      }, component)
    )
  );
}

test("application locale is Persian and RTL", () => {
  assert.equal(locale, "fa-IR");
  assert.equal(language, "fa");
  assert.equal(direction, "rtl");
});

test("translation interpolation preserves falsy values and literal user text", () => {
  assert.equal(t("pagination.page", { current: 0, total: 5 }), "صفحه 0 از 5");
  assert.equal(
    t("navigation.toggleSubmenu", { name: "<User> $& {name}" }),
    "باز یا بسته کردن زیرمنوی <User> $& {name}"
  );
  assert.equal(t("pagination.page"), "صفحه {current} از {total}");
});

test("unknown keys and prototype properties cannot resolve to translations", () => {
  assert.equal(t("pages.future.title"), "pages.future.title");
  assert.equal(t("common"), "common");
  assert.equal(t("__proto__.toString"), "__proto__.toString");
});

test("number formatting changes presentation without changing numeric payloads", () => {
  const data = { quantity: 1234.5, offset: 0 };
  assert.equal(formatNumber(data.quantity), "۱٬۲۳۴٫۵");
  assert.equal(formatNumber(data.offset), "۰");
  assert.equal(formatNumber(1234n, { useGrouping: false }), "۱۲۳۴");
  assert.equal(formatNumber(-12).includes("۱۲"), true);
  assert.equal(JSON.stringify(data), '{"quantity":1234.5,"offset":0}');
});

test("technical numeric strings and invalid numbers are not silently converted", () => {
  for (const value of ["00123", "۱۲۳", null, undefined, NaN, Infinity]) {
    assert.equal(formatNumber(value), "—");
  }
});

test("date-only values use the Persian calendar without a time-zone day shift", () => {
  const raw = "2024-03-20";
  assert.equal(formatDate(raw), "۱۴۰۳/۰۱/۰۱");
  assert.equal(formatDate(raw, { timeZone: "Pacific/Honolulu" }), "۱۴۰۳/۰۱/۰۱");
  assert.equal(formatDate(raw, { timeZone: "Pacific/Kiritimati" }), "۱۴۰۳/۰۱/۰۱");
  assert.equal(raw, "2024-03-20");
});

test("timestamp source offsets survive display at a calendar boundary", () => {
  const raw = "2024-03-20T00:30:00+03:30";
  assert.equal(formatDate(raw), "۱۴۰۳/۰۱/۰۱");
  assert.notEqual(formatDate(raw, { timeZone: "UTC" }), formatDate(raw));
  assert.match(formatDateTime(raw, { hourCycle: "h23" }), /۰۰:۳۰/);
  assert.equal(raw, "2024-03-20T00:30:00+03:30");
});

test("Date objects and epoch values stay unchanged and allow an explicit display zone", () => {
  const original = new Date("2024-03-19T22:00:00Z");
  const epoch = original.getTime();
  assert.equal(formatDate(original), formatDate(epoch));
  assert.equal(formatDate(original, { timeZone: "Asia/Tehran" }), "۱۴۰۳/۰۱/۰۱");
  assert.equal(original.getTime(), epoch);
  assert.equal(original.toISOString(), "2024-03-19T22:00:00.000Z");
});

test("invalid dates and timestamps with no zone do not guess or roll over", () => {
  for (const value of [
    "2024-02-30", "2023-02-29", "2024-02-30T12:00:00Z",
    "2024-03-20T00:30:00", "not a date", "", null, undefined, new Date(NaN),
  ]) {
    assert.equal(formatDate(value), "—");
  }
  assert.notEqual(formatDate("2024-02-29"), "—");
});

test("existing notification payloads are translated only at display time", () => {
  const incoming = "New stock movement recorded: 123 (incoming)";
  assert.equal(
    translateNotification(incoming),
    "گردش موجودی جدید ثبت شد: \u2066123\u2069 (ورود کالا)"
  );
  assert.match(translateNotification("New stock movement recorded: 9 (outgoing)"), /خروج/);
  assert.equal(incoming, "New stock movement recorded: 123 (incoming)");
  assert.equal(translateNotification("A future notification"), t("notifications.new"));
});

test("main navigation renders Persian labels and retains administrator visibility", async () => {
  await loadShell();
  const user = renderShell(React.createElement(Navbar));
  const admin = renderShell(React.createElement(Navbar), { role: "admin" });
  assert.match(user, /aria-label="ناوبری اصلی"/);
  for (const label of ["داشبورد", "محصولات", "گردش موجودی", "انبارها", "نمایش اعلان‌ها"]) {
    assert.equal(user.includes(label), true);
  }
  assert.doesNotMatch(user, /href="\/users"/);
  assert.match(admin, /href="\/users"/);
  assert.doesNotMatch(user, />Dashboard<|>Products<|>Warehouses<|View notifications/);
});

test("mixed-direction user names remain isolated and escaped", async () => {
  await loadShell();
  const markup = renderShell(React.createElement(Navbar), { name: "<Admin>" });
  assert.match(markup, /<bdi>&lt;Admin&gt;<\/bdi>/);
});

test("breadcrumbs resolve existing static and parameterized routes in Persian", async () => {
  await loadShell();
  const routes = [
    ["/dashboard", "داشبورد"],
    ["/products/list", "فهرست محصولات"],
    ["/products/new", "افزودن محصول"],
    ["/products/42/edit", "ویرایش محصول"],
    ["/products/42/stock", "موجودی محصول"],
    ["/products/42/history", "تاریخچه محصول"],
    ["/expiration", "محصولات نزدیک به انقضا"],
    ["/categories", "مدیریت دسته‌بندی‌ها"],
    ["/warehouses/list", "فهرست انبارها"],
    ["/warehouses/new", "افزودن انبار"],
    ["/warehouses/7/edit", "ویرایش انبار"],
    ["/stock/warehouse/7", "موجودی انبار"],
    ["/stock/warehouse/7/product/42", "موجودی محصول در انبار"],
    ["/stock/warehouse/7/history", "تاریخچه موجودی انبار"],
    ["/stock/warehouse/7/products/42/history", "تاریخچه محصول در انبار"],
    ["/stock-movements/new", "ثبت گردش موجودی"],
    ["/stock-movements/12", "جزئیات گردش موجودی"],
    ["/users/5/edit", "ویرایش کاربر"],
    ["/profile", "پروفایل کاربر"],
  ];
  for (const [path, label] of routes) {
    const markup = renderShell(React.createElement(Breadcrumb), { path });
    assert.match(markup, /aria-label="مسیر صفحه"/);
    assert.equal(markup.includes(`<span aria-current="page">${label}</span>`), true, path);
    assert.doesNotMatch(markup, /aria-label="breadcrumb"/);
  }
});

test("pagination renders Persian counts while retaining numeric offsets and controls", async () => {
  await loadShell();
  const markup = renderShell(React.createElement(Pagination, {
    total: 25, limit: 10, offset: 10, onPageChange() {},
  }));
  assert.match(markup, /صفحه ۲ از ۳/);
  assert.match(markup, /نمایش ۱۱ تا ۲۰ از ۲۵ نتیجه/);
  assert.match(markup, /aria-label="صفحه‌بندی"/);
  assert.match(markup, /قبلی/);
  assert.match(markup, /بعدی/);

  const empty = renderShell(React.createElement(Pagination, {
    total: 0, limit: 10, offset: 0, onPageChange() {},
  }));
  assert.match(empty, /نتیجه‌ای برای نمایش وجود ندارد/);
  assert.equal((empty.match(/disabled=""/g) || []).length, 2);
});
