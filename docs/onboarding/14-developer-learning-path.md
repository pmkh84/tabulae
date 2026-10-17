# مسیر پیشنهادی خواندن کد

هر تمرین فقط خواندن، یادداشت‌برداری یا اجرای آزمون امن است؛ هیچ داده‌ای را تغییر ندهید. ترتیب، از تصویر کلی به رفتار تراکنشی می‌رسد.

| گام | فایل‌ها و دلیل | پرسش و دستاورد | تمرین کم‌خطر |
|---|---|---|---|
| ۱ | `docker-compose.dev.yml`، `docker-compose.yml`؛ سرویس‌ها | مرورگر به کدام port وصل می‌شود؟ topology را بفهمید | نمودار دستی مسیر مرورگر تا DB بکشید |
| ۲ | `frontend/src/main.jsx`، `App.jsx`؛ آغاز React | providerها به چه ترتیبی‌اند؟ | درخت component را روی کاغذ بنویسید |
| ۳ | `frontend/src/router/AppRouter.jsx` و guardها؛ مجوز UI | کدام route مدیر است؟ | مسیرهای دارای `:id` را فهرست کنید |
| ۴ | `frontend/src/context/AuthProvider.jsx`، `api/auth.js`؛ وضعیت login | access و refresh کجا هستند؟ | توالی بارگذاری صفحه را رسم کنید |
| ۵ | `frontend/src/i18n/` و `index.css`؛ فارسی/RTL | خطای 422 چگونه فارسی می‌شود؟ | یک کلید ترجمه را تا مصرف‌کننده دنبال کنید |
| ۶ | `frontend/src/api/products.js`، `api/config.js`؛ HTTP | Bearer و base URL کجا تعیین می‌شوند؟ | ساخت URL فیلتر محصول را با ورودی فرضی حساب کنید |
| ۷ | `frontend/src/pages/NewProduct.jsx`، `hooks/useProductForm.js`، `utils/productForm.js`؛ فرم | بدون تغییر در ویرایش چه می‌شود؟ | payload چند تغییر فرضی را دستی بسازید |
| ۸ | `backend/app/main.py`، `models/database.py`؛ startup | create_all چه چیزی را نمی‌سازد؟ | تفاوت آن با SQL اولیه را یادداشت کنید |
| ۹ | `backend/app/dependencies.py`، `utils/authentication.py`؛ auth | role از claim یا DB سنجیده می‌شود؟ | access token را بدون افشای مقدار، از نظر claimها شرح دهید |
| ۱۰ | `backend/app/schemas/product.py` و `models/product.py`؛ قرارداد/نگاشت | validation و FK در کدام لایه‌اند؟ | سه خطای 422/400/409 را از هم جدا کنید |
| ۱۱ | `backend/app/routers/products.py`؛ CRUD | commit و rollback کجاست؟ | توالی POST محصول را بنویسید |
| ۱۲ | `backend/app/routers/warehouses.py`؛ قواعد وضعیت | bulk و single چه تفاوتی دارند؟ | جدول حالت ردیف stock صفر/مثبت بسازید |
| ۱۳ | `backend/app/routers/stock_moves.py` و `services/stock_move_service.py`؛ تراکنش | user_id از کجا می‌آید؟ | نقاط rollback را علامت بزنید |
| ۱۴ | `db_init/01_db_tables_trigger.sql` و `models/stock.py`؛ موجودی | trigger روی کدام event است؟ | ورود/خروج یک lot با اعداد فرضی را حساب کنید |
| ۱۵ | `backend/app/routers/stock.py`؛ گزارش | join و `func.sum` چه می‌کنند؟ | query جمع انبار را به SQL مفهومی تبدیل کنید |
| ۱۶ | `frontend/src/hooks/useWebSocket.js`، `backend/app/routers/websocket.py`؛ اعلان | چرا چند worker مسئله است؟ | توالی اتصال و اولین پیام را رسم کنید |
| ۱۷ | `backend/app/tests/conftest.py`، `frontend/tests/`؛ کیفیت | کدام fixture DELETE دارد؟ | فقط frontend `npm.cmd test` را در محیط مجاز اجرا کنید |
| ۱۸ | `docs/onboarding/13-architecture-review.md`؛ جمع‌بندی | اولین ریسک قابل اصلاح چیست؟ | برای یک بهبود طرح آزمون و rollback بنویسید |

## راه‌پیمایی کامل یک قابلیت: ساخت محصول

از route مدیر `/products/new` در `frontend/src/router/AppRouter.jsx:51-56` شروع کنید. `NewProduct.jsx:13-29` از `useProductForm` استفاده می‌کند. hook دادهٔ دسته‌ها را از `useProductCategories` می‌گیرد و در `save`، `submitProductForm` را صدا می‌زند (`frontend/src/hooks/useProductForm.js:8-83`). `productForm.js` validation و payload را می‌سازد. `api/products.js:51-62` POST JSON و Bearer را ارسال می‌کند؛ `apiFetch` خطا را فارسی می‌کند. backend در `backend/app/routers/products.py:131-188` با `ProductCreate` و `require_admin` وارد می‌شود، SKU و دسته را می‌سنجد، `Product` را commit می‌کند و `ProductResponse` با نام دسته می‌دهد. صفحه اعلان موفقیت و ناوبری دارد. برای فهم کامل، مسیر خطای SKU تکراری را هم از router تا `productErrorFeedback` دنبال کنید. DB و تست backend را برای این تمرین اجرا نکنید.
