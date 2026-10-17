# معماری PostgreSQL و SQLModel

## اتصال و دو راه ساخت schema

Compose تصویر `postgres:17` را اعلام می‌کند (`docker-compose.yml:15`). backend، `DATABASE_URL` را به `create_async_engine` می‌دهد، `AsyncSessionLocal` با `expire_on_commit=False` می‌سازد و session را در `get_db` به درخواست تزریق می‌کند (`backend/app/models/database.py:9-22`). driver پیکربندی‌شده `asyncpg` است (`backend/requirements.txt`). `create_db_and_tables` در startup فقط جدول‌های ثبت‌شده در metadata را با `create_all` می‌سازد (`backend/app/models/database.py:25-28`). از طرف دیگر `db_init/01_db_tables_trigger.sql:5-139` روی volume تازهٔ PostgreSQL هفت جدول و trigger می‌سازد. فایل SQL، `revoked_tokens` را نمی‌سازد؛ مدل `backend/app/models/revoked_token.py:4-8` آن را به metadata اضافه می‌کند. بنابراین آماده بودن logout/refresh به موفقیت startup ORM نیز بستگی دارد. migration versioned یا Alembic در مخزن دیده نشد. schema زنده بررسی نشد.

## جدول‌ها

این مشخصات از مدل‌ها و SQL اولیه‌اند. `PK` کلید اصلی، `FK` کلید خارجی، `UQ` یکتا، `NN` غیرتهی است. نوع‌هایی مثل `str` در ORM طول ثابت ندارند، در حالی که SQL طول `VARCHAR` تعیین می‌کند؛ بنابراین نوع نهایی به مسیر ساخت و تاریخچهٔ DB بستگی دارد.

| جدول | ستون‌ها، کلیدها، پیش‌فرض‌ها | منبع |
|---|---|---|
| `user` | `id` int PK؛ `name` str NN؛ `email` str NN UQ و index ORM؛ `password` str NN؛ `role` str NN در ORM ولی SQL فقط CHECK و بدون NN؛ `is_active` bool NN پیش‌فرض true. SQL طول 100/100/255/50 دارد | `backend/app/models/user.py:3-11`؛ `db_init/01_db_tables_trigger.sql:5-12` |
| `product_category` | `id` int PK؛ `name` str NN UQ و index ORM؛ SQL `VARCHAR(50)` | `backend/app/models/product_category.py:3-7`؛ `db_init/01_db_tables_trigger.sql:22-25` |
| `product` | `id` int PK؛ `sku` str NN UQ/index؛ `short_name` str NN؛ `description` str nullable؛ `category_id` int NN FK→category؛ `is_active` bool NN true؛ SQL طول 20/100/500 | `backend/app/models/product.py:4-12`؛ `db_init/01_db_tables_trigger.sql:28-36` |
| `warehouse` | `id` int PK؛ `name` String(255) NN؛ `is_active` bool NN true؛ یکتایی نام تعریف نشده | `backend/app/models/warehouse.py:4-9`؛ `db_init/01_db_tables_trigger.sql:15-19` |
| `stock_move` | `id` int PK/index ORM؛ `created_at` timestamp with time zone، پیش‌فرض Python اکنون/SQL NOW؛ `move_type` str NN/index ORM ولی SQL CHECK و بدون NN؛ `user_id` int NN FK→user؛ SQL `VARCHAR(10)` | `backend/app/models/stock_move.py:6-15`؛ `db_init/01_db_tables_trigger.sql:39-45` |
| `stock_move_line` | PK مرکب `move_id` int FK→move و `line_id` int CHECK>0؛ `warehouse_id` int NN FK/index؛ `product_id` int NN FK/index؛ `lot` str پیش‌فرض NO_LOT؛ `expiration_date` date nullable؛ `quantity` int NN CHECK>0؛ SQL lot حداکثر 50 | `backend/app/models/stock_move_line.py:6-15`؛ `db_init/01_db_tables_trigger.sql:48-60` |
| `stock` | PK مرکب `warehouse_id` int FK→warehouse، `product_id` int FK→product، `lot` str پیش‌فرض NO_LOT؛ `expiration_date` date nullable؛ `quantity` int NN و CHECK≥0 در ORM، SQL CHECK≥0 ولی NN ندارد | `backend/app/models/stock.py:6-31`؛ `db_init/01_db_tables_trigger.sql:63-70` |
| `revoked_tokens` | `jti` str PK؛ `expires_at` datetime؛ **فقط ORM** و نه SQL اولیه | `backend/app/models/revoked_token.py:4-8` |

رابطه‌های صریح در `Field(foreign_key=...)` و SQL `FOREIGN KEY` بالا تأیید شده‌اند؛ در مدل‌ها `Relationship` ORM تعریف نشده است، پس joinها صریح نوشته می‌شوند. indexهای SQL روی `stock_move.user_id/created_at/move_type` و `stock_move_line.warehouse_id/product_id` هستند (`db_init/01_db_tables_trigger.sql:150-155`). indexهای ORM برای email، SKU، نام دسته و موارد دیگر، روی پایگاه ساخته‌شده با SQL لزوماً وجود ندارند؛ `create_all` جدول موجود را تغییر نمی‌دهد. وضعیت indexهای یک DB فعلی **نامعلوم** است.

## عملیات و تراکنش

درج محصول `db.add` ← `db.commit` ← `db.refresh` است (`backend/app/routers/products.py:163-188`). ویرایش از `sqlmodel_update(product_update.model_dump(exclude_unset=True))` استفاده می‌کند (`:302-332`). انبار در `warehouses.create_warehouse:141-166` و `update_warehouse:169-228` مشابه است. حرکت، سربرگ و خطوط را در یک `AsyncSession` درج و **یک بار** commit می‌کند (`backend/app/services/stock_move_service.py:95-125`)، و trigger SQL هنگام درج هر خط موجودی را تغییر می‌دهد؛ خطای DB با rollback کل عملیات را برمی‌گرداند (`:127-141`). این رفتار مشروط به نصب بودن trigger است. گزارش‌ها از `select`، `join` و `func.sum`/`group_by` استفاده می‌کنند؛ نمونهٔ جمع محصول در انبارها `backend/app/routers/stock.py:316-369` و جمع انبارها `:682-717` است. تاریخچه به `StockMove`، `StockMoveLine`، `User` و `Product` join می‌زند (`:425-468`). هیچ rollback صریح پس از همهٔ مسیرهای خطای read دیده نمی‌شود؛ session با خروج بسته می‌شود.

نمونه‌های کوتاه **از پیاده‌سازی**، نه query پیشنهادی:

```python
# backend/app/routers/products.py:141
statement = select(Product).where(Product.sku == product_data.sku)

# backend/app/routers/warehouses.py:84-88
select(func.sum(Stock.quantity)).where(Stock.warehouse_id == warehouse.id)

# backend/app/routers/stock.py:806-814
select(Stock.lot, Stock.expiration_date, func.sum(Stock.quantity).label("quantity"))
```

`join` در `backend/app/routers/products.py:38-40` نام دسته را کنار محصول می‌آورد؛ `where` نتیجه را فیلتر و `group_by` همراه `func.sum` مجموع stock را می‌سازد (`backend/app/routers/stock.py:682-699`). FK و constraint در PostgreSQL آخرین مرز یکپارچگی‌اند، اما به دلیل تفاوت SQL و ORM باید روی DB واقعی بررسی شوند. `db.commit` نقطهٔ نهایی transaction است؛ در مسیر خطاهای نوشتن `db.rollback` اجرا می‌شود.

## تفاوت‌ها و دغدغهٔ تولید

**تأییدشده:** SQL اولیه trigger دارد؛ ساخت صرفاً با ORM ندارد. تست‌های `conftest.py:62-94` با ORM جدول می‌سازند و هیچ نصب trigger در fixture دیده نشد، پس آزمون stock movement ممکن است مسیر واقعی تولید را بازسازی نکند. `stock_move_line` در SQL طول lot و در ORM `max_length=50` دارد؛ تطابق عملی به schema ساخته‌شده وابسته است. `stock.quantity` و `move_type` در SQL می‌توانند NULL باشند، برخلاف انتظار مدل/منطق. `create_all` migration schema موجود نیست. **استنباط:** برای production باید migration versioned، backup/restore آزمایش‌شده، بررسی index و آزمون هم‌زمانی داشته باشیم. وجود backup، سطح isolation واقعی و آمار query فعلی **نامعلوم** است. هشدار concurrency دقیق در [منطق موجودی](09-business-logic.md) آمده است.

برای backup، حفظ هم‌زمان schema، داده و تابع/trigger لازم است؛ بازیابی باید روی پایگاه جدا و با شمارش موجودی در برابر خطوط حرکت آزموده شود. این یک **توصیهٔ عملیاتی** است، نه قابلیتی که در مخزن پیاده شده باشد. سطح isolation در engine تنظیم نشده (`backend/app/models/database.py:12`) و مقدار واقعی ممکن است از تنظیم DB بیاید؛ بدون بررسی live نباید آن را قطعی دانست. indexهای SQL اولیه روی فیلترهای حرکت وجود دارند، ولی اندازهٔ داده و برنامهٔ اجرای query بررسی نشد.
