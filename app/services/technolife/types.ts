export type TechnolifeImportErrorCode =
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'INVALID_PRODUCT'
  | 'DUPLICATE'
  | 'IMAGE_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'UNSUPPORTED_VARIANT'
  | 'SSRF_BLOCKED'
  | 'DISABLED'

export type TechnolifeAvailability = 'in_stock' | 'out_of_stock' | 'unknown'

export type TechnolifeSpec = {
  key: string
  value: string
  /** Technolife configurations_component group title (e.g. حافظه، دوربین) */
  group?: string
}

export type TechnolifeVariantOption = {
  axis: string
  label: string
  value?: string
}

export type TechnolifeColor = {
  name: string
  hex: string
  image?: string
}

export type TechnolifeParsedProduct = {
  sourceUrl: string
  sourceProductId: string | null
  name: string | null
  brandRaw: string | null
  brandFa: string | null
  brandEn: string | null
  model: string | null
  description: string | null
  reviewHtml: string | null
  reviewImages: string[]
  shortDescription: string | null
  priceAmount: number | null
  oldPriceAmount: number | null
  priceCurrency: string | null
  discountPercent: number | null
  availability: TechnolifeAvailability
  availabilityText: string | null
  stock: number | null
  images: string[]
  colors: TechnolifeColor[]
  specs: TechnolifeSpec[]
  variants: TechnolifeVariantOption[]
  categoryPath: string[]
  sku: string | null
}

export type TechnolifeNormalizedProduct = {
  source: 'technolife'
  sourceUrl: string
  sourceProductId: string | null
  title: string
  shortName: string | null
  brandName: string
  model: string | null
  description: string | null
  shortDesc: string | null
  /** Integer تومان */
  priceToman: number | null
  oldPriceToman: number | null
  discountPercent: number | null
  availability: TechnolifeAvailability
  availabilityText: string | null
  stock: number
  images: string[]
  reviewImages: string[]
  colors: TechnolifeColor[]
  specs: TechnolifeSpec[]
  variants: TechnolifeVariantOption[]
  categoryHints: string[]
  sku: string | null
  suggestedProductId: string | null
}

export type TechnolifeDuplicateMatch = {
  productId: string
  reason: string
}

export type TechnolifePreviewResult = {
  url: string
  parsed: TechnolifeParsedProduct | null
  normalized: TechnolifeNormalizedProduct | null
  brand: { id: string | null; name: string; created: boolean } | null
  category: { id: string; label: string } | null
  duplicate: TechnolifeDuplicateMatch | null
  warnings: string[]
  error: { code: TechnolifeImportErrorCode; message: string } | null
}

export type TechnolifeImportItemResult = TechnolifePreviewResult & {
  status: 'pending' | 'processing' | 'success' | 'partial' | 'duplicate' | 'failed'
  productId: string | null
  imagesImported: string[]
  fieldsChanged: string[]
}
