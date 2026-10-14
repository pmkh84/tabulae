# Stage 1C-1 — product management improvements

Existing product creation/editing now share validation, field feedback, submission guards and complete category loading. Product navigation preserves list context and refreshes metadata after changes. Existing routes, endpoints, backend permissions, request schemas, database models, stock rules and movement history code are unchanged. Warehouse management was not modified.

The starting working tree was clean at `6098bf6` (the user's localization commit). The Stage 1A/1B foundation was preserved. No files were staged and no commit was created by this task.

## Findings and existing functionality reused

The inspected flow is React product forms → `src/api/products.js` → existing FastAPI product router → Pydantic schemas → SQLModel/database operations.

- Create already uses `POST /products` and backend `require_admin`. SKU requires 3–20 uppercase Latin letters/digits; short name 3–100 characters; description at most 500; category ID must be positive and exist. The database generates the ID and defaults `is_active` to true.
- Edit already uses `PUT /products/{id}`, but this endpoint supports partial fields: `ProductUpdate` makes them optional and the router applies `model_dump(exclude_unset=True)`. Sending an unchanged false status unnecessarily invokes the existing stock/deactivation check. Sending every field also overwrites unrelated unchanged metadata, including an untouched nullable description.
- Forms only checked blank values in JavaScript, lacked synchronous duplicate-submission guards and showed save failures in alerts instead of field feedback. Edit initialization could be overwritten by late loads or access-token refreshes.
- `GET /categories` already returns `data`, `total`, `limit`, `offset`, with a maximum page size of 100 and alphabetical ordering. The array-returning frontend helper discarded totals, so forms/list filters only saw the first page.
- Product list search/category/status/offset existed only in component state and were lost during navigation. The backend always sorts by `short_name`; there is no client sorting control to preserve or replace. Older list responses could replace newer filter results.
- Product detail loading failures redirected away instead of offering a visible retry state. Edit/delete controls already check administrator role; route guards and backend authorization remain authoritative.

Existing product/category API services, router paths, admin guards, inline category creation, confirmation/success messages, table components, pagination, Persian translations, RTL/font setup, and localized error adapters were reused.

Backend product tests were inspected: they cover listing/filtering/pagination, create/edit permissions, duplicate/invalid SKUs/categories, partial updates/reactivation, stock-related deactivation refusal and deletion relationships. Database fixtures are destructive and the disposable test database has not been verified reachable, so none were executed.

## Files changed and reasons

| File | Reason |
|---|---|
| `frontend/src/pages/NewProduct.jsx` | Use shared validation/submission logic, pending controls, inline field errors, complete categories and preserved list return context |
| `frontend/src/pages/EditProduct.jsx` | Reliable initialization/loading/missing states, partial changes, pending controls, field feedback and preserved selection/navigation |
| `frontend/src/hooks/useProductForm.js` (new) | Shared load/save/delete coordination, synchronous lock, stale/unmounted-result guards, token-refresh input preservation and submission-only error focus |
| `frontend/src/utils/productForm.js` (new) | Backend-aligned validation, explicit field whitelist, changed-field payloads and structured/known field errors; testable submission coordination |
| `frontend/src/api/products.js` | Expose the existing category page envelope and collect all verified pages; share concurrent category requests while retaining legacy helper behavior |
| `frontend/src/hooks/useProductCategories.js` (new) | Complete-list loading/error/retry state, stale-response protection and local merge of created categories |
| `frontend/src/components/ProductCategoryFeedback.jsx` (new) | Reusable Persian loading/failure/retry presentation |
| `frontend/src/components/CreateInlineCategory.jsx` | Existing create-category behavior plus length checks, pending guard, disabled controls and lifecycle-safe feedback |
| `frontend/src/pages/ProductList.jsx` | URL-backed filter/page context, complete category filter, stale-response protection, retry and fresh list/counts after deletion |
| `frontend/src/components/ProductListTable.jsx` | Carry list context into detail/edit navigation; same role checks and actions |
| `frontend/src/pages/ProductDetail.jsx` | Fresh GET on navigation, response-ID checks, stale-load protection, visible retry errors, success feedback and context-aware return/edit |
| `frontend/src/components/Breadcrumb.jsx` | Optional navigation state for product detail breadcrumbs; existing callers/default behavior unchanged |
| `frontend/src/components/ErrorMessage.jsx` | Optional DOM ID to connect product field errors to accessible descriptions; existing callers unchanged |
| `frontend/src/utils/productNavigation.js` (new) | Parse/update existing list state in query parameters; validate internal return destinations |
| `frontend/src/i18n/fa.js` | Central Persian product constraints, category feedback, retry and unchanged-state messages |
| `frontend/package.json` | Add product-suite and combined-suite commands; no dependency changes |
| `frontend/tests/product-management.test.mjs` (new) | Focused validator/API/hook-logic/SSR/navigation regression coverage with mocked transport |
| `docs/STAGE1C1_PRODUCTS.md` (new) | Implementation findings, request flows, evidence, limitations and manual checklist |

## Creation request flow

1. Load every category page before enabling the selector and save button. Entered SKU/name/description stay in local form state. Inline creation uses the existing category POST and selects its returned ID.
2. Validate required fields, exact SKU syntax/length, name length, description length and selected category membership. Length checks count Unicode code points as Pydantic does. No SKU trimming, uppercasing, transliteration or Persian-digit conversion occurs.
3. Acquire a synchronous request lock before awaiting transport and display the Persian pending state. A second click/Enter cannot create a second request. Fields, save, cancel and inline category controls are disabled as appropriate.
4. Send only `sku`, `short_name`, `description`, numeric `category_id` through the existing `createProduct` helper. No client-generated ID/status/stock/history data is sent.
5. On failure, keep values and display field errors or a safe Persian network/server message. Clear pending state so retry is possible. On success, use the existing Persian success alert and return to the preserved list URL with success feedback; the mounted list reads fresh data.

The server remains responsible for administrator authorization, uniqueness/category existence, database ID/status defaults, transaction commit/rollback and response data. Mocked tests do not verify those persistence operations.

## Editing request flow

1. Read the existing product by route ID, checking that the response ID matches. Show Persian loading, missing-product or retryable failure states. Ignore superseded/unmounted loads. Populate the form only for its current product; access-token refresh does not overwrite unsaved values.
2. Preserve the original product snapshot and validate edited values using the same rules as creation. Existing/selected category ID remains visible while the complete list loads; unavailable non-original selections have a neutral selected-category label rather than an incorrect name.
3. Compare only the allowed metadata fields with the original snapshot. Send just changed fields through the same PUT endpoint. An unchanged `is_active` is omitted; a deliberately toggled value remains subject to the backend stock rule. An untouched null description stays null because it is omitted. IDs, category display labels, quantities and movement history are never included in metadata payloads.
4. If there are no changes, show a Persian informational message and send no request. Otherwise use the same synchronous lock/pending/error handling. The existing edit-page delete action shares the mutation lock and retains its backend behavior.
5. On success, update the form's original snapshot from the server response, show Persian success and navigate to the existing detail route. Detail reads fresh metadata; return to the preserved list URL triggers a fresh list request. Empty pagination pages move to the nearest valid page after count changes.

Field errors have `aria-invalid`, linked descriptions and alert semantics. Focus moves to the first invalid field after a failed submission, without jumping between fields while the user types. These two product forms use `noValidate` so centralized field feedback handles submission, including programmatic cases. HTML constraints remain documented on controls and the JavaScript validator enforces them; backend validation remains unchanged.

## Category pagination and performance

The collector requests 100 records at offsets 0, 100, 200, and so on until the reported total is satisfied, with no artificial page/category cap. It verifies each envelope, page length, stable total, expected offset and unique positive IDs. Missing/truncated/inconsistent pages fail the entire load instead of exposing a partial list. Retry starts from offset zero.

Concurrent consumers with the same access token share a pending promise, including duplicate effect loads. Completed results and credentials are not cached: the map entry is removed on completion/failure. Requests are sequential, and no larger/unsupported page size or new endpoint was introduced. Created categories are merged locally by ID and selected without refetching all pages.

Creation/editing cannot submit against an incomplete list. The list page can still show its product results while its category filter presents separate loading/error feedback. The legacy `getCategories` array-returning helper remains available for existing category-management callers; the separate Categories management page was not redesigned in this stage.

## Navigation and refresh

The existing product list path now retains `search`, `category_id`, `is_active`, and `offset` in query parameters. Filter changes reset offset and replace the current history entry; unrelated query parameters are preserved. The backend's alphabetical sorting and 10-row page size remain unchanged.

List → create/detail/edit carries the internal list URL in Router state. Detail → edit and product breadcrumbs retain it. Save/cancel/back actions use it; return destinations are restricted to `/products/list`, including its query. There are no full-page reloads or route architecture changes. A newly created/edited product may not match the retained filters, which is expected. Deliberately using the main navigation/overview starts its existing navigation flow rather than restoring a previous list view.

List reads ignore older responses, clear stale rows/selection on failure and offer retry. Successful deletion refreshes rows/counts and handles a now-empty final page. Product CSV export behavior, warehouse screens and stock/history charts were left unchanged.

## Verification and coverage

Commands below ran from `frontend`, except Git/hash audits from the repository root:

| Command/check | Actual result |
|---|---|
| `npm.cmd run test:localization` | 28 passed during baseline and implementation checks; all 28 also pass in the final combined run |
| `npm.cmd run test:products` | Earlier focused run: 18 passed; final expanded suite has 20 passed through `npm.cmd test` |
| `npm.cmd test` | Final run: **48 passed**, zero failures/skips; 28 localization + 20 product-management checks |
| `npm.cmd run lint` | Exit 1: **1 pre-existing error, 8 warnings**, versus starting 1 error/9 warnings; the related ProductList dependency warning was resolved, no new findings |
| Scoped `eslint.cmd ... --max-warnings 0` over all changed application modules | Passed with zero errors/warnings |
| `npm.cmd run build -- --outDir C:\Users\Hamafza\AppData\Local\Temp\tabulae-stage1c1-baseline-l52cx096\build` | Passed, 1331 modules; existing >500 kB warning and expected temporary outside-root output notice |
| `git diff --check` and new-file whitespace audit | Passed |
| Snapshot hashes/Git scope audit | Backend, auth/router, warehouse/stock source, unrelated frontend files and package lock unchanged; dependencies unchanged |
| Browser inventory | Empty; live browser checks could not run |
| Backend database tests | Not run; disposable test database not verified reachable, destructive fixtures untouched |

The scoped lint command included `src/api/products.js`, `src/components/{Breadcrumb,CreateInlineCategory,ErrorMessage,ProductListTable,ProductCategoryFeedback}.jsx`, `src/hooks/{useProductForm,useProductCategories}.js`, `src/i18n/fa.js`, `src/pages/{NewProduct,EditProduct,ProductList,ProductDetail}.jsx`, and `src/utils/{productForm,productNavigation}.js` as explicit arguments. No suppression or ESLint configuration change was made.

Tests use Node's built-in runner plus already-installed Vite, React and React server rendering. API transport is blocked or mocked with fixture URLs/tokens; no real backend/database is reached. Public React hooks are replaced by a small deterministic lifecycle fixture only for hook unit checks. Separate SSR checks use real React hooks. This verifies application logic, not live browser event/focus/layout scheduling or real database persistence. No test framework/dependency was installed.

| Requested behavior | Automated evidence |
|---|---|
| Successful create | Actual form hook and existing POST helper with mocked transport; whitelisted raw payload/result |
| Successful edit | Actual hook initialization/save and existing PUT helper; changed fields only and fresh baseline |
| Required/invalid SKU/name/description/category | Boundary tests plus blocked transport on invalid forms; SKU unchanged |
| Duplicate SKU | Create failure reaches the SKU field; update error mapping uses the same feedback path |
| Category failure and >100 records | Visible hook error/no partial data, retry preserving input, 235-record three-page load |
| Duplicate submissions | Two rapid hook saves produce one request and pending/disabled state |
| Network/server failures | Persian fallback, preserved values, released lock and successful retry |
| Missing product | Persian missing state and blocked save |
| Refresh | Saved server result becomes the baseline; mocked subsequent GET returns updated metadata; actual route transitions remain manual |
| Unchanged data | Unchanged status/null omitted, ID/category preserved and unrelated keys excluded |
| Persian/admin UI | Real React SSR verifies Persian feedback, disabled loading form and role-based table actions; existing route/locale tests retained |
| Additional lifecycle/accessibility cases | Token refresh, category creation selection, stale route responses/unmount, and submission-only focus checks |

An initial SSR assertion assumed attribute order; it was corrected to check each required attribute independently. No application workaround or weakened constraint was used to make a check pass.

## Limitations and regression risks

- Browser inventory returned no available browsers/apps. Live save/navigation, mobile RTL, DOM focus, keyboard handling and network throttling are not claimed verified; use the checklist below.
- Backend database regression tests were not run. Their pre-existing dedicated test-database connectivity problem and destructive fixtures remain. Configuration was not pointed at development/production, and no database operation was attempted. Stock/history persistence is protected by unchanged backend code and metadata-only request fields, but requires disposable-environment integration verification.
- Offset pagination has no catalog version/snapshot contract. Total/duplicate/truncation checks catch detectable concurrent category changes, but same-count substitutions cannot be guaranteed detectable. Retry/reload if the catalog changes while browsing. Extremely large catalogs require many sequential requests and native select options; a server-side searchable category API would be a separately authorized improvement.
- Client request locks prevent repeated requests while pending; they are not backend idempotency. If the server commits but the response is lost, an intentional retry can receive the existing duplicate-SKU error. Database uniqueness remains authoritative.
- Partial metadata updates reduce accidental overwrite of unchanged fields. The endpoint has no optimistic-concurrency/version field, so concurrent edits to the same changed field still follow existing last-write behavior.
- Existing full lint still has its unrelated CreateMovement error and eight remaining warnings. The pre-existing build bundle-size warning remains. No unrelated cleanup was performed.
- The separate category-management page's first-page view and the known product CSV status-filter mismatch remain outside this create/edit/navigation work. Earlier stock/chart/warehouse limitations were not changed.

## چک‌لیست آزمون دستی فارسی

همه آزمون‌های نوشتن داده را فقط در محیط آزمایشی با پایگاه دادهٔ قابل حذف و تأییدشده انجام دهید.

1. با کاربر عادی، مسیرهای افزودن و ویرایش محصول را مستقیم باز کنید؛ دسترسی باید مانند قبل محدود باشد. در فهرست و جزئیات، کنترل ویرایش/حذف فقط برای مدیر نمایش داده شود.
2. با مدیر، کد لاتین معتبر مثل `ABC123`، نام فارسی، توضیحات و دسته‌بندی وارد کنید؛ ذخیره باید پیام موفقیت فارسی بدهد و فهرست تازه شود. شناسهٔ محصول باید از سرور دریافت شود.
3. فیلدهای الزامی را خالی بگذارید؛ خطا کنار فیلد باشد و تمرکز به اولین فیلد نامعتبر منتقل شود. هنگام اصلاح متن، تمرکز نباید خودکار به فیلد دیگری بپرد.
4. کد دو نویسه‌ای، بیش از ۲۰ نویسه، حروف کوچک، فاصله، خط تیره و ارقام فارسی را امتحان کنید؛ همه باید رد شوند و مقدار کد خودکار تغییر نکند. مرزهای ۳ و ۲۰ نویسهٔ مجاز را نیز بررسی کنید.
5. نام کوتاه با کمتر از ۳ یا بیشتر از ۱۰۰ نویسه و توضیحات بیش از ۵۰۰ نویسه را بررسی کنید؛ پیام محدودیت باید فارسی باشد. توضیحات خالی باید همچنان اختیاری باشد.
6. کد تکراری را در افزودن و ویرایش امتحان کنید؛ خطای کد باید کنار همان فیلد باشد، همه ورودی‌ها حفظ شوند و اصلاح/تلاش دوباره ممکن باشد.
7. در ابزار شبکهٔ مرورگر، درخواست ذخیره را کند کنید و چند بار دکمه یا Enter بزنید؛ یک درخواست ارسال شود و کنترل‌ها تا پایان درخواست غیرفعال باشند. پس از خطا دوباره فعال شوند.
8. هنگام ذخیره، قطع شبکه و خطای سرور را شبیه‌سازی کنید؛ پیام فارسی و حفظ همه ورودی‌ها را بررسی کنید. این آزمون اثبات ذخیره‌شدن واقعی داده در سرور نیست.
9. بیش از ۱۰۰ دسته‌بندی آزمایشی ایجاد/آماده کنید؛ دسته‌بندی صفحهٔ دوم و سوم باید در افزودن، ویرایش و فیلتر فهرست قابل انتخاب باشد. خطای صفحهٔ میانی نباید فهرست ناقص قابل استفاده بسازد؛ تلاش دوباره باید کامل بارگذاری کند.
10. در ویرایش، دسته‌بندی و داده‌های قبلی را بررسی کنید. حین بارگذاری/خطا، انتخاب قبلی حفظ شود. ساخت دسته‌بندی درجا باید فقط یک درخواست بدهد، دسته‌بندی تازه را انتخاب کند و سایر فیلدها را حفظ کند.
11. بدون تغییر، ذخیره را بزنید؛ پیام نبود تغییر و عدم ارسال PUT را بررسی کنید. نام یک محصول غیرفعال را ویرایش کنید؛ در بدنهٔ درخواست نباید وضعیت غیرفعالِ بدون تغییر دوباره ارسال شود. توضیحات تهیِ بدون تغییر نیز نباید ارسال شود.
12. موجودی و تاریخچهٔ یک محصول را پیش از و پس از ویرایش اطلاعات مقایسه کنید؛ شناسه، تعداد و گردش‌ها باید ثابت بمانند. غیرفعال‌سازی عمدیِ محصول دارای موجودی باید با قانون فعلی سرور رد شود؛ مجوز یا محدودیت نباید دور زده شود.
13. از فهرست دارای جست‌وجو، دسته‌بندی، وضعیت و صفحهٔ مشخص به افزودن/جزئیات/ویرایش بروید و برگردید؛ زمینهٔ فهرست حفظ شود. پس از ذخیره، جزئیات و فهرست باید دادهٔ تازه نشان دهند؛ آخرین صفحهٔ خالی بعد از حذف درست اصلاح شود.
14. شناسهٔ ناموجود و خطای بارگذاری محصول را بررسی کنید؛ پیام فارسی و بازگشت/تلاش دوباره مناسب باشد. تغییر مسیر سریع نباید اطلاعات محصول قبلی را روی محصول جدید نمایش دهد.
15. در موبایل و دسکتاپ، جهت فرم، خوانایی پیام‌ها، منوی دسته‌بندی، دکمه‌ها، کد لاتین و کار با صفحه‌کلید را بررسی کنید.

## Exact Git diff summary

Against the starting HEAD `6098bf6`, including all new files: **18 files changed, 1049 insertions(+), 260 deletions(-)**; no binary changes. Tracked changes use `git diff --numstat`; new files are included using Git no-index numstat against `NUL`.

The full tracked diff and new-file contents were reviewed. Backend/models/migrations/auth/router/warehouse/stock files and dependency lockfile were verified unchanged. Stage 1C-1 stops here for review; warehouse management was not started.
