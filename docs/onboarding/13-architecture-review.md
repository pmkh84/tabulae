# ارزیابی معماری و اولویت‌ها

## قوت‌های تأییدشده

- مرز client/server و API serviceهای حوزه‌ای مشخص است (`frontend/src/api/*.js`، `backend/app/routers/*.py`).
- وابستگی `get_current_user` و `require_admin` مجوز backend را مستقل از guard UI اعمال می‌کند (`backend/app/dependencies.py:14-72`).
- ساخت حرکت در یک commit و rollback جمع شده است (`backend/app/services/stock_move_service.py:76-143`).
- پاسخ‌های صفحه‌بندی‌شده و `response_model` در بسیاری از endpointها قرارداد واضح دارند (`backend/app/routers/products.py:23`، `stock.py:62`).
- UI متن فارسی، RTL و محلی‌سازی خطا را به‌صورت ماژول‌های جدا دارد (`frontend/src/App.jsx:13`، `frontend/src/i18n/errors.js`).

## بدهی و ریسک‌های اولویت‌دار

| اولویت | یافته با شاهد | شدت/اثر | پیچیدگی تقریبی | بهبود پیشنهادی |
|---|---|---|---|---|
| P0 | `create_all` در startup trigger را نصب نمی‌کند و SQL اولیه جدول `revoked_tokens` ندارد (`backend/app/models/database.py:25`، `db_init/01_db_tables_trigger.sql:5-139`) | بالا؛ موجودی یا auth به تاریخچهٔ ساخت DB وابسته می‌شود | متوسط | migration versioned واحد و آزمون schema تازه/قدیمی |
| P0 | خروج موجودی SELECT و UPDATE جدا با `GREATEST` دارد (`db_init/01_db_tables_trigger.sql:112-128`) | بالا؛ احتمال بیش‌فروشی هم‌زمان | متوسط | کاهش شرطی اتمیک/قفل ردیف و آزمون concurrency |
| P1 | fixture تست جدول‌ها را پاک می‌کند و URL ثابت دارد (`backend/app/tests/conftest.py:54-94`) | بالا؛ خطر داده در اتصال اشتباه | کم تا متوسط | fail-safe برای نام/host DB و محیط disposable |
| P1 | WebSocket type و revocation JWT را نمی‌سنجد؛ مدیر اتصال در حافظهٔ worker است (`backend/app/routers/websocket.py:11-70`، `backend/Dockerfile:24`) | متوسط تا بالا؛ مرز auth/اعلان ناقص | متوسط | اعتبارسنجی کامل و pub/sub مشترک |
| P1 | مسیرهای `/stock/history` برای همهٔ کاربران احرازشده همهٔ تاریخچه را می‌دهند، در حالی که `/stock-movements/` مالکیت را فیلتر می‌کند (`stock.py:425-468`، `stock_moves.py:70-74`) | وابسته به سیاست داده؛ افشای تاریخچهٔ دیگران ممکن است | کم | سیاست دسترسی را مشخص و هر دو مسیر را هماهنگ کنید |
| P1 | production build آدرس `localhost:8000` را در frontend embed می‌کند، reverse proxy/TLS ندارد (`docker-compose.yml:45-48`، `frontend/nginx.conf`) | بالا در استقرار عمومی | متوسط | URL قابل استقرار و proxy/TLS |
| P1 | Compose موسوم به production کل `db_init`، از جمله `02_insert_initial_data.sql` و `03_seed_stock_data.sql` را روی volume تازه اجرا می‌کند (`docker-compose.yml:23`) | بالا؛ دادهٔ seed در استقرار جدید | کم | seed نمونه را از مسیر production جدا کنید |
| P2 | کنترل غیرفعال‌سازی انبار تکی با bulk متفاوت است (`backend/app/routers/warehouses.py:69-108,184-202`) | متوسط؛ رفتار نامنتظر | کم | قاعدهٔ واحد و تست هر دو مسیر |
| P2 | تست backend trigger را با `create_all` نصب نمی‌کند (`backend/app/tests/conftest.py:62-75`) | متوسط؛ پوشش کاذب منطق موجودی | متوسط | fixture schema SQL/migration واقعی و تست تراکنش |
| P2 | `AuthProvider` timer را در render محلی نگه می‌دارد و lint هشدار dependency می‌دهد (`frontend/src/context/AuthProvider.jsx:19-45,121-157`) | متوسط؛ refresh timerهای هم‌پوشان ممکن است | کم تا متوسط | timer با ref و cleanup صریح، آزمون انقضا |
| P3 | قواعد تجاری محصول/انبار در routerهاست و الگوی service یکدست نیست (`products.py:131-332`، `warehouses.py:69-271`، `stock_move_service.py`) | متوسط؛ نگهداشت و تست دشوارتر | متوسط | هنگام تغییرات بعدی، قواعد مشترک را استخراج کنید |

شدت‌ها ارزیابی معماری‌اند؛ برای ریسک‌های وابسته به دادهٔ واقعی و topology، اثر نهایی **نامعلوم** است. کارایی queryها و ظرفیت، log/trace، backup/restore و readiness واقعی اندازه‌گیری نشد. شواهد `func.count` روی subquery و joinهای چندجدولی در `backend/app/routers/stock.py` و `products.py` نشان می‌دهد پایش query و index باید با workload واقعی انجام شود؛ کندی بالفعل ادعا نمی‌شود. `db_init/01_db_tables_trigger.sql:150-155` تعدادی index دارد، ولی DB موجود ممکن است schema متفاوتی داشته باشد. وجود CI، monitoring و کنترل‌های gateway بیرونی از مخزن قابل تعیین نیست.
