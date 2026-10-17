# مرجع endpointهای بررسی‌شده

مبنای مسیرها decoratorهای `backend/app/routers/*.py` و ثبت router در `backend/app/main.py:47-56` است. `/` پایانی routeهای فهرست در FastAPI ثبت شده؛ درخواست بدون slash می‌تواند redirect شود. در ستون دسترسی: «عمومی»، «کاربر»=`get_current_user`، «مدیر»=`require_admin`. schema پاسخِ «JSON» یعنی `response_model` صریح ندارد؛ شکل خروجی را خود تابع تعیین می‌کند. همهٔ مسیرهای زیر **تأییدشده از کد** هستند، نه آزمون زنده.

| روش و مسیر | تابع و محل | ورودی ← خروجی | دسترسی و کاربرد |
|---|---|---|---|
| GET `/` | `main.read_root:59` | ـ ← JSON message | عمومی؛ پیام پایه |
| POST `/auth/register` | `auth.register:28` | `UserSelfRegister` ← `UserResponse` | عمومی؛ ایجاد کاربر غیرفعال |
| POST `/auth/login` | `auth.login:63` | `OAuth2PasswordRequestForm` ← JSON token | عمومی؛ ورود و cookie |
| GET `/auth/profile` | `auth.get_profile:132` | ـ ← `UserResponse` | کاربر؛ مشخصات |
| POST `/auth/refresh` | `auth.refresh_token:139` | cookie ← JSON token | cookie معتبر؛ توکن جدید |
| POST `/auth/verify-password` | `auth.verify_user_password:202` | `PasswordCheckRequest` ← JSON message | کاربر؛ تأیید رمز |
| POST `/auth/logout` | `auth.logout:215` | Bearer و cookie ← JSON message | Bearer؛ لغو jti |
| GET `/users/` | `users.get_users:24` | query ← `PaginatedUserResponse` | مدیر؛ فهرست |
| POST `/users/` | `users.create_user:65` | `UserAdminCreate` ← `UserResponse` | مدیر؛ ساخت |
| GET `/users/{id}` | `users.get_user:116` | id ← `UserResponse` | مدیر یا خود کاربر |
| PUT `/users/bulk-status` | `users.bulk_update_user_status:151` | `BulkStatusUpdate` ← `BulkStatusUpdateResponse` | مدیر؛ وضعیت گروهی |
| PUT `/users/{id}` | `users.update_user:191` | `UserUpdate` ← `UserResponse` | مدیر یا خود؛ نقش/فعالیت فقط مدیر |
| DELETE `/users/{id}` | `users.delete_user:293` | id ← `UserResponse` | مدیر؛ حذف بدون حرکت |
| GET `/products/` | `products.get_products:23` | query ← `PaginatedProductResponse` | کاربر؛ غیرمدیر فقط فعال |
| GET `/products/{id}` | `products.get_product:91` | id ← `ProductResponse` | کاربر؛ غیرمدیر فقط فعال |
| POST `/products/` | `products.create_product:131` | `ProductCreate` ← `ProductResponse` | مدیر؛ ساخت |
| PUT `/products/bulk-status` | `products.bulk_update_product_status:191` | `BulkStatusUpdateRequest` ← JSON | مدیر؛ وضعیت گروهی |
| PUT `/products/{id}` | `products.update_product:233` | `ProductUpdate` ← `ProductResponse` | مدیر؛ ویرایش |
| DELETE `/products/{id}` | `products.delete_product:335` | id ← `ProductResponse` | مدیر؛ حذف |
| GET `/categories/` | `product_categories.list_categories:24` | query ← `PaginatedProductCategoryResponse` | کاربر؛ فهرست |
| POST `/categories/` | `product_categories.create_category:44` | `ProductCategoryCreate` ← `ProductCategoryResponse` | مدیر؛ ساخت |
| PUT `/categories/{id}` | `product_categories.update_category:67` | `ProductCategoryUpdate` ← `ProductCategoryResponse` | مدیر؛ ویرایش |
| DELETE `/categories/{id}` | `product_categories.delete_category:99` | id ← `ProductCategoryResponse` | مدیر؛ حذف بدون محصول |
| GET `/warehouses/` | `warehouses.get_warehouses:24` | query ← `PaginatedWarehouseResponse` | کاربر؛ فهرست حتی غیرفعال |
| PUT `/warehouses/bulk-active` | `warehouses.bulk_update_is_active_warehouses:69` | `BulkStatusUpdate` ← `BulkStatusUpdateResponse` | مدیر؛ وضعیت گروهی |
| GET `/warehouses/{id}` | `warehouses.get_warehouse:111` | id ← `WarehouseResponse` | کاربر؛ غیرفعال فقط مدیر |
| POST `/warehouses/` | `warehouses.create_warehouse:141` | `WarehouseCreate` ← `WarehouseResponse` | مدیر؛ ساخت |
| PUT `/warehouses/{id}` | `warehouses.update_warehouse:169` | `WarehouseUpdate` ← `WarehouseResponse` | مدیر؛ ویرایش |
| DELETE `/warehouses/{id}` | `warehouses.deactivate_warehouse:230` | id ← `WarehouseResponse` | مدیر؛ حذف فیزیکی مشروط |
| GET `/stock-movements/` | `stock_moves.get_movements:37` | query ← `PaginatedStockMovesResponse` | کاربر؛ عادی فقط حرکت خود |
| GET `/stock-movements/last-year` | `stock_moves.get_movements_last_year:132` | ـ ← `List[StockMoveLastYearGraph]` | کاربر؛ شمار ماهانه |
| GET `/stock-movements/{id}` | `stock_moves.get_movement:179` | id ← `StockMoveResponse` | کاربر؛ عادی فقط خود |
| POST `/stock-movements/` | `stock_moves.create_movement:240` | `StockMoveCreate` ← `StockMoveResponse` | کاربر؛ ثبت ورود/خروج |
| GET `/stock-movements/{id}/lines` | `stock_moves.get_movement_lines:270` | id/query ← `PaginatedStockMoveLineWithNamesResponse` | کاربر؛ خطوط حرکت خود/همهٔ مدیر |
| GET `/stock-movements/summary/move-type` | `stock_moves.count_movements_by_move_type:348` | ـ ← `List[StockMoveSummary]` | کاربر؛ شمار برحسب نوع |
| GET `/stock/` | `stock.get_all_stock:62` | query ← `PaginatedStockResponse` | کاربر؛ موجودی |
| GET `/stock/warehouse/{warehouse_id}` | `stock.get_stock_by_warehouse:107` | id/query ← `PaginatedStockResponse` | کاربر؛ موجودی انبار |
| GET `/stock/warehouse/{warehouse_id}/detail` | `stock.get_stock_by_warehouse_pie_chart:153` | id ← `List[StockByWarehousePieChart]` | کاربر؛ نمودار |
| GET `/stock/product/expiration` | `stock.get_stock_by_expiration:192` | فیلتر/query ← `PaginatedStockResponse` | کاربر؛ انقضا |
| GET `/stock/product/{product_id}` | `stock.get_stock_by_product:316` | id/query ← `PaginatedStockSummary` | کاربر؛ جمع در انبارها |
| GET `/stock/warehouse/{warehouse_id}/product/{product_id}` | `stock.get_stock_by_warehouse_and_product:371` | دو id/query ← `PaginatedStockResponse` | کاربر؛ lotها |
| GET `/stock/history` | `stock.get_stock_history:425` | query ← `PaginatedStockHistory` | کاربر؛ همهٔ خطوط تاریخچه |
| GET `/stock/product/{product_id}/history` | `stock.get_product_stock_history:472` | id/query ← `PaginatedStockHistory` | کاربر؛ تاریخچهٔ محصول |
| GET `/stock/warehouse/{warehouse_id}/history` | `stock.get_warehouse_stock_history:521` | id/query ← `PaginatedStockHistory` | کاربر؛ تاریخچهٔ انبار |
| GET `/stock/warehouse/{warehouse_id}/product/{product_id}/history` | `stock.get_warehouse_and_product_stock_history:570` | دو id/query ← `PaginatedStockHistory` | کاربر؛ تاریخچهٔ ترکیبی |
| GET `/stock/semaphore` | `stock.get_stock_status_semaphore:626` | ـ ← `StockSemaphore` | کاربر؛ گروه انقضا |
| GET `/stock/warehouses/detail` | `stock.get_warehouse_stock_detail:682` | ـ ← `List[StockByWarehouse]` | کاربر؛ جمع انبار |
| GET `/stock/product-categories` | `stock.get_stock_by_product_category:719` | ـ ← `List[StockByCategory]` | کاربر؛ جمع دسته |
| GET `/stock/category/{category_id}/products` | `stock.get_stock_by_category_detail:757` | id ← `List[StockByProductInCategory]` | کاربر؛ محصولات دسته |
| GET `/stock/available-lots` | `stock.get_available_lots:798` | `product`,`warehouse` ← `list[AvailableLotResponse]` | کاربر؛ lot با تعداد مثبت |
| WebSocket `/ws/stock-moves` | `websocket.websocket_endpoint:45` | نخست token متنی؛ اعلان متنی | کاربر فعال؛ broadcast |

در این API، GET خواندن، POST ایجاد/عملیات auth، PUT ویرایش یا تغییر وضعیت، DELETE حذف است. PATCH استفاده نشده است. `POST /auth/logout` دادهٔ تجاری نمی‌سازد و `DELETE /warehouses/{id}` حذف مشروط دارد؛ پس نام روش به‌تنهایی معنای تجاری کافی نیست. `backend/app/routers/stock.py:425-624` تاریخچه را از join حرکت/خط می‌خواند و فیلتر مالکیت حرکت ندارد؛ تفاوت با `/stock-movements/` در [امنیت](06-authentication-security.md) آمده است.

پارامترهای query مهم: فهرست محصولات `limit/offset/search/category_id/is_active` دارد و برای غیرمدیر `is_active` ارسالی مؤثر نیست (`backend/app/routers/products.py:23-88`). انبارها `limit/offset/search/is_active` دارند (`backend/app/routers/warehouses.py:24-67`). حرکت‌ها `limit/offset/search/move_type/date_from/date_to/user_id` دارند؛ `user_id` فقط برای مدیر اعمال می‌شود (`backend/app/routers/stock_moves.py:37-84`). انقضا یا `preset` یا بازهٔ `from_date/to_date` می‌خواهد؛ ترکیب و بازهٔ معکوس با 400 رد می‌شوند (`backend/app/routers/stock.py:192-315`). `/stock/available-lots` دو query الزامی `product` و `warehouse` با مقدار مثبت می‌خواهد (`stock.py:798-805`). پاسخ‌های صفحه‌بندی‌شده اغلب `{data,total,limit,offset}` هستند؛ schemaهای `backend/app/schemas/stock.py`، `product.py`، `warehouse.py` و `stock_move.py` را برای نوع `data` ببینید.
