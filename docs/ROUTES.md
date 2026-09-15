# مستند Routeهای API — vitsell Back

منبع حقیقت: `start/routes.ts`  
مستند کامل (فرانت + API): [`vitsell-front/docs/ROUTES.md`](../../vitsell-front/docs/ROUTES.md)

**Prefix:** `/api/v1`  
**Auth:** `Authorization: Bearer <token>`

## Auth

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/auth/otp/request` | — |
| `POST` | `/auth/otp/verify` | — |
| `POST` | `/auth/check` | — | فروشگاه: وضعیت رمز (ادمین رد می‌شود) |
| `POST` | `/auth/login` | — | فروشگاه: ورود مشتری |
| `POST` | `/auth/admin/check` | — | پنل ادمین: چک شماره مدیر |
| `POST` | `/auth/admin/login` | — | پنل ادمین: ورود فقط admin + Origin=`ADMIN_URL` |
| `POST` | `/auth/password/reset` | — |
| `GET` | `/auth/me` | ✅ |
| `POST` | `/auth/logout` | ✅ |

## Catalog & content

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/categories` | — |
| `GET` | `/categories/:id` | — |
| `GET` | `/category-pages/:id` | — |
| `GET` | `/products` | — |
| `GET` | `/products/:id` | — |
| `GET` | `/products/:id/reviews` | — |
| `POST` | `/products/:id/reviews` | ✅ |
| `GET` | `/products/:id/questions` | — |
| `POST` | `/products/:id/questions` | ✅ |
| `POST` | `/upload` | ✅ |
| `GET` | `/uploads/:file` | — | سرو فایل از Drive (MinIO bucket `vitsell` یا `fs`) — خارج از `/api/v1` |
| `GET` | `/home` | — |
| `GET` | `/recommendations` | اختیاری | پیشنهاد شخصی‌سازی‌شده |
| `POST` | `/activity` | ✅ | ثبت فعالیت کاربر |
| `POST` | `/activity/sync` | ✅ | همگام رویدادهای لوکال |
| `GET` | `/locations` | — |
| `GET` | `/compare/templates/:category` | — |
| `GET` | `/site` | — | تنظیمات هویت سایت |
| `GET` | `/footer` | — |
| `GET` | `/navigation` | — | منوی سریع و bottom nav |
| `GET` | `/seo` | — | تنظیمات سئوی سراسری (عمومی) |
| `GET` | `/seo/redirects` | — | ریدایرکت‌های فعال (عمومی) |
| `GET` | `/discount-codes` | — |
| `GET` | `/blog` | — |
| `GET` | `/blog/:id` | — |
| `GET` | `/static-pages/:id` | — |

## Cart / wishlist / account / checkout (auth مگر خلافش گفته شود)

| Method | Path |
|--------|------|
| `GET\|POST\|DELETE` | `/cart` |
| `PATCH\|DELETE` | `/cart/:productId` |
| `GET\|POST` | `/wishlist` |
| `DELETE` | `/wishlist/:productId` |
| `GET\|PUT` | `/account/profile` |
| `PUT` | `/account/password` |
| `GET\|POST` | `/account/addresses` |
| `PUT\|DELETE` | `/account/addresses/:id` |
| `GET` | `/account/orders` |
| `GET` | `/account/orders/:id` |
| `GET` | `/account/reviews` |
| `GET` | `/account/wallet` |
| `POST` | `/account/wallet/topup` |
| `POST` | `/account/wallet/withdraw` |
| `GET` | `/payments/zarinpal/wallet-callback` *(بدون auth)* |
| `GET` | `/payments/zarinpal/callback` *(بدون auth)* |

## Notifications & seller (auth)

| Method | Path |
|--------|------|
| `GET` | `/notifications` |
| `POST` | `/notifications/:id/read` |
| `POST` | `/notifications/read-all` |
| `GET\|PUT` | `/seller/shop` | ✅ admin | تنظیمات سایت (نه فروشگاه چندمستاجره) |
| `GET\|PUT` | `/seller/footer` | ✅ admin | محتوای فوتر سایت |
| `GET\|POST` | `/seller/listings` | ✅ admin | لیست / افزودن محصول |
| `GET` | `/seller/listings/:productId` | ✅ admin | جزئیات listing + محصول |
| `PATCH` | `/seller/listings/:productId` | ✅ admin | وضعیت / موجودی / ویرایش محصول |
| `GET\|POST` | `/seller/categories` | ✅ admin | لیست کامل / ایجاد دسته |
| `GET\|PUT\|DELETE` | `/seller/categories/:id` | ✅ admin | جزئیات / ویرایش / حذف دسته |
| `GET\|POST` | `/seller/deals` | ✅ admin | لیست / ایجاد شگفت‌انگیز |
| `GET\|PUT\|DELETE` | `/seller/deals/:id` | ✅ admin | جزئیات / ویرایش / حذف شگفت‌انگیز |
| `PATCH` | `/seller/deals/:id/active` | ✅ admin | فعال/غیرفعال کردن |
| `GET\|POST` | `/seller/notifications` | ✅ admin | لیست کمپین / ارسال اعلان |
| `POST` | `/seller/notifications/preview` | ✅ admin | شمارش مخاطب |
| `GET` | `/seller/notification-users` | ✅ admin | لیست کاربران برای انتخاب |
| `DELETE` | `/seller/notifications/:id` | ✅ admin | حذف کمپین (+ اعلان‌های کاربران) |
| `GET\|POST` | `/seller/discount-codes` | ✅ admin | لیست / ایجاد کد تخفیف |
| `GET\|PUT\|DELETE` | `/seller/discount-codes/:code` | ✅ admin | جزئیات / ویرایش / حذف کد |
| `PATCH` | `/seller/discount-codes/:code/active` | ✅ admin | فعال/غیرفعال کردن کد |
| `GET\|POST` | `/seller/content-promos` | ✅ admin | لیست / ایجاد پروموی محتوایی |
| `GET\|PUT\|DELETE` | `/seller/content-promos/:id` | ✅ admin | جزئیات / ویرایش / حذف پرومو |
| `PATCH` | `/seller/content-promos/:id/active` | ✅ admin | فعال/غیرفعال کردن پرومو |
| `GET` | `/seller/orders` | ✅ admin | سفارش‌ها |
| `GET` | `/seller/orders/:id` | ✅ admin | جزئیات سفارش |
| `PATCH` | `/seller/orders/:id/status` | ✅ admin | تغییر وضعیت سفارش |
| `GET` | `/seller/reviews` | ✅ admin | نظرات |
| `POST` | `/seller/reviews/:id/reply` | ✅ admin | پاسخ به نظر |
| `GET` | `/seller/questions` | ✅ admin | پرسش‌های محصولات |
| `POST` | `/seller/questions/:id/reply` | ✅ admin | پاسخ به پرسش — body: `{ text, author? }` |
| `DELETE` | `/seller/questions/:id/answer` | ✅ admin | حذف پاسخ |
| `PATCH` | `/seller/questions/:id/verified` | ✅ admin | تأیید خریدار — body: `{ verified }` |
| `DELETE` | `/seller/questions/:id` | ✅ admin | حذف پرسش |
| `GET` | `/seller/payouts` | ✅ admin | تسویه‌ها |
| `POST` | `/seller/payouts` | ✅ admin | درخواست تسویه |
| `GET` | `/seller/sales` | ✅ admin | نمودار فروش |
