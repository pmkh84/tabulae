# واژه‌نامهٔ فنی در زمینهٔ Tabulae

| مفهوم | تعریف کوتاه و نمونهٔ واقعی در پروژه |
|---|---|
| Client–server | مرورگر React درخواست را به FastAPI می‌فرستد؛ مسیر `main.jsx` تا `backend/app/main.py` و پاسخ JSON را در `api/products.js` ببینید. |
| REST API | منابع با URL و روش HTTP در `backend/app/routers/products.py:21-366` عرضه شده‌اند؛ بعضی عملیات مثل login عملیاتی‌اند، پس قواعد REST را کورکورانه تعمیم ندهید. |
| CRUD | Create/Read/Update/Delete محصول با `create_product/get_product/update_product/delete_product` در `routers/products.py` انجام می‌شود؛ هر نوشتن commit جدا دارد. |
| JWT | token امضاشده با `sub/exp/jti/type` در `utils/authentication.py:34-71`؛ dependency با DB کاربر و لغو را هم می‌سنجد. |
| Authentication | اثبات هویت با login و bcrypt در `routers/auth.py:63-99`؛ پاسخ access JWT است. |
| Authorization | مجوز عملیات با `require_admin` و بررسی مالکیت در `dependencies.py:65-72` و `routers/users.py:142-146` تعیین می‌شود. |
| Dependency Injection | FastAPI با `Depends(get_db)` session و با `Depends(require_admin)` کاربر مجاز را پیش از endpoint فراهم می‌کند (`routers/products.py:131-136`). |
| Middleware | `CORSMiddleware` در `backend/app/main.py:37-44` سیاست مبدأ/credentials را روی درخواست و پاسخ اعمال می‌کند. |
| Pydantic | schema ورودی/خروجی و اعتبارسنجی؛ `ProductCreate` SKU را با pattern و طول بررسی می‌کند (`schemas/product.py:6-20`). |
| SQLModel | مدل جدول و نگاشت SQLAlchemy؛ `Product.category_id` FK دارد (`models/product.py:4-12`). |
| ORM | تبدیل شیء `Product` به رکورد DB؛ `db.add(new_product)` و `select(Product)` در `routers/products.py:141,172` نمونه است. |
| Async/await | فراخوانی nonblocking DB در `await db.execute/commit` (`services/stock_move_service.py:102-125`)، با `AsyncSession` در `models/database.py`. |
| React component | تابعی که UI می‌سازد؛ `NewProduct` فرم را رندر می‌کند (`frontend/src/pages/NewProduct.jsx:13`). |
| Props | ورودی component؛ `Pagination({total,limit,offset,onPageChange})` در `frontend/src/components/Pagination.jsx:4` داده/رفتار را از صفحه می‌گیرد. |
| State | دادهٔ قابل تغییر UI؛ email/password/error در `pages/Login.jsx:9-20` با `useState` نگه‌داری می‌شود. |
| Context API | auth مشترک بدون عبور props از همهٔ سطح‌ها؛ `AuthProvider.jsx:164-179` و `context/useAuth.js`. |
| Custom hook | منطق state قابل استفادهٔ مجدد؛ `useWarehouseForm.js:6-87` خواندن، ذخیره و خطا را مدیریت می‌کند. |
| React Router | نگاشت URL به صفحه/guard؛ `AppRouter.jsx:43-95` و `useParams` در `EditProduct.jsx`. |
| HTTP request | `fetch` با method، header و body؛ `createProduct` در `frontend/src/api/products.js:51-62`. |
| PostgreSQL relationship | FKهای صریح مثل `stock_move_line.product_id → product.id` در `db_init/01_db_tables_trigger.sql:47-60`. |
| Transaction | مجموعهٔ نوشتن‌های اتمیک؛ حرکت و خطوط با یک `commit` یا `rollback` در `services/stock_move_service.py:95-141`. |
| Database trigger | تابع SQL پس از INSERT خط حرکت، `stock.quantity` را تغییر می‌دهد (`db_init/01_db_tables_trigger.sql:73-139`). |
| WebSocket | اتصال دوطرفه برای اعلان حرکت؛ `frontend/src/hooks/useWebSocket.js:5-35` token را اولین پیام می‌فرستد و `backend/app/routers/websocket.py:45-76` را ببینید. |
| Docker | تصویرهای backend و frontend را از `backend/Dockerfile` و `frontend/Dockerfile` می‌سازد. |
| Docker Compose | سرویس‌ها، شبکه، port و volume را در `docker-compose*.yml` هماهنگ می‌کند. |
| Reverse proxy | واسط HTTP جلوی API؛ `frontend/nginx.conf` فعلاً فقط SPA را سرو می‌کند و route proxy API ندارد. |
| Environment variable | تنظیم جدا از کد؛ `DATABASE_URL` در `models/database.py:9` و `VITE_API_URL` در `frontend/src/api/config.js:1-6`. |
| Unit test | تابع/منطق کوچک، نمونهٔ `frontend/tests/product-management.test.mjs` برای payload/validation. |
| Integration test | چند لایه با DB؛ `backend/app/tests/test_products.py` از ASGI client و fixture DB در `conftest.py` استفاده می‌کند؛ اجرای آن نیازمند DB ایزوله است. |
| E2E test | جریان کامل مرورگر تا DB واقعی؛ suite مرورگر E2E در inventory مشاهده نشد؛ برخی testها SSR و API mock دارند ولی E2E واقعی نیستند. |
