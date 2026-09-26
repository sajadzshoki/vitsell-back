# vitsell Backend — Deploy

راهنمای کامل دیپلوی **فرانت + بک** در ریپوی فرانت:

→ [`../vitsell/DEPLOY.md`](../vitsell/DEPLOY.md)

اگر مسیر نسبی در محیط شما فرق دارد، همان فایل `DEPLOY.md` داخل ریپوی `vitsell` را باز کنید.

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

### دامنه‌های production (vitsell)

روی سرور API حتماً این‌ها را در `.env` بگذارید و سرویس را ری‌استارت کنید:

```env
NODE_ENV=production
APP_URL=https://api.vitsell.ir
FRONTEND_URL=https://vitsell.ir
ADMIN_URL=https://seller.vitsell.ir
```

`ADMIN_URL` باید **دقیقاً** origin پنل ادمین باشد (همان scheme: `http` یا `https`، بدون `/` انتهایی).  
اگر با دامنهٔ اشتباه باشد، لاگین ادمین با `403` رد می‌شود.

### Docker روی سرور — نکته حیاتی

`docker compose restart` متغیرهای env را عوض **نمی‌کند**. بعد از ویرایش `.env` / compose:

```bash
# ببینید داخل کانتینر واقعاً چه ADMIN_URL یی لود شده:
docker exec digishop-api printenv ADMIN_URL NODE_ENV FRONTEND_URL APP_URL

# باید ببینید:
# ADMIN_URL=https://seller.vitsell.ir

# اگر هنوز دامنهٔ قدیمی است:
docker compose -f docker-compose.prod.yml up -d --force-recreate --build api
# یا با همان compose فعلی‌تان:
docker rm -f digishop-api
docker compose up -d --force-recreate --build api
docker network connect main digishop-api   # اگر از شبکهٔ خارجی nginx استفاده می‌کنید
```

در `docker-compose` بخش `environment:` مقدارهای `ADMIN_URL` / `FRONTEND_URL` / `APP_URL` / `NODE_ENV` را **override** می‌کند و `.env` را بی‌اثر می‌کند.  
برای production از `docker-compose.prod.yml` استفاده کنید (URL فقط از `.env`) یا آن کلیدها را از بلوک `environment` حذف کنید.

`.env` پیشنهادی:

```env
NODE_ENV=production
APP_URL=https://api.vitsell.ir
FRONTEND_URL=https://vitsell.ir
ADMIN_URL=https://seller.vitsell.ir
APP_VERSION=beta.0.1
```

`FRONTEND_URL` همان آدرسی است که بعد از زرین‌پال کاربر به آن برمی‌گردد (`/cart` یا `/order/...`). **هرگز `localhost` نگذارید** — در غیر این صورت مرورگر خریدار به لوکال سیستم خودش می‌رود. فرانت هنگام پرداخت `returnOrigin` هم می‌فرستد تا اگر `FRONTEND_URL` اشتباه لوپ‌بک باشد، به همان دامنهٔ فروشگاه برگردد.

Health check (بدون DB): `GET /health` → `{ "status": "ok", "version": "<APP_VERSION>" }`  
در Docker Compose برای سرویس `api` هم همین مسیر به‌عنوان `healthcheck` ست شده است.

سید **`09121234567` را دیگر به‌عنوان admin نمی‌سازد** — اولین ادمین را دستی بسازید (role=`admin`).

Dev لوکال:

```bash
docker compose up -d --build
# API http://localhost:3333  |  Postgres host port 15432
```
