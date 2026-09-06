# Digishop Backend — Deploy

راهنمای کامل دیپلوی **فرانت + بک** در ریپوی فرانت:

→ [`../digishop/DEPLOY.md`](../digishop/DEPLOY.md)

اگر مسیر نسبی در محیط شما فرق دارد، همان فایل `DEPLOY.md` داخل ریپوی `digishop` را باز کنید.

## خلاصه سریع Production API

```bash
# .env: NODE_ENV=production, ALLOW_OTP_MOCK=false, ALLOW_PAYMENT_MOCK=false
# + KAVENEGAR_API_KEY + ZARINPAL_MERCHANT_ID + APP_KEY + DB_*
# + FRONTEND_URL + ADMIN_URL (اجباری برای لاگین پنل ادمین)

npm ci
node ace migration:run
npm run build
cd build && npm ci --omit=dev && node bin/server.js
```

### دامنه‌های vistatest (نمونه)

روی سرور API حتماً این‌ها را در `.env` بگذارید و سرویس را ری‌استارت کنید:

```env
NODE_ENV=production
APP_URL=https://digishop-back.vistatest.top
FRONTEND_URL=https://digishop.vistatest.top
ADMIN_URL=https://digishop-admin.vistatest.top
```

`ADMIN_URL` باید **دقیقاً** origin پنل ادمین باشد (با `https`، بدون `/` انتهایی).  
اگر روی `http://localhost:4001` مانده باشد، از `https://digishop-admin.vistatest.top` لاگین با خطای  
«ورود مدیر فقط از دامنه پنل ادمین مجاز است» رد می‌شود.

سید **`09121234567` را دیگر به‌عنوان admin نمی‌سازد** — اولین ادمین را دستی بسازید (role=`admin`).

بعد از تغییر: `docker compose restart api` یا ری‌استارت process Node.

Dev با Docker:

```bash
docker compose up -d --build
# API http://localhost:3333  |  Postgres host port 15432
```




docker rm -f digishop-api
docker compose build --no-cache api
docker compose up -d --force-recreate api
docker network connect main digishop-api