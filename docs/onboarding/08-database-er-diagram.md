# نمودارهای ER

این نمودارها از `backend/app/models/*.py` و `db_init/01_db_tables_trigger.sql:5-70` استخراج شده‌اند؛ **schema پایگاه دادهٔ در حال اجرا بررسی نشده است**. `revoked_tokens` فقط در ORM تعریف شده و رابطهٔ FK ندارد. کاردینالیتی‌ها از FKهای صریح و قابلیت تهی نبودن گرفته شده‌اند. ترکیب `warehouse_id, product_id, lot` کلید stock و `move_id, line_id` کلید line است.

## ER کامل

```mermaid
erDiagram
  USER {
    int id PK
    string name
    string email UK
    string password
    string role
    boolean is_active
  }
  PRODUCT_CATEGORY {
    int id PK
    string name UK
  }
  PRODUCT {
    int id PK
    string sku UK
    string short_name
    string description
    int category_id FK
    boolean is_active
  }
  WAREHOUSE {
    int id PK
    string name
    boolean is_active
  }
  STOCK_MOVE {
    int id PK
    datetime created_at
    string move_type
    int user_id FK
  }
  STOCK_MOVE_LINE {
    int move_id PK, FK
    int line_id PK
    int warehouse_id FK
    int product_id FK
    string lot
    date expiration_date
    int quantity
  }
  STOCK {
    int warehouse_id PK, FK
    int product_id PK, FK
    string lot PK
    date expiration_date
    int quantity
  }
  REVOKED_TOKENS {
    string jti PK
    datetime expires_at
  }
  PRODUCT_CATEGORY ||--o{ PRODUCT : category_id
  USER ||--o{ STOCK_MOVE : user_id
  STOCK_MOVE ||--o{ STOCK_MOVE_LINE : move_id
  WAREHOUSE ||--o{ STOCK_MOVE_LINE : warehouse_id
  PRODUCT ||--o{ STOCK_MOVE_LINE : product_id
  WAREHOUSE ||--o{ STOCK : warehouse_id
  PRODUCT ||--o{ STOCK : product_id
```

## تصویر مفهومی

```mermaid
flowchart LR
  User[کاربر] --> Move[حرکت ورود یا خروج]
  Move --> Line[خطوط حرکت]
  Line --> Product[محصول در دسته]
  Line --> Warehouse[انبار]
  Line --> Trigger[trigger update_stock]
  Trigger --> Balance[موجودی به تفکیک انبار + محصول + lot]
```

`REVOKED_TOKENS` به `USER` وصل نشده است: `jti` صرفاً شناسهٔ JWT است (`backend/app/models/revoked_token.py:4-8`). هیچ FK برای آن در کد تعریف نشده؛ اتصال در ER اختراع نمی‌شود. تعداد خط هر حرکت در schema می‌تواند صفر باشد، هرچند سرویس ایجاد حرکت آن را منع می‌کند (`backend/app/services/stock_move_service.py:16-28`).
