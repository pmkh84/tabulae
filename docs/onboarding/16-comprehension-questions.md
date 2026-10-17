# پرسش‌های سنجش درک

پیش از دیدن پاسخ‌ها، مسیر کد را پیدا کنید. پاسخ‌ها جداگانه در بخش دوم همین فایل آمده‌اند.

## پرسش‌ها

1. نقطهٔ ورود React کجاست و providerها چه ترتیبی دارند؟
2. کدام فایل route مدیر را از route کاربر جدا می‌کند؟
3. access token و refresh token در سمت مرورگر کجا هستند؟
4. `VITE_API_URL` چه زمانی برای build production تعیین می‌شود؟
5. خطای 422 چگونه به پیام فارسی و فیلد فرم می‌رسد؟
6. چه فیلدهایی در payload ایجاد محصول هستند؟
7. ویرایش محصول بدون تغییر چه درخواست HTTP می‌فرستد؟
8. نقش admin در backend از JWT claim یا رکورد DB سنجیده می‌شود؟
9. ثبت‌نام عمومی حساب را فعال می‌سازد؟
10. `get_db` session را چگونه می‌بندد؟
11. کدام عملیات stock را تغییر می‌دهد: Python service یا PostgreSQL trigger؟
12. trigger روی INSERT، UPDATE یا DELETE خط حرکت فعال است؟
13. کلید اصلی `stock` از چه ستون‌هایی تشکیل شده است؟
14. چرا ساخت جدول با `create_all` معادل SQL اولیه نیست؟
15. رفتار غیرفعال‌سازی تکی و bulk انبار با stock صفر چه تفاوتی دارد؟
16. کاربر عادی در کدام endpoint حرکت فقط دادهٔ خود را می‌بیند و در کدام endpoint تاریخچهٔ عمومی می‌بیند؟
17. چرا اعلان WebSocket در deployment چهار worker ممکن است به همه نرسد؟
18. fixture backend پیش از هر آزمون با DB چه می‌کند؟
19. کدام تست‌ها در بررسی فعلی اجرا و چه نتیجه‌ای ثبت شد؟
20. کدام قابلیت برای اجرای production در مخزن به‌صورت versioned دیده نمی‌شود؟

## پاسخ‌نامه با ارجاع

1. `frontend/src/main.jsx:22-29`: `StrictMode`، سپس `BrowserRouter`، `AuthProvider` و `App`.
2. `frontend/src/router/AppRouter.jsx:46-94` با `AdminRoute` و `PrivateRoute`.
3. access در state `AuthProvider.jsx:12` و refresh در cookie HttpOnly ساختهٔ `backend/app/routers/auth.py:116-124`.
4. build arg در `docker-compose.yml:45-48` و `frontend/Dockerfile:6-8`، هنگام `vite build`.
5. `frontend/src/i18n/errors.js:15-108,118-136`؛ مثال فیلد در `utils/productForm.js:41-58` و `hooks/useProductForm.js:70-76`.
6. `sku, short_name, description, category_id` در `frontend/src/utils/productForm.js:25-31`.
7. هیچ؛ `submitProductForm` وضعیت `unchanged` برمی‌گرداند (`frontend/src/utils/productForm.js:60-68`).
8. رکورد فعلی DB در `backend/app/dependencies.py:41-72`.
9. خیر؛ `is_active=False` در `backend/app/routers/auth.py:34-40`.
10. `async with AsyncSessionLocal()` و `yield` در `backend/app/models/database.py:19-22`.
11. trigger `update_stock()` در `db_init/01_db_tables_trigger.sql:73-139`؛ سرویس فقط حرکت/خط را درج می‌کند (`services/stock_move_service.py:95-122`).
12. `AFTER INSERT ON stock_move_line` در SQL:135-139.
13. `warehouse_id,product_id,lot` در `backend/app/models/stock.py:11-25` و SQL:63-70.
14. `create_all` در `backend/app/models/database.py:25-28` trigger را نصب نمی‌کند؛ SQL اولیه در `db_init/01_db_tables_trigger.sql:73-139` آن را دارد و `revoked_tokens` فقط در ORM است.
15. ویرایش تکی وجود هر ردیف stock را رد می‌کند (`warehouses.py:184-202`)؛ bulk فقط مجموع مثبت را مانع می‌داند (`:84-99`).
16. `/stock-movements/` با فیلتر user (`stock_moves.py:70-74`)؛ `/stock/history` بدون آن (`stock.py:425-468`).
17. `ConnectionManager` در حافظهٔ process است (`websocket.py:11-41`) و Docker چهار worker اجرا می‌کند (`backend/Dockerfile:24`).
18. `conftest.py:77-94` هشت جدول را DELETE و commit می‌کند؛ بنابراین مقصد باید DB تست جدا باشد.
19. `npm.cmd test`: ۷۷ موفق؛ `npm.cmd run lint`: ۱ خطا و ۷ هشدار. تنظیم دستورها در `frontend/package.json:6-14` است؛ نتیجهٔ اجرا در `12-testing-quality.md` ثبت شده.
20. migration versioned/Alembic در inventory دیده نشد؛ تنها SQL اولیه و `create_all` (`db_init/01_db_tables_trigger.sql`، `backend/app/models/database.py:25-28`).
