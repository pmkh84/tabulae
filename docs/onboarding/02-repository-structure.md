# ساختار مخزن

درخت زیر فایل‌های تولیدشده، تصاویر متعدد و `node_modules` را خلاصه می‌کند؛ از `rg --files` و پوشهٔ ریشه تهیه شده است.

```text
tabulae/
├─ backend/
│  ├─ app/main.py                 ساخت FastAPI، lifespan، CORS و routerها
│  ├─ app/dependencies.py         get_current_user و require_admin
│  ├─ app/routers/              auth، users، products، categories، warehouses، stock، stock_moves، websocket
│  ├─ app/schemas/              مدل‌های ورودی و خروجی Pydantic
│  ├─ app/models/               مدل‌های SQLModel و engine/session
│  ├─ app/services/             ساخت تراکنشی حرکت موجودی
│  ├─ app/utils/                JWT، تنظیم محیط و نرمال‌سازی دسته
│  ├─ app/tests/                آزمون‌های pytest و fixture پایگاه داده
│  ├─ Dockerfile[.dev] و requirements.txt
├─ frontend/
│  ├─ src/main.jsx، App.jsx، index.css
│  ├─ src/router/               تعریف route و guardها
│  ├─ src/pages/                صفحه‌های کاربر، محصول، انبار، حرکت و گزارش
│  ├─ src/components/           Navbar، جدول‌ها، فیلتر، pagination و feedback
│  ├─ src/context/              AuthProvider و useAuth
│  ├─ src/hooks/                فرم‌ها، درخواست انبار، دسته و WebSocket
│  ├─ src/api/                  توابع fetch حوزه‌ای
│  ├─ src/i18n/                 واژه‌های فارسی و تبدیل خطا/نمایش
│  ├─ src/utils/                فرم، ناوبری، export و قالب‌بندی
│  ├─ tests/                    آزمون‌های Node برای localization، محصول و انبار
│  ├─ public/fonts/             قلم Vazirmatn
│  ├─ Dockerfile[.dev]، nginx.conf، vite.config.js، eslint.config.js
├─ db_init/                      ساخت ۷ جدول و trigger؛ seed اولیه و دادهٔ نمونه
├─ docs/                         راهنماهای موجود، تصویرها و این onboarding
├─ docker-compose.yml            stack تولیدی تعریف‌شده
├─ docker-compose.dev.yml        stack توسعه و db_test اختیاری
├─ .env.template                 نام تنظیم‌ها؛ مقدارهای واقعی در .env
├─ README.md و CONTRIBUTING.md   اسناد قبلی؛ با اجرا سنجیده شوند
└─ .gitignore، LICENSE
```

`db_init/01_db_tables_trigger.sql:5-139` schema SQL و trigger را تعریف می‌کند؛ `02_insert_initial_data.sql` و `03_seed_stock_data.sql` دادهٔ اولیه/نمونه درج می‌کنند. این داده‌ها فقط هنگام ساخت volume تازه در Compose اجرا می‌شوند (`docker-compose.yml:23`). `frontend/src/i18n/fa.js` متن‌های فارسی را نگه می‌دارد، `index.js` تابع `t` را ارائه می‌کند و `errors.js` خطاهای API را محلی‌سازی می‌کند. `frontend/src/App.jsx:13` ریشهٔ `lang` و `dir` را اعمال می‌کند.

**تأییدشده:** در زمان این بررسی، تغییرهای commit نشده در صفحه‌ها، hookها، utilityها، testها و `frontend/package.json` مربوط به warehouse وجود داشت. این سند کد فعلی را توصیف می‌کند؛ رفتار نسخهٔ commit شده ممکن است فرق کند. `git status --short` پیش از مطالعهٔ تغییرهای آینده دوباره بررسی شود.
