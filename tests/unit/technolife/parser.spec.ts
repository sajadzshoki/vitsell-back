import { test } from '@japa/runner'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseTechnolifeHtml } from '#services/technolife/parser'
import { normalizeTechnolifeProduct, slugifyProductTitle } from '#services/technolife/normalizer'
import {
  normalizePersianText,
  toAsciiDigits,
  splitTechnolifeBrand,
} from '#services/technolife/persian'
import { rialToToman, normalizeToToman, parsePersianPriceToToman } from '#services/technolife/price'
import { validateTechnolifeUrl, validateTechnolifeCategoryUrl, validateTechnolifeInputUrl } from '#services/technolife/url'
import { buildCategoryFilterObj } from '#services/technolife/category_discover'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = readFileSync(join(dir, '../../fixtures/technolife/phone-s25.html'), 'utf8')
const pageUrl = 'https://www.technolife.ir/product-999001/galaxy-s25'

test.group('Technolife persian normalize', () => {
  test('converts persian/arabic digits and yeh/keh', ({ assert }) => {
    assert.equal(toAsciiDigits('۱۲۳'), '123')
    assert.equal(toAsciiDigits('٤٥'), '45')
    assert.equal(normalizePersianText('ك ag ي'), 'ک ag ی')
  })

  test('splits technolife brand pipe', ({ assert }) => {
    const b = splitTechnolifeBrand('سامسونگ|Samsung')
    assert.equal(b.fa, 'سامسونگ')
    assert.equal(b.en, 'Samsung')
    assert.equal(b.display, 'سامسونگ')
  })
})

test.group('Technolife price', () => {
  test('rial to toman is integer divide by 10', ({ assert }) => {
    assert.equal(rialToToman(599000000), 59900000)
    assert.equal(normalizeToToman(599000000, 'IRR'), 59900000)
    assert.equal(normalizeToToman(5_990_000, 'IRT'), 5990000)
    assert.isNull(normalizeToToman(599000000, null))
  })

  test('parses persian price text with currency', ({ assert }) => {
    assert.equal(parsePersianPriceToToman('۵۹۹,۰۰۰,۰۰۰ ریال'), 59900000)
    assert.equal(parsePersianPriceToToman('10,999,000 تومان'), 10999000)
  })
})

test.group('Technolife URL SSRF', () => {
  test('allows technolife product urls', ({ assert }) => {
    const ok = validateTechnolifeUrl('https://www.technolife.ir/product-12345/foo')
    assert.isTrue(ok.ok)
    if (ok.ok) {
      assert.equal(ok.sourceProductId, '12345')
      assert.equal(ok.kind, 'product')
    }
  })

  test('allows technolife category urls with filters', ({ assert }) => {
    const ok = validateTechnolifeCategoryUrl(
      'https://www.technolife.com/category/mobile/mobile-phone?manufacturer_id=26&af=195'
    )
    assert.isTrue(ok.ok)
    if (ok.ok) {
      assert.equal(ok.kind, 'category')
      assert.isNull(ok.sourceProductId)
      assert.include(ok.normalized, 'manufacturer_id=26')
      assert.include(ok.normalized, 'af=195')
    }
  })

  test('input validator accepts product or category', ({ assert }) => {
    const product = validateTechnolifeInputUrl('https://www.technolife.com/product-1/x')
    const category = validateTechnolifeInputUrl('https://www.technolife.com/category/mobile/mobile-phone')
    assert.isTrue(product.ok)
    assert.isTrue(category.ok)
    if (product.ok) assert.equal(product.kind, 'product')
    if (category.ok) assert.equal(category.kind, 'category')
  })

  test('blocks localhost and private hosts', ({ assert }) => {
    assert.isFalse(validateTechnolifeUrl('http://127.0.0.1/product-1/x').ok)
    assert.isFalse(validateTechnolifeUrl('http://192.168.1.1/product-1/x').ok)
    assert.isFalse(validateTechnolifeUrl('file:///etc/passwd').ok)
    assert.isFalse(validateTechnolifeUrl('https://evil.com/product-1/x').ok)
  })
})

test.group('Technolife category filters', () => {
  test('maps manufacturer_id and af into filterObj', ({ assert }) => {
    const url = new URL(
      'https://www.technolife.com/category/mobile/mobile-phone?manufacturer_id=26&af=195&only_available=true'
    )
    const filter = buildCategoryFilterObj(url, 20)
    assert.equal(filter.page_type, 'dynamic')
    assert.equal(filter.limit, 20)
    assert.deepEqual(filter.brand_filters, [26])
    assert.deepEqual(filter.attribute_filters, [195])
    assert.isTrue(filter.available)
  })

  test('sets skip for pagination pages', ({ assert }) => {
    const url = new URL('https://www.technolife.com/category/mobile/mobile-phone')
    const filter = buildCategoryFilterObj(url, 30, 2)
    assert.equal(filter.skip, 2)
    assert.equal(filter.limit, 30)
  })
})

test.group('Technolife parser fixture', () => {
  test('prefers current Next state product fields', ({ assert }) => {
    const parsed = parseTechnolifeHtml(fixture, pageUrl)
    assert.equal(parsed.sourceProductId, '999001')
    assert.include(parsed.name || '', 'سامسونگ')
    assert.equal(parsed.brandFa, 'سامسونگ')
    assert.equal(parsed.priceAmount, 64590000)
    assert.equal(parsed.oldPriceAmount, 67499000)
    assert.equal(parsed.priceCurrency, 'IRT')
    assert.equal(parsed.availability, 'in_stock')
    assert.equal(parsed.stock, 7)
    assert.equal(parsed.images.length, 2)
    assert.isFalse(parsed.images.some((image) => image.includes('/video/hls/')))
    assert.equal(parsed.reviewImages.length, 1)
    assert.equal(parsed.specs.length, 3)
    assert.isTrue(parsed.categoryPath.some((c) => /موبایل|گوشی/.test(c)))
  })

  test('keeps Technolife toman, sanitizes review, and derives title slug', ({ assert }) => {
    const parsed = parseTechnolifeHtml(fixture, pageUrl)
    const n = normalizeTechnolifeProduct(parsed)
    assert.equal(n.priceToman, 64590000)
    assert.equal(n.oldPriceToman, 67499000)
    assert.equal(
      n.suggestedProductId,
      'گوشی-موبایل-سامسونگ-مدل-galaxy-s25-ultra-ظرفیت-256-گیگابایت-رم-12-گیگابایت'
    )
    assert.equal(n.shortName, 'Samsung Galaxy S25 Ultra 256GB')
    assert.equal(n.brandName, 'سامسونگ')
    assert.equal(n.stock, 7)
    assert.include(n.description || '', '<h2>بررسی کامل گلکسی S25</h2>')
    assert.include(n.description || '', '<img ')
    assert.notInclude(n.description || '', '<script')
    assert.isTrue(n.specs.some((s) => /رم|RAM/i.test(s.key)))
  })

  test('does not cap structured specifications at 60 rows', ({ assert }) => {
    const match = fixture.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    assert.exists(match?.[1])
    const next = JSON.parse(match![1]!)
    const data = next.props.pageProps.dehydratedState.queries[0].state.data
    data.product_review = '<p>بررسی محصول</p>'
    data.configurations_component = [
      {
        title: 'کامل',
        info: Array.from({ length: 75 }, (_, index) => ({
          item: `ویژگی ${index + 1}`,
          value: `مقدار ${index + 1}`,
        })),
      },
    ]
    const html = fixture.replace(match![1]!, JSON.stringify(next))
    const parsed = parseTechnolifeHtml(html, pageUrl)
    assert.equal(parsed.specs.length, 75)
  })

  test('creates normalized Persian title slugs', ({ assert }) => {
    assert.equal(
      slugifyProductTitle('  گوشی موبایل اپل iPhone 17 CH/A  '),
      'گوشی-موبایل-اپل-iphone-17-ch-a'
    )
  })
})
