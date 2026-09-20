# Technolife Product Importer

Internal importer that fetches selected Technolife product pages and creates/updates Vitsell catalog products through existing listing domain logic.

## Audit findings (Phase 1)

| Topic | Finding |
| --- | --- |
| Stack | AdonisJS 7 + Lucid + Postgres; single-tenant admin under `/api/v1/seller` |
| Product create | `POST /seller/listings` → `SellerController.storeListing` / `ListingWriteService` |
| Price unit | **تومان** integer (`bigInteger`). Zarinpal converts ×10 to ریال |
| Technolife price | Next state `discounted_price` is the same integer rendered as تومان; JSON-LD's `IRR` label is currently incorrect |
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
  → TechnolifeParser (__NEXT_DATA__ → JSON-LD/HTML fallbacks)
  → Normalizer (Persian text, safe rich review HTML, تومان)
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
TECHNOLIFE_MAX_IMAGES=20
TECHNOLIFE_DEFAULT_STOCK=10
TECHNOLIFE_DEFAULT_CATEGORY_ID=mobile
TECHNOLIFE_DEFAULT_CATEGORY_URL=https://www.technolife.com/category/mobile/mobile-phone
TECHNOLIFE_MAX_CATEGORY_IMPORT=2000
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

## Category import

Pass a Technolife category URL (with optional filters) or a numeric limit.
Discovery uses the public `shop_plp` GraphQL list (`get_menu_products`) with the same
`filterObj` as the site (`brand_filters` from `manufacturer_id`, `attribute_filters` from `af`).

```bash
# Import 20 products from the default category URL
npm run technolife:import -- 20
node ace technolife:import 20

# Explicit category + limit
node ace technolife:import --category="https://www.technolife.com/category/mobile/mobile-phone?manufacturer_id=26&af=195" --limit=20
node ace technolife:import "https://www.technolife.com/category/mobile/mobile-phone" --limit=10
```

Hard cap: `TECHNOLIFE_MAX_CATEGORY_IMPORT` (default **2000**, max 5000).
The CLI numeric arg / `--limit` is honored up to that ceiling.

## Duplicate strategy

1. `source = technolife` + `source_product_id`
2. `source_url` (normalized)
3. Product id `tl-{sourceProductId}`
4. `sku` match when present
5. Brand name + normalized model heuristic (warning only if weak)

## CLI

```bash
node ace technolife:import 20
node ace technolife:import <product-url>
node ace technolife:import <category-url> --limit=20
node ace technolife:import --category=<category-url> --limit=20
node ace technolife:import --file=urls.txt
node ace technolife:import --dry-run <url>
node ace technolife:import --mode=upsert <url>
node ace technolife:import --mode=upsert --update-all 20
node ace products:clear --force
node ace products:clear --technolife-only --force
```

NPM shortcuts: `technolife:preview`, `technolife:import`, `technolife:import:file`, `technolife:update`,
`technolife:refresh`, `technolife:refresh-source`, `technolife:clear`, and `products:clear`.
Product clearing is refused when `NODE_ENV=production`.

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

Technolife's Next state exposes `price` and `discounted_price` as the exact integers rendered
with **تومان** on the page. The importer therefore stores those values unchanged. JSON-LD is
only a fallback because its current `priceCurrency: IRR` label conflicts with the visible page.

## Inventory

The selected offer's `in_stock` quantity is copied when present. If the product is available but
no reliable quantity exists, listing stock defaults to `TECHNOLIFE_DEFAULT_STOCK` (`10`); an
explicitly unavailable product gets `0`.

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

- Variant axes imported from Technolife color options (+ storage from specs when present)
- No Redis/Bull queue — background `void processBatch()`
- HTML description sanitized to a small tag allowlist
- Specs keep Technolife group titles in `{ key, value, group? }` and render as storefront sections
  (برند + حافظه / دوربین / …). Re-import with upsert + specs update to refresh older flat rows.

## Taxonomy auto-create

On import the mapper ensures a **general** tree and wires the product to the brand leaf:

```text
موبایل (root)
  └─ شیائومی / اپل / سامسونگ (brand category)
```

SKU-level names (`Redmi 13C 256/8`, `iPhone 16 Pro Max 256GB`, …) are **not** categories.
They become product tags via a coarse line when recognized (`Redmi Note`, `Galaxy A`, `iPhone Pro Max`).

Missing roots, brand categories, brands, and variant attributes (`رنگ`, `حافظه داخلی`)
are still created automatically.

## Extending to another marketplace

Add a sibling package under `app/services/<source>/` implementing fetch → parse → normalize, then reuse `ListingWriteService`, duplicate helpers, and import history tables (`source` column).
