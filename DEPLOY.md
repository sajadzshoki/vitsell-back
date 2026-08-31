# Digishop Backend — Deploy

راهنمای کامل دیپلوی **فرانت + بک** در ریپوی فرانت:

→ [`../digishop/DEPLOY.md`](../digishop/DEPLOY.md)

اگر مسیر نسبی در محیط شما فرق دارد، همان فایل `DEPLOY.md` داخل ریپوی `digishop` را باز کنید.

## خلاصه سریع Production API

```bash
# .env: NODE_ENV=production, ALLOW_OTP_MOCK=false, ALLOW_PAYMENT_MOCK=false
# + KAVENEGAR_API_KEY + ZARINPAL_MERCHANT_ID + APP_KEY + DB_*

npm ci
node ace migration:run
npm run build
cd build && npm ci --omit=dev && node bin/server.js
```

Dev با Docker:

```bash
docker compose up -d --build
# API http://localhost:3333  |  Postgres host port 5433
```
