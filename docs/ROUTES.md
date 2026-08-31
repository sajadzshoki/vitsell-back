# مستند Routeهای API — Digishop Back

منبع حقیقت: `start/routes.ts`  
مستند کامل (فرانت + API): [`digishop-front/docs/ROUTES.md`](../../digishop-front/docs/ROUTES.md)

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
| `GET` | `/uploads/:file` | — *(خارج از prefix api)* |
| `GET` | `/home` | — |
| `GET` | `/recommendations` | اختیاری | پیشنهاد شخصی‌سازی‌شده |
| `POST` | `/activity` | ✅ | ثبت فعالیت کاربر |
| `POST` | `/activity/sync` | ✅ | همگام رویدادهای لوکال |
| `GET` | `/locations` | — |
| `GET` | `/compare/templates/:category` | — |
| `GET` | `/footer` | — |
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
| `GET\|POST` | `/seller/listings` | ✅ admin | لیست / افزودن محصول |
| `PATCH` | `/seller/listings/:productId` | ✅ admin | وضعیت محصول |
| `GET` | `/seller/orders` | ✅ admin | سفارش‌ها |
| `GET` | `/seller/orders/:id` | ✅ admin | جزئیات سفارش |
| `PATCH` | `/seller/orders/:id/status` | ✅ admin | تغییر وضعیت سفارش |
| `GET` | `/seller/reviews` | ✅ admin | نظرات |
| `POST` | `/seller/reviews/:id/reply` | ✅ admin | پاسخ به نظر |
| `GET` | `/seller/payouts` | ✅ admin | تسویه‌ها |
| `GET` | `/seller/sales` | ✅ admin | نمودار فروش |
