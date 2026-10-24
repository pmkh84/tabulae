-- Localize only untouched rows from the original demo seed.
-- Review 20261021_002_persian_demo_data_preview.sql first.
-- Run against an existing database only after separate approval.
-- Re-running this migration is safe: translated rows no longer match old values.
BEGIN;

SET LOCAL lock_timeout = '5s';

WITH demo (id, email, password, role, is_active, old_name, new_name) AS (
VALUES
    (1, 'alice@example.com', '$2a$12$h1YMx6rEJDJ6atDWydlVGObCgOPfrgB5YxGgLE1fqm3/ebWmGkMRm', 'admin', TRUE, 'Alice Smith', 'آلیس اسمیت'),
    (2, 'bob@example.com', '$2a$12$OC4NtH.0NnLnJLLjNvUA2uRg34dgKVN8li3Zi8aBtDDLYI8rPY2ba', 'user', TRUE, 'Bob Johnson', 'باب جانسون'),
    (3, 'charlie@example.com', '$2a$12$TCXanIk6qWqB79Byedo3SOE91oU3VVpA5mDBbdIvRWqGhY8Xd8/g.', 'user', FALSE, 'Charlie Lee', 'چارلی لی')
)
UPDATE "user" AS u
SET name = d.new_name
FROM demo AS d
WHERE u.id = d.id AND u.email = d.email AND u.password = d.password AND u.role = d.role AND u.is_active = d.is_active AND u.name = d.old_name;

WITH demo (id, is_active, old_name, new_name) AS (
VALUES
    (1, TRUE, 'Main Warehouse', 'انبار مرکزی'),
    (2, TRUE, 'North Store', 'فروشگاه شمال'),
    (3, TRUE, 'City Center Store', 'فروشگاه مرکز شهر'),
    (4, FALSE, 'South Outlet', 'شعبهٔ جنوب')
)
UPDATE warehouse AS w
SET name = d.new_name
FROM demo AS d
WHERE w.id = d.id AND w.is_active = d.is_active AND w.name = d.old_name;

WITH demo (id, old_name, new_name) AS (
VALUES
    (1, 'Video Games', 'بازی‌های ویدئویی'),
    (2, 'Books', 'کتاب‌ها'),
    (3, 'Collectible Figures', 'فیگورهای کلکسیونی'),
    (4, 'Board Games', 'بازی‌های رومیزی'),
    (5, 'Merchandise', 'محصولات جانبی')
)
UPDATE product_category AS c
SET name = d.new_name
FROM demo AS d
WHERE c.id = d.id AND c.name = d.old_name;

WITH demo (id, sku, category_id, is_active, old_name, old_description, new_name, new_description) AS (
VALUES
    (1, 'ZELDA01', 1, TRUE, 'Zelda: Breath of the Wild', 'Action-adventure game for Nintendo Switch', 'زلدا: نفس وحش', 'بازی اکشن و ماجراجویی برای نینتندو سوییچ'),
    (2, 'GOWR01', 1, TRUE, 'God of War Ragnarök', 'Action game for PlayStation 5', 'خدای جنگ: رگناروک', 'بازی اکشن برای پلی‌استیشن ۵'),
    (3, 'BOOK01', 2, TRUE, '1984 by George Orwell', 'Dystopian novel', '۱۹۸۴، اثر جورج اورول', 'رمانی پادآرمان‌شهری'),
    (4, 'BOOK02', 2, TRUE, 'The Magic Book Vol. 1', 'Fantasy book for young readers', 'کتاب جادویی، جلد ۱', 'کتابی فانتزی برای نوجوانان'),
    (5, 'FIG01', 3, TRUE, 'Iron Hero Funko Figure', 'Limited edition collectible figure', 'فیگور فانکو قهرمان آهنی', 'فیگور کلکسیونی با تولید محدود'),
    (6, 'BOARD01', 4, TRUE, '1000-piece Puzzle', 'Board game for the whole family', 'پازل ۱۰۰۰ تکه', 'سرگرمی رومیزی برای همهٔ اعضای خانواده'),
    (7, 'MERCH01', 5, TRUE, 'Retro Game T-Shirt M', 'Official themed T-shirt', 'تی‌شرت بازی رترو، سایز M', 'تی‌شرت رسمی با طرح بازی'),
    (8, 'FOOT24', 1, TRUE, 'Football League 2024', 'Multiplatform football video game', 'لیگ فوتبال ۲۰۲۴', 'بازی ویدئویی فوتبال برای چند پلتفرم'),
    (9, 'BOOK03', 2, TRUE, 'The Little Prince', 'Illustrated children’s book', 'شازده کوچولو', 'کتاب مصور کودکان'),
    (10, 'CHESS01', 4, TRUE, 'Wooden Chess Set', 'Classic strategy board game', 'مجموعه شطرنج چوبی', 'بازی رومیزی راهبردی کلاسیک'),
    (11, 'MERCH02', 5, TRUE, 'Hogwarts Hoodie L', 'Official fantasy-themed hoodie', 'هودی هاگوارتز، سایز L', 'هودی رسمی با طرح فانتزی'),
    (12, 'FIG02', 3, TRUE, 'Grogu Funko Figure', 'Collectible figure from space series', 'فیگور فانکو گروگو', 'فیگور کلکسیونی از مجموعه‌ای فضایی'),
    (13, 'BOARD02', 4, TRUE, 'Catan', 'Strategy board game', 'کاتان', 'بازی رومیزی راهبردی'),
    (14, 'MERCH03', 5, TRUE, 'Adventure Poster', 'Decorative fantasy-themed poster', 'پوستر ماجراجویی', 'پوستر تزئینی با طرح فانتزی'),
    (15, 'SPIDER02', 1, TRUE, 'Spider Hero 2', 'PlayStation 5 exclusive action game', 'قهرمان عنکبوتی ۲', 'بازی اکشن انحصاری پلی‌استیشن ۵'),
    (16, 'CARD01', 3, TRUE, 'Limited Edition Trading Card', 'Collectible card with special ink', 'کارت کلکسیونی نسخه محدود', 'کارت کلکسیونی با چاپ ویژه'),
    (17, 'MANGA01', 2, TRUE, 'Monthly Manga Magazine', 'Serialized manga issue', 'مجله ماهانه مانگا', 'شماره‌ای از مانگای دنباله‌دار'),
    (18, 'CARDPACK01', 4, TRUE, 'Trading Card Starter Pack', 'Beginner set for collectible card game', 'بسته آغازین کارت‌های کلکسیونی', 'مجموعه آغازین بازی با کارت‌های کلکسیونی'),
    (19, 'GUM01', 5, TRUE, 'Zelda-themed Chewing Gum', 'Promotional edible product', 'آدامس با طرح زلدا', 'خوراکی تبلیغاتی'),
    (20, 'BOX01', 5, TRUE, 'Surprise Box', 'Random contents with expiration date', 'جعبه شگفتی', 'جعبه‌ای با محتویات تصادفی و تاریخ انقضا'),
    (21, 'FOODFIG01', 3, TRUE, 'Mario Edible Figure', 'Cake topper with expiration', 'فیگور خوراکی ماریو', 'تزئین خوراکی کیک با تاریخ انقضا'),
    (22, 'SNACK01', 5, TRUE, 'Geek Popcorn', 'Limited edition themed snack', 'پاپ‌کورن گیک', 'میان‌وعده با طرح ویژه و تولید محدود'),
    (23, 'AGENDA01', 2, TRUE, '2024 Fantasy Agenda', 'Agenda with limited duration', 'سررسید فانتزی ۲۰۲۴', 'سررسید با دورهٔ استفاده محدود'),
    (24, 'ENERGY01', 5, TRUE, 'Energy Drink – Lightning Edition', 'Promo energy drink with expiration date', 'نوشیدنی انرژی‌زا، نسخه صاعقه', 'نوشیدنی انرژی‌زای تبلیغاتی با تاریخ انقضا'),
    (25, 'DUEL01', 3, TRUE, 'Card Pack – Duel Series', 'Sealed collectible card product', 'بسته کارت، مجموعه دوئل', 'بسته پلمب‌شده کارت‌های کلکسیونی'),
    (26, 'GUIDE01', 2, TRUE, 'Collector’s Manual 2023', 'Physical guide with limited content', 'راهنمای کلکسیونرها ۲۰۲۳', 'راهنمای چاپی با محتوای محدود'),
    (27, 'SNACK02', 5, TRUE, 'One Piece Snack', 'Geek-themed snack product', 'میان‌وعده وان‌پیس', 'میان‌وعده با طرح فرهنگ گیک'),
    (28, 'MAG01', 2, TRUE, 'Special Edition Magazine', 'Exclusive release with publication date', 'مجله نسخه ویژه', 'شماره ویژه با تاریخ انتشار'),
    (29, 'TIN01', 5, TRUE, 'Promotional Metal Tin', 'Collectible tin with candy inside', 'قوطی فلزی تبلیغاتی', 'قوطی کلکسیونی حاوی آب‌نبات'),
    (30, 'HOLIDAY01', 5, TRUE, 'Holiday Gift Box', 'Seasonal limited-time product', 'جعبه هدیه تعطیلات', 'محصول فصلی با عرضه محدود')
)
UPDATE product AS p
SET short_name = d.new_name, description = d.new_description
FROM demo AS d
WHERE p.id = d.id AND p.sku = d.sku AND p.category_id = d.category_id AND p.is_active = d.is_active AND p.short_name = d.old_name AND p.description = d.old_description;

COMMIT;
