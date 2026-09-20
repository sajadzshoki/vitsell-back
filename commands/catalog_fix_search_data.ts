import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Category from '#models/category'
import ContentBlock from '#models/content_block'
import Product from '#models/product'

const FIXED_HOME_CIRCLES = [
  {
    id: 'samsung-phone',
    title: 'گوشی سامسونگ',
    image: '/images/mock/galaxy-s25-ultra.jpg',
    to: '/search/category-mobile?brands=سامسونگ',
  },
  {
    id: 'smartwatch',
    title: 'ساعت هوشمند',
    image: '/images/mock/apple-watch-ultra.jpg',
    to: '/search/category-watch',
  },
  {
    id: 'iphone',
    title: 'گوشی آیفون',
    image: '/images/mock/iphone16pro-desert.jpg',
    to: '/product/iphone-16-pro',
  },
  {
    id: 'tablet',
    title: 'تبلت',
    image: '/images/mock/ipad-pro-m4.jpg',
    to: '/search/category-tablet',
  },
  {
    id: 'headphones',
    title: 'هدفون',
    image: '/images/mock/sony-xm5-midnight.jpg',
    to: '/search/category-audio?q=هدفون',
  },
  {
    id: 'console',
    title: 'کنسول بازی',
    image: '/images/mock/ps5-pro.jpg',
    to: '/search/category-gaming',
  },
  {
    id: 'laptop',
    title: 'لپ‌تاپ',
    image: '/images/mock/macbook-m4-spaceblack.jpg',
    to: '/search/category-laptop',
  },
  {
    id: 'xiaomi',
    title: 'شیائومی NFC کف قیمت بازار',
    image: '/images/mock/galaxy-s25-ultra.jpg',
    to: '/search/category-mobile?brands=شیائومی',
  },
]

export default class CatalogFixSearchData extends BaseCommand {
  static commandName = 'catalog:fix-search-data'
  static description =
    'Move mis-categorized tablets to tablet, ensure tablet category, refresh homeCircles links'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    let tablet = await Category.find('tablet')
    if (!tablet) {
      tablet = await Category.create({
        id: 'tablet',
        name: 'تبلت',
        icon: 'device-tablet',
        image: null,
        text: null,
        parentId: null,
        status: 'active',
        sortOrder: 15,
        seo: null,
        subs: [],
        pageMeta: null,
        suggested: null,
      })
      this.logger.info('Created category tablet')
    } else if (tablet.parentId) {
      tablet.parentId = null
      await tablet.save()
      this.logger.info('Re-rooted category tablet')
    }

    const tabletsInLaptop = await Product.query()
      .where('category', 'laptop')
      .where((builder) => {
        builder
          .whereILike('title', '%تبلت%')
          .orWhereILike('title', '%tablet%')
          .orWhereILike('title', '%iPad%')
          .orWhereILike('title', '%ipad%')
      })

    let moved = 0
    for (const product of tabletsInLaptop) {
      product.category = 'tablet'
      product.categoryLabel = tablet.name
      await product.save()
      moved++
    }
    this.logger.info(`Moved ${moved} tablet product(s) from laptop → tablet`)

    await ContentBlock.updateOrCreate(
      { key: 'homeCircles' },
      { key: 'homeCircles', value: FIXED_HOME_CIRCLES }
    )
    this.logger.success('Updated ContentBlock homeCircles with corrected storefront links')
  }
}
