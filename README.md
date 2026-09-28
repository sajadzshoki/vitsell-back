# vitsell API (AdonisJS 7 + Lucid + Postgres)

Backend for [vitsell-front](../vitsell-front). Domain models and JSON shapes mirror `vitsell-front/app/data`.

## Stack

- AdonisJS 7
- Lucid ORM
- PostgreSQL 16
- Auth: phone OTP via **Kavenegar** (`verify/lookup`)
- Payments: **Zarinpal** v4 (`online`); `cod` / `installment` without gateway

## Requirements

- Node.js **>= 24**
- Docker (recommended) or local Postgres

## Quick start (Docker Desktop)

```bash
cd vitsell-back
docker compose up -d --build
```

- API: http://localhost:3333  
- Postgres: `localhost:5432` (user/pass/db: `vitsell`)

Containers: `vitsell-api`, `vitsell-postgres`

```bash
docker compose logs -f api   # logs
docker compose down          # stop
```

## Local without Docker API (Postgres still via compose)

```bash
docker compose up -d postgres
cp .env.example .env
npm install
node ace migration:run
# node ace db:seed   # optional / manual only — not run automatically
npm run dev
```

Refresh seed JSON from frontend mocks (manual):

```bash
cd ../vitsell-front
npx tsx scripts/export-seed-to-back.mts
cd ../vitsell-back
# node ace db:seed   # optional / manual only
```

## Env

| Variable | Purpose |
|----------|---------|
| `DB_*` | Postgres |
| `KAVENEGAR_API_KEY` / `KAVENEGAR_OTP_TEMPLATE` | OTP SMS (empty → code logged to console) |
| `KAVENEGAR_SENDER` | Sender line for plain order SMS (no lookup template) |
| `ZARINPAL_MERCHANT_ID` / `ZARINPAL_SANDBOX` / `ZARINPAL_CALLBACK_URL` | Payment (empty merchant → mock redirect) |
| `FRONTEND_URL` | Redirect after Zarinpal callback |

## Main routes (`/api/v1`)

- `POST /auth/otp/request` `{ phone }`
- `POST /auth/otp/verify` `{ phone, code }` → `{ token, profile }`
- `GET /auth/me` (Bearer)
- `GET /products`, `GET /products/:id`, reviews, questions
- `GET /categories`, `GET /home`
- Cart / wishlist / account / checkout (auth)
- `POST /checkout/place` → for `online`: `{ orderId, paymentUrl }`
- `GET /payments/zarinpal/callback`
- `GET|PUT /seller/*` (auth; requires `role=admin`)

## Frontend

Point vitsell-front `BASE_URL` to `http://localhost:3333/api/v1` and send `Authorization: Bearer <token>`.
