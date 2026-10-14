# Stage 1B — application-wide Persian localization report

All 29 existing route pages and their shared presentation surfaces have been localized and source-audited. All 29 initial page states render in automated server-rendering checks. Populated shared tables, errors, raw request contracts, and CSV content have focused behavioral checks. Live guest/user/admin interactions, chart rendering, and responsive layouts still require the manual verification below: browser automation reports no available browsers.

Only Stage 1B was implemented. Uncommitted Stage 1A work was retained and extended. No commit, backend edit, database access, dependency installation, API/schema change, authorization change, or product/warehouse workflow redesign was performed. Stage 1C has not started.

## Route audit and localization status

Every row is source-audited, localized, and covered by the 29-page initial-render check. “Localized” includes document title, reachable static UI, labels, placeholders, applicable loading/empty/error feedback, confirmations, and chart/table/form surfaces. SSR does not exercise browser effects, submit forms, load live data, or prove visual layout.

Page files are under `frontend/src/pages/`. This table also records why each of the 29 page files changed.

| Route | Page file | Access | Localized surfaces / status |
|---|---|---|---|
| `/login` | `Login.jsx` | Guest | Login form, links, loading and authentication errors — localized |
| `/register` | `Register.jsx` | Guest | Registration, activation instructions, validation and loading — localized |
| `/users` | `Users.jsx` | Administrator | List, filters, selection, bulk actions, confirmations and export controls — localized |
| `/users/new` | `NewUser.jsx` | Administrator | Create-user form, roles, validation and feedback — localized |
| `/users/:id/edit` | `EditUser.jsx` | Administrator | Edit/delete controls, password help, roles and feedback — localized |
| `/products/new` | `NewProduct.jsx` | Administrator | Product form, SKU help, categories, validation and feedback — localized |
| `/products/:id/edit` | `EditProduct.jsx` | Administrator | Edit/delete form, category loading, validation and confirmations — localized |
| `/warehouses/new` | `NewWarehouse.jsx` | Administrator | Warehouse form, existing submitting state and feedback — localized |
| `/warehouses/:id/edit` | `EditWarehouse.jsx` | Administrator | Edit form, loading, status, validation and feedback — localized |
| `/categories` | `Categories.jsx` | Administrator | Inline create/edit, empty state, validation and confirmations — localized |
| `/dashboard` | `Dashboard.jsx` | Authenticated | Status counts, all four chart panels, help, selected headings and errors — localized |
| `/products` | `Products.jsx` | Authenticated | Quick actions, category/product pies, tooltips, legends and help — localized |
| `/stock-movements` | `StockMovements.jsx` | Authenticated | Quick actions, type/monthly charts and errors — localized |
| `/warehouses` | `Warehouses.jsx` | Authenticated | Quick actions, stock bars, product pie, legends and help — localized |
| `/profile` | `Profile.jsx` | Authenticated | View/edit labels, roles, password verification and feedback — localized |
| `/expiration` | `ExpirationStock.jsx` | Authenticated | Expiration-stock heading/table, back control and errors — localized |
| `/stock-movements/new` | `CreateMovement.jsx` | Authenticated | React Select, line controls, lot/date/quantity help and feedback — localized |
| `/stock-movements/list` | `MovementList.jsx` | Authenticated | Filters, user options, dates/types/counts, states and export controls — localized |
| `/stock-movements/:id` | `MovementDetail.jsx` | Authenticated | Detail headings, line table, date/type/count display — localized |
| `/products/list` | `ProductList.jsx` | Authenticated | Search/filters, bulk controls, loading and export controls — localized |
| `/products/:id` | `ProductDetail.jsx` | Authenticated | Details, status, loading and actions — localized |
| `/products/:id/stock` | `ProductStock.jsx` | Authenticated | SKU heading, stock/expiration/summary tables and errors — localized |
| `/products/:id/history` | `ProductHistory.jsx` | Authenticated | History chart/table, dates/types/counts and states — localized |
| `/stock/warehouse/:warehouse_id/products/:product_id/history` | `ProductHistoryByWarehouse.jsx` | Authenticated | Warehouse-specific product history chart/table and feedback — localized |
| `/warehouses/list` | `WarehouseList.jsx` | Authenticated | List, selection, filters, bulk/delete actions, empty state and export controls — localized |
| `/warehouses/:id` | `WarehouseDetail.jsx` | Authenticated | Technical ID, name/status, loading and actions — localized |
| `/stock/warehouse/:warehouse_id/product/:product_id` | `ProductStockByWarehouse.jsx` | Authenticated | History chart, stock table, dates/quantities and states — localized |
| `/stock/warehouse/:warehouse_id` | `WarehouseStock.jsx` | Authenticated | Stock heading/summary and loading/empty/error feedback — localized |
| `/stock/warehouse/:warehouse_id/history` | `WarehouseStockHistory.jsx` | Authenticated | History chart/table, dates/types/counts and states — localized |

The root route `/` redirects to `/login` with no independent content. No password-recovery/reset page, separate sidebar, or custom modal form exists. The responsive main navigation supplies the existing shell. Browser alerts/confirmation dialogs remain, with Persian application messages.

## Shared surface checklist

- [x] Navigation, breadcrumbs, pagination, protected-route loading and permission feedback
- [x] Shared search/filter controls and supplied options; inline category editor
- [x] Product, user, warehouse, stock, expiration and summary tables
- [x] Chart titles, number/date/type axes, legends, pie labels, tooltips and help
- [x] Native validity feedback; React Select visible text, live announcements and portals
- [x] Known/unknown API errors, network failures and structured validation details
- [x] Live/stored notification display and bulk-status summaries
- [x] CSV headers, human status/role/type/date cells and export failures
- [x] Logical RTL layout, back arrows, technical-value isolation and accessible labels
- [ ] Live visuals, keyboard/screen-reader interactions and guest/user/admin flows — manual verification required

`SearchInput.jsx`, `SelectFilter.jsx`, and `ContainerFilters.jsx` have no default English UI; callers supply centralized Persian text. `PublicRoute.jsx`, `AuthProvider.jsx`, `context/useAuth.js`, `useWebSocket.js`, and `AppRouter.jsx` retain their existing implementation. Refresh/logout console diagnostics are not UI. Role-specific navigation remains covered by Stage 1A tests.

## Other files changed and reasons

Together with the 29 page files above, these are the remaining Stage 1B changes:

| File | Reason |
|---|---|
| `frontend/package.json` | Run both focused suites using the existing Node test runner |
| `frontend/src/App.jsx` | Centralized native invalid/input event presentation |
| `frontend/src/api/auth.js` | Localize login/register/profile/password-verification failures |
| `frontend/src/api/products.js` | Localize product/category failures and malformed category responses |
| `frontend/src/api/warehouses.js` | Localize warehouse API failures |
| `frontend/src/api/users.js` | Localize user errors, preserving structured validation details |
| `frontend/src/api/stock.js` | Localize stock/history/expiration failures |
| `frontend/src/api/stock_moves.js` | Localize movement API failures |
| `frontend/src/components/CreateInlineCategory.jsx` | Localize form labels, validation and API feedback |
| `frontend/src/components/ErrorMessage.jsx` | Announce errors and preserve multiline feedback |
| `frontend/src/components/ExportCSVButton.jsx` | Centralized Persian default export label |
| `frontend/src/components/HoverMessage.jsx` | Logical overlay spacing/position and Persian close label |
| `frontend/src/components/LocalizedAsyncSelect.jsx` (new) | Persian AsyncSelect defaults/live messages and RTL portal styling |
| `frontend/src/components/PersianPieLabel.jsx` (new) | Format pie quantities without changing geometry/data |
| `frontend/src/components/ProductListTable.jsx` | Localize headers/status/actions/confirmations, empty/selection states and isolate data |
| `frontend/src/components/ProductStockExpirationTable.jsx` | Localize headers/actions/totals/dates and isolate SKU/lot/names |
| `frontend/src/components/StockSummaryTable.jsx` | Localize quantities/totals/actions; retain summation |
| `frontend/src/components/UsersListTable.jsx` | Localize roles/status/actions/states and isolate names/emails |
| `frontend/src/components/WarehouseStockSummaryTable.jsx` | Localize headers/actions/totals and isolate names/SKUs |
| `frontend/src/i18n/fa.js` | Extend the existing dictionary across frontend domains |
| `frontend/src/i18n/errors.js` (new) | Known errors, safe fallbacks, field paths and fetch error presentation |
| `frontend/src/i18n/nativeValidation.js` (new) | Persian validity feedback; preserve values/component-owned constraints |
| `frontend/src/i18n/display.js` (new) | Enum labels, bidi isolation, chart styles and month-bucket display |
| `frontend/src/i18n/select.js` (new) | Persian result counts and live announcements |
| `frontend/src/i18n/notifications.js` | Persian fallback for unknown messages; retain cache/payload |
| `frontend/src/router/AdminRoute.jsx` | Persian permission/loading feedback; retain guard/redirect |
| `frontend/src/router/PrivateRoute.jsx` | Persian loading feedback; retain guard/redirect |
| `frontend/src/utils/export.js` | Persian CSV presentation, UTF-8 BOM and export failures |
| `frontend/src/utils/showStatusSummary.js` | Localize bulk-response counts/actions/skipped count |
| `frontend/tests/localization.test.mjs` | Updated terminology/fallback expectations |
| `frontend/tests/application-localization.test.mjs` (new) | Route/SSR/validation/select/error/table/API/CSV regression checks |
| `docs/LOCALIZATION.md` | Current maintainer guide; retain historical Stage 1A results |
| `docs/STAGE1B_LOCALIZATION.md` (new) | Route/component checklist and final evidence/limitations |

Stage 1A HTML/CSS/font setup, `Navbar.jsx`, `Breadcrumb.jsx`, `Pagination.jsx`, `i18n/index.js`, and `utils/format.js` are unchanged in Stage 1B. Original font/license bytes are unchanged and included identically in build output. Dependency declarations and lockfile are unchanged.

## Architecture and adding translations

The existing dictionary and `t("namespace.key", parameters)` remain the single translation system. New namespaces: `auth`, `users`, `products`, `warehouses`, `stock`, `stockMovements`, `dashboard`, `charts`, `validation`, `errors`, `select`, `exports`. Existing namespaces reused/extended: `common`, `navigation`, `breadcrumbs`, `notifications`, `pagination`. Forms/tables share common labels without an additional localization system.

Terms include محصولات, انبارها, گردش موجودی, ورود کالا, خروج کالا, مدیر سیستم, کاربر عادی, فعال and غیرفعال. API values remain `incoming`, `outgoing`, `admin`, `user`.

Add a descriptive key in `fa.js`, call `t` only for presentation, format interpolation counts/dates explicitly, and run `npm.cmd run test:localization`. Missing keys return the key; a source-wide check detects unresolved static references. React renders translations as escaped plain text. [LOCALIZATION.md](LOCALIZATION.md) documents examples and formatting contracts.

## RTL and formatting

- HTML remains `lang="fa" dir="rtl"`, with matching React-root settings. The verified OFL-licensed, locally bundled Vazirmatn font remains global; no runtime download occurs.
- Table alignment, horizontal form spacing, back controls and overlays use logical `text-start`, `ms/me`, `ps/pe`, `start/end` where applicable. Inappropriate uppercase/letter spacing was removed from Persian headings. Existing grids, sizes, scroll containers, colors and chart geometry remain.
- Emails, URLs, numeric/ISO date inputs, SKUs, lots and technical IDs retain LTR display. Stored names use `<bdi>` or isolate markers within translated headings.
- AsyncSelect receives RTL, Persian defaults/loading/no-results/live messages, isolated option labels and explicit body-portal direction/font styles. Existing Headless UI menus inherit shell direction.
- Charts retain LTR coordinates and raw data/calculations. Legends/tooltips receive RTL. Numbers use `formatNumber`; type/date/month/series text uses display formatters/translations.
- `formatNumber` changes display only; IDs/input values stay raw. `formatDate` defaults to the Persian calendar, preserves date-only days and explicit source offsets, never mutates timestamps, and does not guess a timezone for naive timestamps. Invalid/ambiguous values show `—`.
- Gregorian monthly API buckets retain their actual aggregation periods, with Persian month names/digits. They are not relabeled as Jalali months.

## Validation, errors and notifications

All six resource API modules use `apiFetch`, forwarding the same request URLs/methods/credentials/headers/payloads and returning successful responses unchanged. Known backend failures map to Persian; others use HTTP-specific or generic Persian feedback.

`LocalizedApiError` retains status, non-enumerable raw `detail`, network `cause`, and localized `fieldErrors` with original field paths. Pydantic errors display field names, line numbers and constraint counts. Malformed detail/context has a safe Persian fallback. Existing diagnostics remain; localization does not automatically expose response bodies/input values.

Native validity feedback covers required/email/type/number/step/length/range/pattern failures. Root handlers clear only their own messages on input and preserve component-owned constraints. Values, bounds, patterns and payloads are unchanged. CreateMovement's existing warehouse/product validation keys now reach their displayed errors, and its existing lot-length error is visible; validation rules are unchanged.

Profile password verification displays its actual localized failure, including network/session errors, while preserving verification/update order. Known socket notifications translate at display time; unknown stored/live messages show اعلان جدید while original cache/payload remains. Confirmation behavior is unchanged.

CSV headers and human-readable status/role/type/date cells are Persian with a UTF-8 BOM. Numeric cells, IDs, stored names, emails, filenames, queries and export limits stay raw/original. Consumers expecting English headers or Gregorian date text must adapt to this intentional presentation change.

## Commands/checks and actual results

Run locations: `frontend` for npm/ESLint; repository root for Git/source audits. Batches A–E were reviewed, each followed by the existing 14 localization checks and full lint: checks passed and the original lint baseline remained. Batch F adds the application-wide suite.

| Command/check | Actual result |
|---|---|
| `npm.cmd run test:localization` | Passed: 28 tests, zero failed/skipped, including all 29 initial route states |
| `npm.cmd run lint` | Exit 1: same pre-existing 1 error and 9 warnings; no new findings |
| `.\node_modules\.bin\eslint.cmd src/i18n src/components src/api src/utils --max-warnings 0` | Passed: no errors/warnings in these shared modules |
| `npm.cmd run build -- --outDir C:\Users\Hamafza\AppData\Local\Temp\tabulae-stage1b-build-35693255ec864a9482bc386fca2f79e5` | Passed: 1326 modules. Existing >500 kB warning remains; expected outside-root output notice |
| `git diff --check` | Passed tracked changes; new source/docs/tests also whitespace-audited |
| `git diff --name-only -- backend db_init .env` plus changed-file inventory | Empty protected-path diff; frontend/localization-doc changes only |
| AST comparison against the start-of-Stage-1B snapshot | Passed: 47 API request argument sets, 27 chart data/name keys, 14 named chart/calculation blocks unchanged |
| Router/auth/dependency/lockfile snapshot comparisons | Unchanged |
| Font/license SHA-256 and build byte comparisons | Passed, identical original files |
| Browser inventory | No available browser/apps; live checks could not run |
| Backend database tests | Not run; no connection/configuration/destructive fixture attempted |

Tests block or mock network requests and SSR uses fixture auth without effects. No new test framework was installed. Behavioral checks cover missing translations, number/date/offset boundaries, field details/cause, native validity ownership, React Select announcements, immutable enum/month data, populated stock/user tables, raw successful create/update/login contracts, and CSV BOM/headers/status/date/raw values. Static JSX/key checks support the source review; they are not its sole completion criterion.

Pre-existing lint findings: unused `user` in CreateMovement; four AuthProvider warnings; one hook-dependency warning each in Categories, Dashboard, ProductList, Users and WarehouseList. No unrelated fix was made.

Stage 0 baseline: frontend build succeeded; 139 backend tests collected, execution blocked by dedicated test-database connectivity. Docker unavailable, `db_test` unresolved, host port 5434 timed out. Backend fixtures clear tables and must never run against real data or an unverified database. The vendored OFL.txt line-21 trailing space is retained byte-for-byte.

## Untranslated exceptions, limitations and risks

| Item | Reason/effect |
|---|---|
| Database/user-entered names/descriptions | Actual data remains unchanged even when English; no seed or record translation |
| IDs, SKUs, lots, emails, URLs, `NO_LOT` | Technical values retained with LTR direction |
| Tabulae, SKU/CSV acronyms, Enter/Escape | Brand, technical acronyms and recognizable keyboard keys |
| CSV filenames and raw numeric/ID cells | Preserve technical values; human headers/status/role/type/date intentionally Persian |
| Enums, field/chart keys, console diagnostics, internal `No date` fallback | Code values retained; date fallback displays `—`, not English UI |
| Browser dialog buttons/date-picker chrome | Browser/OS controls their language; application messages are Persian and ISO input values unchanged |
| Monthly buckets | Actual Gregorian boundaries retained with Persian names/digits |
| Unknown errors/notifications | Persian fallback; future specific types need reviewed mapping, raw details retained |

Live clipping, chart positioning, portal focus, screen-reader pronunciation and mobile keyboard behavior remain unverified. CSV consumers must adapt to localized human-readable columns; no additional export workflow was added.

Source review identified these existing functional issues, retained because fixes would expand beyond localization:

1. Dashboard cumulative history stores `date`, but its X axis reads `created_at`; chart dates may be missing. Keys/calculations unchanged.
2. Expiration-stock outgoing shortcut passes `type`, while CreateMovement reads `move_type`; it may initialize as incoming. Workflow state unchanged.
3. Product/user exports pass `is_active` while exporters read `isActive`; movement export/list date parameters differ. Existing filter/request semantics preserved.
4. Category loading retains the first-page limit (100); Products retains its empty-versus-loading behavior. Submission locking/request timing was not refactored.

These require separately authorized follow-up; no database/API/business workaround was applied.

## بررسی دستی پیشنهادی

1. در محیط آزمایشی با داده‌های قابل حذف، ورود و ثبت‌نام را بررسی کنید؛ پیام فیلد خالی، ایمیل نامعتبر، رمز کوتاه، حساب غیرفعال و خطای شبکه باید فارسی باشد.
2. با حساب کاربر عادی و مدیر، منو، پروفایل و دسترسی مدیریتی را مقایسه کنید؛ مسیرها و مجوزها باید مانند قبل کار کنند.
3. فرم‌های محصول، انبار، کاربر و دسته‌بندی را بررسی کنید؛ برچسب، پیام تکراری بودن و تأیید حذف باید فارسی باشد. کد محصول و ایمیل باید چپ‌به‌راست و مقدار ارسالی بدون تغییر باشد.
4. در ثبت گردش موجودی، ورود و خروج کالا، جست‌وجوی محصول و انبار، سری ساخت، تاریخ و تعداد را بررسی کنید. انتخاب با صفحه‌کلید، پیام بارگذاری، نتیجه خالی و اعلان دسترس‌پذیری باید درست باشد.
5. داشبورد و نمودارهای موجودی و تاریخچه را با داده بررسی کنید؛ عنوان، راهنما، محور، تعداد و تاریخ باید خوانا باشد. نام‌های لاتین ذخیره‌شده نباید ترجمه شوند.
6. اعلان قدیمی و جدید، جست‌وجو، فیلتر و صفحه‌بندی را بررسی کنید؛ در CSV، فارسی بودن سرستون‌ها و حفظ عدد و شناسهٔ اصلی را تأیید کنید.
7. در موبایل و دسکتاپ، منو، فرم، جدول قابل پیمایش و پنجرهٔ انتخاب را بررسی کنید؛ متن نباید بریده شود و جهت ایمیل، کد و نشانهٔ بازگشت باید درست باشد.

## Exact diff summary

Stage 1B-only against the preserved start-of-phase snapshot (Git no-index numstat ignoring CRLF-only differences): **62 files changed, 2007 insertions(+), 1016 deletions(-)**; no binary changes.

Complete uncommitted working tree versus HEAD, including retained Stage 1A and all new files: **71 files changed, 2833 insertions(+), 1135 deletions(-)**; includes one added 111,152-byte font binary. Text totals exclude the binary.

The tracked diff and new-file contents were reviewed. No files were staged and no commit was created. Source/fixture/artifact checks are distinct from live browser verification. Stop here for Stage 1B review; Stage 1C/workflow work requires separate authorization.
