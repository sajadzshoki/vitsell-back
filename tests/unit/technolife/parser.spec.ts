import { test } from '@japa/runner'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseTechnolifeHtml } from '#services/technolife/parser'
import { normalizeTechnolifeProduct } from '#services/technolife/normalizer'
import { normalizePersianText, toAsciiDigits, splitTechnolifeBrand } from '#services/technolife/persian'
import { rialToToman, normalizeToToman, parsePersianPriceToToman } from '#services/technolife/price'
import { validateTechnolifeUrl } from '#services/technolife/url'

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
    if (ok.ok) assert.equal(ok.sourceProductId, '12345')
  })

  test('blocks localhost and private hosts', ({ assert }) => {
    assert.isFalse(validateTechnolifeUrl('http://127.0.0.1/product-1/x').ok)
    assert.isFalse(validateTechnolifeUrl('http://192.168.1.1/product-1/x').ok)
    assert.isFalse(validateTechnolifeUrl('file:///etc/passwd').ok)
    assert.isFalse(validateTechnolifeUrl('https://evil.com/product-1/x').ok)
  })
})

test.group('Technolife parser fixture', () => {
  test('extracts product fields from JSON-LD', ({ assert }) => {
    const parsed = parseTechnolifeHtml(fixture, pageUrl)
    assert.equal(parsed.sourceProductId, '999001')
    assert.include(parsed.name || '', 'سامسونگ')
    assert.equal(parsed.brandFa, 'سامسونگ')
    assert.equal(parsed.priceRial, 599000000)
    assert.equal(parsed.oldPriceRial, 650000000)
    assert.equal(parsed.priceCurrency, 'IRR')
    assert.equal(parsed.availability, 'in_stock')
    assert.isAbove(parsed.images.length, 0)
    assert.isAbove(parsed.specs.length, 0)
    assert.isTrue(parsed.categoryPath.some((c) => /موبایل|گوشی/.test(c)))
  })

  test('normalizes to toman and suggested id', ({ assert }) => {
    const parsed = parseTechnolifeHtml(fixture, pageUrl)
    const n = normalizeTechnolifeProduct(parsed)
    assert.equal(n.priceToman, 59900000)
    assert.equal(n.oldPriceToman, 65000000)
    assert.equal(n.suggestedProductId, 'tl-999001')
    assert.equal(n.brandName, 'سامسونگ')
    assert.isTrue(n.specs.some((s) => s.key.includes('رم')))
  })
})
