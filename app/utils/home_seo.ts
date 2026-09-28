import ContentBlock from '#models/content_block'

export const HOME_SEO_KEY = 'homeSeoBlocks'

export type HomeSeoBlock = {
  title: string
  paragraphs: string[]
  inlineLink?: { label: string, to: string }
}

export const defaultHomeSeoBlocks: HomeSeoBlock[] = [
  {
    title: 'فروشگاه اینترنتی ویتسل',
    paragraphs: [
      'ویتسل فروشگاه اینترنتی تخصصی محصولات دیجیتال و کالای مصرفی است؛ از گوشی موبایل و لپ‌تاپ تا لوازم خانگی و پوشاک. با تنوع برند، فیلتر دقیق، ارسال سریع و امکان خرید اقساطی، مسیر خرید آنلاین را ساده‌تر کرده‌ایم.',
    ],
  },
  {
    title: 'خرید انواع گوشی موبایل',
    paragraphs: [
      'در ویتسل می‌توانید انواع گوشی موبایل اپل، سامسونگ، شیائومی، آنر، گوگل و دیگر برندها را با گارانتی معتبر مقایسه و خریداری کنید. فیلترهای قیمت، حافظه، رم و امتیاز کاربران کمک می‌کند سریع‌تر به گزینه مناسب برسید. برای شروع،',
    ],
    inlineLink: { label: 'خرید گوشی موبایل', to: '/search/category-mobile' },
  },
  {
    title: 'لپ‌تاپ و تبلت برای کار و تحصیل',
    paragraphs: [
      'اگر به‌دنبال لپ‌تاپ دانشجویی، لپ‌تاپ گیمینگ یا تبلت سبک هستید، دسته‌بندی‌های لپ‌تاپ و تبلت ویتسل مدل‌های متنوعی از اپل، ایسوس، لنوو و سامسونگ را پوشش می‌دهد. مشخصات پردازنده، رم و نمایشگر را کنار هم ببینید و با خیال راحت انتخاب کنید.',
    ],
  },
  {
    title: 'ارسال سریع و ضمانت اصالت',
    paragraphs: [
      'اصالت کالا، امکان مرجوعی طبق قوانین فروشگاه و پشتیبانی پاسخ‌گو از اصول خرید در ویتسل است. سفارش‌های واجد شرایط در بازه‌های اعلام‌شده ارسال می‌شوند تا تجربه خرید آنلاین شفاف و قابل‌اطمینان باشد.',
    ],
  },
]

function asBlocks(value: unknown): HomeSeoBlock[] {
  if (!Array.isArray(value)) return []
  return value
    .map((raw) => {
      const title = String(raw?.title || '').trim()
      const paragraphs = Array.isArray(raw?.paragraphs)
        ? raw.paragraphs.map((item: unknown) => String(item || '').trim()).filter(Boolean)
        : []
      const label = String(raw?.inlineLink?.label || '').trim()
      const to = String(raw?.inlineLink?.to || '').trim()
      if (!title || !paragraphs.length) return null
      const block: HomeSeoBlock = { title, paragraphs }
      if (label && to) block.inlineLink = { label, to }
      return block
    })
    .filter((block): block is HomeSeoBlock => Boolean(block))
}

export async function loadHomeSeoBlocks(): Promise<HomeSeoBlock[]> {
  const row = await ContentBlock.find(HOME_SEO_KEY)
  const stored = asBlocks(row?.value)
  return stored.length ? stored : defaultHomeSeoBlocks
}

export async function saveHomeSeoBlocks(blocks: HomeSeoBlock[]) {
  const value = asBlocks(blocks)
  await ContentBlock.updateOrCreate(
    { key: HOME_SEO_KEY },
    { key: HOME_SEO_KEY, value },
  )
  return value
}
