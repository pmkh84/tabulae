import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
let server, ProductList;

before(async () => {
  globalThis.document = { title: "" };
  server = await createServer({
    root, configFile: false, logLevel: "silent", esbuild: { jsx: "automatic" },
    ssr: { resolve: { externalConditions: ["node", "module-sync"] } },
    define: { "import.meta.env.VITE_API_URL": JSON.stringify("http://example.test") },
    server: { middlewareMode: true, hmr: false, watch: null },
    plugins: [{
      name: "product-list-debounce-fixture",
      resolveId(id) { if (id.startsWith("virtual:product-list-")) return "\0" + id; },
      load(id) {
        if (id === "\0virtual:product-list-react") return ["useState", "useRef", "useEffect", "useCallback"].map((name) =>
          `export const ${name} = (...args) => globalThis.__productListFixture.${name}(...args);`).join("\n");
        if (id === "\0virtual:product-list-router") return ["useLocation", "useNavigate", "useNavigationType", "useSearchParams"].map((name) =>
          `export const ${name} = (...args) => globalThis.__productListFixture.${name}(...args);`).join("\n");
        if (id === "\0virtual:product-list-auth") return "export const useAuth = () => globalThis.__productListFixture.auth;";
        if (id === "\0virtual:product-list-categories") return "export const useProductCategories = () => globalThis.__productListFixture.categories;";
        if (id === "\0virtual:product-list-api") return "export const getProducts = (...args) => globalThis.__productListFixture.getProducts(...args); export const productBulkStatus = () => {};";
        if (id.startsWith("\0virtual:product-list-component-")) {
          const name = id.slice("\0virtual:product-list-component-".length);
          return `export default function ${name}() {}`;
        }
      },
      transform(code, id) {
        if (!/\/src\/pages\/ProductList\.jsx$/.test(id.replaceAll("\\", "/"))) return;
        return code
          .replace('from "react"', 'from "virtual:product-list-react"')
          .replace('from "react-router-dom"', 'from "virtual:product-list-router"')
          .replace('from "../context/useAuth"', 'from "virtual:product-list-auth"')
          .replace('from "../hooks/useProductCategories.js"', 'from "virtual:product-list-categories"')
          .replace('from "../api/products"', 'from "virtual:product-list-api"')
          .replace(/from "\.\.\/components\/([A-Za-z]+)"/g, 'from "virtual:product-list-component-$1"')
          .replaceAll("setTimeout(", "globalThis.__productListFixture.schedule(")
          .replaceAll("clearTimeout(", "globalThis.__productListFixture.cancel(");
      },
    }],
  });
  ({ default: ProductList } = await server.ssrLoadModule("/src/pages/ProductList.jsx"));
});

after(async () => {
  delete globalThis.__productListFixture;
  delete globalThis.document;
  await server?.close();
});

function createFixture(initialSearch = "") {
  const slots = [], effects = [], requests = [], timers = new Map();
  let cursor = 0, dirty = true, tree, nextKey = 0, nextTimer = 0, now = 0;
  const router = {
    params: new URLSearchParams(initialSearch), type: "POP",
    location: { pathname: "/products/list", search: initialSearch, key: "0" },
  };
  const same = (left, right) => left?.length === right?.length && left.every((value, index) => Object.is(value, right[index]));
  const fixture = {
    auth: { accessToken: "test-token", user: { role: "user" } },
    categories: { status: "ready", data: [{ id: 1, name: "Phones" }] },
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (value) => {
        slots[index].value = typeof value === "function" ? value(slots[index].value) : value;
        dirty = true;
      }];
    },
    useRef(value) { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
    useEffect(effect, deps) {
      const index = cursor++, old = slots[index];
      if (!old || !same(old.deps, deps)) {
        slots[index] = { deps, cleanup: old?.cleanup };
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
    useCallback(callback, deps) {
      const index = cursor++, old = slots[index];
      if (old && same(old.deps, deps)) return old.callback;
      slots[index] = { callback, deps };
      return callback;
    },
    useLocation: () => router.location,
    useNavigate: () => () => {},
    useNavigationType: () => router.type,
    useSearchParams() {
      if (router.setterParams !== router.params) {
        const captured = router.params;
        router.setterParams = captured;
        router.setter = (next, options) => {
          assert.equal(options.replace, true);
          router.params = new URLSearchParams(typeof next === "function" ? next(captured) : next);
          router.type = "REPLACE";
          router.location = { ...router.location, search: `?${router.params}`, key: String(++nextKey) };
          dirty = true;
        };
      }
      return [router.params, router.setter];
    },
    getProducts(args) {
      return new Promise((resolve) => requests.push({ args, resolve }));
    },
    schedule(callback, delay) {
      assert.equal(delay, 400);
      const id = ++nextTimer;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    cancel(id) { timers.delete(id); },
  };
  function render() {
    globalThis.__productListFixture = fixture;
    cursor = 0; dirty = false;
    tree = ProductList();
    while (effects.length) effects.shift()();
  }
  render();
  return {
    requests,
    get url() { return router.params; },
    get pendingTimers() { return timers.size; },
    get(type) {
      const found = [];
      function visit(node) {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node || typeof node !== "object") return;
        if (node.type?.name === type) found.push(node.props);
        visit(node.props?.children);
      }
      visit(tree);
      return found;
    },
    async settle() {
      for (let index = 0; index < 30; index++) {
        if (dirty) render();
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty) return;
      }
      assert.fail("ProductList fixture did not settle");
    },
    advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
    },
    pop(search) {
      router.params = new URLSearchParams(search);
      router.type = "POP";
      router.location = { ...router.location, search, key: String(++nextKey) };
      dirty = true;
    },
    resolve(index, data = [], total = data.length) { requests[index].resolve({ data, total }); },
    stop() { slots.forEach((slot) => slot?.cleanup?.()); delete globalThis.__productListFixture; },
  };
}

test("typing debounces one search and keeps the input responsive", async () => {
  const page = createFixture();
  try {
    await page.settle();
    page.resolve(0); await page.settle();
    for (const value of ["S", "Sa", "Sam", "Sams", "Samsu", "Samsun", "Samsung"]) {
      page.get("SearchInput")[0].onChange({ target: { value } });
      await page.settle();
      assert.equal(page.get("SearchInput")[0].value, value);
      assert.equal(page.requests.length, 1);
      if (value !== "Samsung") { page.advance(100); await page.settle(); }
    }
    assert.equal(page.pendingTimers, 1);
    assert.equal(page.get("Pagination").length, 0);
    page.advance(399); await page.settle();
    assert.equal(page.requests.length, 1);
    page.advance(1); await page.settle();
    assert.equal(page.requests.length, 2);
    assert.equal(page.requests[1].args.searchTerm, "Samsung");
    assert.equal(page.url.get("search"), "Samsung");
  } finally { page.stop(); }
});

test("pending search retains immediate category and status changes, and clearing is immediate", async () => {
  const page = createFixture("?search=old&offset=20");
  try {
    await page.settle();
    page.resolve(0); await page.settle();
    page.get("SearchInput")[0].onChange({ target: { value: "new" } });
    await page.settle();
    page.get("SelectFilter")[0].onChange({ target: { value: "1" } });
    page.get("SelectFilter")[1].onChange({ target: { value: "false" } });
    await page.settle();
    assert.equal(page.get("SearchInput")[0].value, "new");
    assert.equal(page.requests.at(-1).args.searchTerm, "old");
    assert.equal(page.requests.at(-1).args.category_id, "1");
    assert.equal(page.requests.at(-1).args.is_active, "false");
    page.advance(400); await page.settle();
    assert.equal(page.requests.at(-1).args.searchTerm, "new");
    assert.equal(page.url.get("category_id"), "1");
    assert.equal(page.url.get("is_active"), "false");
    assert.equal(page.url.has("offset"), false);
    page.get("SearchInput")[0].onChange({ target: { value: "" } });
    await page.settle();
    assert.equal(page.pendingTimers, 0);
    assert.equal(page.requests.at(-1).args.searchTerm, "");
    assert.equal(page.url.has("search"), false);
  } finally { page.stop(); }
});

test("Back/Forward cancels pending search and stale responses cannot replace newer results", async () => {
  const page = createFixture("?search=first");
  try {
    await page.settle();
    page.get("SearchInput")[0].onChange({ target: { value: "typed" } });
    await page.settle();
    page.pop("?search=second"); await page.settle();
    assert.equal(page.get("SearchInput")[0].value, "second");
    assert.equal(page.pendingTimers, 0);
    page.advance(400); await page.settle();
    assert.equal(page.url.get("search"), "second");
    assert.equal(page.requests.length, 2);
    page.resolve(1, [{ id: 2 }]); await page.settle();
    assert.equal(page.get("ProductListTable")[0].products[0].id, 2);
    page.resolve(0, [{ id: 1 }]); await page.settle();
    assert.equal(page.get("ProductListTable")[0].products[0].id, 2);
    assert.equal(page.get("Pagination").length, 1);
    page.get("SearchInput")[0].onChange({ target: { value: "another" } });
    await page.settle();
    assert.equal(page.get("ProductListTable").length, 0);
    page.pop("?search=second&category_id=1"); await page.settle();
    assert.equal(page.get("SearchInput")[0].value, "second");
    assert.equal(page.pendingTimers, 0);
  } finally { page.stop(); }
});

test("pagination remains immediate and a committed search resets its offset", async () => {
  const page = createFixture("?search=old");
  try {
    await page.settle();
    page.resolve(0, [{ id: 1 }], 25); await page.settle();
    page.get("Pagination")[0].onPageChange(10);
    await page.settle();
    assert.equal(page.requests[1].args.offset, 10);
    assert.equal(page.url.get("offset"), "10");
    page.resolve(1, [{ id: 2 }], 25); await page.settle();
    page.get("SearchInput")[0].onChange({ target: { value: "new" } });
    await page.settle();
    page.advance(400); await page.settle();
    assert.equal(page.requests[2].args.offset, 0);
    assert.equal(page.url.has("offset"), false);
    page.resolve(2, [{ id: 3 }], 1); await page.settle();
    assert.equal(page.get("ProductListTable")[0].products[0].id, 3);
    assert.equal(page.get("Pagination").length, 1);
  } finally { page.stop(); }
});

test("unmount cancels a pending search timer", async () => {
  const page = createFixture("?search=old");
  await page.settle();
  page.get("SearchInput")[0].onChange({ target: { value: "new" } });
  await page.settle();
  assert.equal(page.pendingTimers, 1);
  page.stop();
  assert.equal(page.pendingTimers, 0);
  page.advance(400);
  assert.equal(page.url.get("search"), "old");
});

test("an older response cannot end loading for a newer request", async () => {
  const page = createFixture("?search=first");
  try {
    await page.settle();
    page.pop("?search=second"); await page.settle();
    page.resolve(0, [{ id: 1 }]); await page.settle();
    assert.equal(page.get("ProductListTable").length, 0);
    page.resolve(1, [{ id: 2 }]); await page.settle();
    assert.equal(page.get("ProductListTable")[0].products[0].id, 2);
  } finally { page.stop(); }
});
