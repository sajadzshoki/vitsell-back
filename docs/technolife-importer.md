# Technolife Product Importer

Internal importer that fetches selected Technolife product pages and creates/updates Vitsell catalog products through existing listing domain logic.

## Audit findings (Phase 1)

| Topic | Finding |
| --- | --- |
| Stack | AdonisJS 7 + Lucid + Postgres; single-tenant admin under `/api/v1/seller` |
| Product create | `POST /seller/listings` → `SellerController.storeListing` / `ListingWriteService` |
| Price unit | **تومان** integer (`bigInteger`). Zarinpal converts ×10 to ریال |
| Technolife price | JSON-LD `priceCurrency: IRR` (ریال) → store as `Math.round(rial / 10)` تومان |
| Variants | JSON on `products.variants` + `variantAxes` (not separate table) |
| Specs | `products.specs: { key, value }[]` |
| Brand | `brands` table + `products.brand` as **name string** (not FK) |
| Category | `products.category` = category id (mobile phones → `mobile`) |
| Media | Drive (`fs`/`s3`); multipart upload only — importer downloads then `saveMediaBuffer` |
| Inventory | `SellerListing.stock` authoritative; Technolife availability is informational only |
| Source metadata | Added: `source`, `source_url`, `source_product_id`, `source_imported_at`, `source_updated_at` |
| Jobs/queues | **None** — sequential in-process worker + Ace CLI |
| Auth | Bearer + `role === 'admin'`; FE RBAC uses `products.import` |
| HTTP | Native `fetch` |

## Architecture

```text
Technolife URL
  → URL validate (SSRF / allowlist)
  → TechnolifeClient (fetch, retry, delay)
  → TechnolifeParser (JSON-LD → HTML fallbacks)
  → Normalizer (Persian text, price IRR→toman)
  → Brand / category mappers
  → Duplicate detection
  → (optional) image download → Drive + MediaAsset
  → ListingWriteService (same rules as seller listings)
  → ProductImportBatch / ProductImportItem history
```

## Configuration

```env
TECHNOLIFE_ENABLED=true
TECHNOLIFE_REQUEST_DELAY_MS=1500
TECHNOLIFE_TIMEOUT_MS=15000
TECHNOLIFE_MAX_RETRIES=3
TECHNOLIFE_CONCURRENCY=1
TECHNOLIFE_DEFAULT_CATEGORY_ID=mobile
TECHNOLIFE_UPDATE_PRICE=false
TECHNOLIFE_UPDATE_INVENTORY=false
TECHNOLIFE_UPDATE_DESCRIPTION=true
TECHNOLIFE_UPDATE_IMAGES=true
TECHNOLIFE_UPDATE_SPECS=true
```

## Import modes

| Mode | Behavior |
| --- | --- |
| `preview` / dry-run | Parse + normalize; no catalog writes |
| `create_only` | Create if no duplicate; skip existing |
| `upsert` | Create or update per field policy flags |

Safe defaults: do **not** overwrite price or inventory on update.

## Duplicate strategy

1. `source = technolife` + `source_product_id`
2. `source_url` (normalized)
3. Product id `tl-{sourceProductId}`
4. `sku` match when present
5. Brand name + normalized model heuristic (warning only if weak)

## CLI

```bash
node ace technolife:import <url>
node ace technolife:import --file=urls.txt
node ace technolife:import --dry-run <url>
node ace technolife:import --mode=upsert <url>
```

## Admin API

| Method | Path |
| --- | --- |
| POST | `/api/v1/seller/importers/technolife/preview` |
| POST | `/api/v1/seller/importers/technolife/import` |
| GET | `/api/v1/seller/importers/technolife/imports` |
| GET | `/api/v1/seller/importers/technolife/imports/:id` |
| POST | `/api/v1/seller/importers/technolife/imports/:id/retry` |

## Admin UI

`/seller/importer/technolife` — paste URLs, preview, import, poll batch status.

## Pricing

Technolife JSON-LD exposes **IRR**. Vitsell stores **تومان**. Conversion is explicit ÷10; no other FX.

## Inventory

Technolife in-stock / out-of-stock is stored on the import item as informational availability. Listing stock defaults to `0` unless `updateInventory` is enabled (still does not copy Technlife quantities).

## Security

- Allowlist: `technolife.ir`, `www.technolife.ir`, `technolife.com`, `www.technolife.com`
- Block `file://`, localhost, private IPs, link-local, cloud metadata hosts
- Admin auth required
- Permission: `products.import` (FE); API still requires admin role

## Rate limiting

Sequential requests (`CONCURRENCY=1`), configurable delay, timeout, exponential backoff retries for transient HTTP failures only. No CAPTCHA/anti-bot bypass.

## Testing

- Unit: parser, persian normalize, price, URL SSRF, duplicate helpers (fixtures under `tests/fixtures/technolife/`)
- Do not hit live Technolife in CI

## Known limitations (v1)

- Optimized for mobile phones (`category` → `mobile`)
- Variant axes imported only when page exposes clear selectable options
- No Redis/Bull queue — background `void processBatch()`
- HTML description sanitized to a small tag allowlist
- Specs are free-form `{ key, value }` (category spec keys upserted)

## Extending to another marketplace

Add a sibling package under `app/services/<source>/` implementing fetch → parse → normalize, then reuse `ListingWriteService`, duplicate helpers, and import history tables (`source` column).
