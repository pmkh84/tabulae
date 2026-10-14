# Persian localization

The application language is `fa-IR`, with HTML language `fa` and direction `rtl`.
Stage 1A established the shared shell and formatting foundation. Stage 1B integrates
that foundation across all 29 existing pages, forms, tables, charts, errors,
notifications, and CSV exports. There are no new dependencies or backend changes.
The full route audit, file inventory, verification results, exceptions, and Persian
manual checklist are in [the Stage 1B report](STAGE1B_LOCALIZATION.md).
Product and warehouse business-workflow improvements remain outside this work.

## Translation resources

`frontend/src/i18n/fa.js` holds nested translation resources. Import `t` from
`frontend/src/i18n/index.js` to resolve a dot-separated key:

```jsx
import { t } from "../i18n/index.js";

<button>{t("navigation.createProduct")}</button>
```

Namespaces cover `common`, `navigation`, `breadcrumbs`, `notifications`, `pagination`,
`auth`, `users`, `products`, `warehouses`, `stock`, `stockMovements`, `dashboard`,
`charts`, `validation`, `errors`, `select`, and `exports`. Reuse common terminology;
do not translate route paths, roles, API field names, chart data keys, or stored values.

To add a translation:

1. Add a descriptive English key and Persian value to the appropriate namespace in `fa.js`.
2. Replace the presentation string with `t("namespace.key")`.
3. Supply interpolation parameters as plain values. Format display numbers explicitly.
4. Run `npm.cmd run test:localization`. Extend the relevant behavioral check in
   `frontend/tests/localization.test.mjs` or `application-localization.test.mjs`.

Interpolation uses `{name}` placeholders:

```js
t("navigation.toggleSubmenu", { name: t("navigation.products") });
```

Missing keys return the key itself; missing parameters leave their placeholder visible.
These fallbacks make omissions discoverable. Translation results are plain text and must
be rendered normally through React, never through `dangerouslySetInnerHTML`.

## RTL and technical values

Both `frontend/index.html` and the React application wrapper set `lang="fa"` and
`dir="rtl"`. Menus inherit that direction. Shell spacing/positioning uses Tailwind
logical utilities such as `ms`, `me`, `ps`, `pe`, `start`, `end`, and `rounded-s/e`.
Breadcrumbs retain their route-matching logic and use semantic navigation markup
so their accessible label can be Persian; the previous third-party wrapper hardcodes
an English accessible label on its outer navigation element. Its dependency is retained.

Global CSS isolates email, URL, telephone, numeric, date, and SKU inputs in LTR.
Their values and validation rules do not change. For displayed values use:

```jsx
<bdi dir="ltr" className="technical-value">{product.sku}</bdi>
<bdi>{user.name}</bdi>
```

Page tables, forms, controls, and help overlays use logical spacing and alignment.
React Select explicitly receives RTL and Persian messages, including its body portal.
Recharts keeps its coordinate system LTR while legends/tooltips use RTL and ticks,
series labels, and pie quantities receive localized display formatters.
Notification payloads and local storage remain unchanged. Known stock-movement
messages are translated during rendering; unknown messages display a Persian
"new notification" label. Add a reviewed mapping for any future notification type.

## Numbers and dates

Import `formatNumber`, `formatDate`, and `formatDateTime` from `src/utils/format.js`.
These functions return strings for presentation; never put those strings in calculations,
input values, URL parameters, or API payloads.

```js
formatNumber(1234.5); // Persian digits and separators
formatNumber(quantity, { maximumFractionDigits: 2 }); // Display rounding only
formatDate("2024-03-20"); // ۱۴۰۳/۰۱/۰۱
formatDateTime("2024-03-20T00:30:00+03:30"); // Preserves the supplied +03:30 offset
formatDate(timestamp, { timeZone: "Asia/Tehran" }); // Explicit display-zone choice
```

- Number inputs must be numbers or BigInts. Numeric strings are deliberately not coerced,
  so identifiers such as `"00123"` cannot accidentally lose their leading zeros.
- Dates default to the Persian calendar. Gregorian `YYYY-MM-DD` values are calendar
  dates, rendered in UTC solely to prevent a time-zone day shift. A supplied `timeZone`
  does not shift these date-only values.
- ISO timestamps require `Z` or an explicit `±HH:MM` offset. The original offset is
  retained by default; callers may explicitly choose an IANA display zone.
- Date objects and epoch milliseconds contain no source-zone information; UTC is their
  default display zone. Callers should supply the intended zone when needed.
- Naive timestamps, impossible calendar dates, missing values, and invalid numbers
  render as `—`. No original Date object, number, timestamp, or offset is mutated.
- Page, table, export, and chart date displays use these functions. API monthly
  aggregation buckets remain Gregorian, displayed through `formatGregorianMonth`
  with Persian month names and digits; relabeling those buckets as Jalali would
  misrepresent their aggregation period. The native date picker depends on browser support.

## Validation, API errors, and exports

`src/i18n/errors.js` is a presentation adapter around the existing fetch calls.
`apiFetch` forwards the original request arguments and returns successful responses
unchanged. Failed requests produce `LocalizedApiError`, with Persian messages,
HTTP status, localized field errors, original field paths, non-enumerable raw
`detail`, and the original network `cause` where applicable. Unknown backend messages
use a safe Persian fallback. Extend `backendErrorMessage` for new known errors;
never translate request or response data in transit.

`nativeValidation.js` handles invalid controls at the application root and clears
only custom messages it owns on input. Required/email/number/length/pattern feedback
is Persian; existing constraints and raw input values stay unchanged. React Select
messages and live announcements are centralized in `select.js`.

CSV headers and human-readable status/role/type/date cells are Persian, with a UTF-8
BOM. Numeric cells, identifiers, names, emails, filenames, queries, and export limits
retain their original values. Consumers expecting English headers or Gregorian date
text must account for this deliberate export presentation change.

## Bundled font and license

The unmodified variable WOFF2 font is Vazirmatn **v33.003**, 111,152 bytes, covering
weights 100–900. It is served locally through `frontend/public/fonts/vazirmatn/`;
no external font request is made at runtime. Tailwind's `font-sans` and the global
font stack use Vazirmatn with Tahoma/Arial fallbacks and `font-display: swap`.

- Official font: https://github.com/rastikerdar/vazirmatn/blob/v33.003/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2
- Verified license: https://github.com/rastikerdar/vazirmatn/blob/v33.003/OFL.txt
- License: SIL Open Font License 1.1; bundling is allowed with the copyright notice and license.
- Full original license: `frontend/public/fonts/vazirmatn/OFL.txt`, also included in builds.
- Font SHA-256: `4e3fa217d38fdafc1fea4414ceb58ca5e662cf0ab5fa735a8c8c20e8b42cad92`
- License SHA-256: `17e355067c8284f47743a1ee3b1ef7ff684ff0601eda357f9353b10b3016ab31`

## Checks and baseline

From `frontend`:

```powershell
npm.cmd run test:localization
npm.cmd run lint
npm.cmd run build
```

The focused tests use Node's built-in test runner and the existing Vite/React tooling.
Server rendering uses a fixture auth context with no access token and executes no
browser effects. Network requests in tests are blocked or mocked; no live API or
database is reached. Checks cover every route's initial rendering, populated shared
tables, errors, constraints, raw mocked API contracts, and CSV output, as well as
the shell/formatting checks. Live interactions and responsive layouts require manual
browser verification; no new test framework has been installed.

Pre-existing Stage 0 findings:

- Frontend lint: one unused-variable error in `CreateMovement.jsx` and nine warnings.
- Frontend production build: successful, with a large-bundle warning.
- Backend: 139 relevant tests collected; execution blocked by the unresolved dedicated
  `db_test` hostname. Docker was unavailable and host port 5434 timed out.
- Backend fixtures clear tables and do not install the stock trigger. These fixtures
  must never run against development/production or an unverified database.

Stage 1A does not run or change backend tests, database configuration, schemas,
authentication, or authorization. It does not correct unrelated baseline failures.

Historical Stage 1A verification results (the Stage 1B report records current results):

- `npm.cmd run test:localization`: 14 checks passed. Initial SSR module-resolution
  failures were corrected in the test configuration; application routing was unchanged.
- `npm.cmd run lint`: the same one existing error and nine warnings, with no new findings.
- `.\node_modules\.bin\eslint.cmd src/App.jsx src/components/Navbar.jsx src/components/Breadcrumb.jsx src/components/Pagination.jsx src/i18n src/utils/format.js --max-warnings 0`:
  passed with no errors or warnings in changed application code.
- `npm.cmd run build -- --outDir <temporary-directory>`: successful; the existing
  large-bundle warning remains. The original font and license are included in output.
- `git diff --check`: passed for tracked changes. New source files also pass the
  whitespace audit. The original vendored `OFL.txt` has one upstream trailing space
  on line 21, retained to keep the license byte-for-byte identical. The complete diff
  was reviewed.
- Browser automation exposed no available browsers; opening the in-app browser returned
  `Browser is not available: iab`. Interactive menus, focus behavior, visual font rendering,
  and responsive desktop/mobile layouts remain unverified in a live browser.

## بررسی دستی

1. برنامه را باز کنید و فارسی بودن منوی اصلی، مسیر صفحه و دکمه‌های صفحه‌بندی را بررسی کنید.
2. زیرمنوها و منوی کاربر را با ماوس و کلیدهای Tab، Enter و جهت‌نما باز و بسته کنید.
3. در عرض موبایل، منوی اصلی و زیرمنوها را بررسی کنید؛ گزینه‌ها نباید روی هم قرار بگیرند.
4. با حساب مدیر و کاربر عادی، نمایش گزینه‌های مدیریتی را مقایسه کنید.
5. جهت ایمیل و کد محصول، خوانایی فونت و نمایش اعلان‌های گردش موجودی را بررسی کنید.
6. شمارنده‌های صفحه‌بندی باید فارسی باشند؛ تغییر صفحه و مسیرها باید مانند قبل کار کنند.

این فهرست مربوط به بررسی پوسته در مرحله ۱A است؛ بررسی کامل صفحات و فرم‌ها در گزارش مرحله ۱B آمده است.
