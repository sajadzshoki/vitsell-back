import { test } from '@japa/runner'
import User from '#models/user'
import Category from '#models/category'
import MegaMenu from '#models/mega_menu'
import MegaMenuSection from '#models/mega_menu_section'
import MegaMenuItem from '#models/mega_menu_item'

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function ensureMobileCategory() {
  return Category.updateOrCreate(
    { id: 'mobile' },
    {
      id: 'mobile',
      name: 'موبایل',
      icon: 'mobile',
      image: null,
      text: null,
      parentId: null,
      status: 'active',
      sortOrder: 0,
      subs: [],
      pageMeta: null,
      suggested: null,
      seo: null,
    }
  )
}

test.group('Mega menu', (group) => {
  group.tap((t) => t.tags(['mega-menu']))

  test('public mega-menu returns tree with category and filter items', async ({
    client,
    assert,
  }) => {
    await ensureMobileCategory()

    const menu = await MegaMenu.updateOrCreate(
      { id: 'mm-test-mobile' },
      {
        id: 'mm-test-mobile',
        title: 'گوشی موبایل و تجهیزات',
        slug: 'mobile-gear-test',
        icon: 'mobile',
        sortOrder: 0,
        status: 'active',
      }
    )

    const section = await MegaMenuSection.updateOrCreate(
      { id: 'mms-test-phones' },
      {
        id: 'mms-test-phones',
        menuId: menu.id,
        parentId: null,
        title: 'گوشی موبایل',
        categoryId: 'mobile',
        sortOrder: 0,
        status: 'active',
      }
    )

    const brandSection = await MegaMenuSection.updateOrCreate(
      { id: 'mms-test-brands' },
      {
        id: 'mms-test-brands',
        menuId: menu.id,
        parentId: section.id,
        title: 'گوشی بر اساس برند',
        categoryId: null,
        sortOrder: 0,
        status: 'active',
      }
    )

    await MegaMenuItem.updateOrCreate(
      { id: 'mmi-test-cat' },
      {
        id: 'mmi-test-cat',
        sectionId: section.id,
        title: 'گوشی موبایل',
        type: 'category',
        categoryId: 'mobile',
        filter: null,
        url: null,
        sortOrder: 0,
        status: 'active',
      }
    )

    await MegaMenuItem.updateOrCreate(
      { id: 'mmi-test-samsung' },
      {
        id: 'mmi-test-samsung',
        sectionId: brandSection.id,
        title: 'سامسونگ',
        type: 'filter',
        categoryId: null,
        filter: { category: 'mobile', brands: ['Samsung'] },
        url: null,
        sortOrder: 0,
        status: 'active',
      }
    )

    await MegaMenuItem.updateOrCreate(
      { id: 'mmi-test-price' },
      {
        id: 'mmi-test-price',
        sectionId: brandSection.id,
        title: 'زیر ۱۰ میلیون',
        type: 'filter',
        categoryId: null,
        filter: { category: 'mobile', maxPrice: 10_000_000 },
        url: null,
        sortOrder: 1,
        status: 'active',
      }
    )

    const res = await client.get('/api/v1/mega-menu')
    res.assertStatus(200)
    const body = res.body()
    assert.isArray(body.items)
    const found = body.items.find((m: { id: string }) => m.id === 'mm-test-mobile')
    assert.exists(found)
    assert.equal(found.title, 'گوشی موبایل و تجهیزات')
    assert.isArray(found.sections)
    assert.isAtLeast(found.sections.length, 1)

    const rootSection = found.sections.find((s: { id: string }) => s.id === 'mms-test-phones')
    assert.exists(rootSection)
    assert.equal(rootSection.category?.id, 'mobile')
    assert.isTrue(rootSection.items.some((i: { type: string }) => i.type === 'category'))

    const nested = rootSection.sections.find((s: { id: string }) => s.id === 'mms-test-brands')
    assert.exists(nested)
    const samsung = nested.items.find((i: { id: string }) => i.id === 'mmi-test-samsung')
    assert.exists(samsung)
    assert.equal(samsung.type, 'filter')
    assert.deepEqual(samsung.filter.brands, ['Samsung'])
    assert.equal(samsung.filter.category, 'mobile')
  })

  test('admin can create mega menu section and filter item', async ({ client, assert }) => {
    await ensureMobileCategory()
    const admin = await User.updateOrCreate(
      { phone: '09191119999' },
      { phone: '09191119999', role: 'admin' }
    )
    const token = await bearerFor(admin)
    const stamp = Date.now().toString(36)

    const createMenu = await client
      .post('/api/v1/seller/mega-menus')
      .bearerToken(token)
      .json({
        title: 'لپ‌تاپ و کامپیوتر',
        slug: `laptop-gear-${stamp}`,
        icon: 'laptop',
        sortOrder: 1,
        status: 'active',
      })
    createMenu.assertStatus(201)
    const menuId = createMenu.body().id as string
    assert.isString(menuId)

    const createSection = await client
      .post('/api/v1/seller/mega-menu-sections')
      .bearerToken(token)
      .json({
        menuId,
        title: 'لپ‌تاپ',
        categoryId: 'mobile',
        sortOrder: 0,
        status: 'active',
      })
    createSection.assertStatus(201)
    const sectionId = createSection.body().id as string

    const createItem = await client
      .post('/api/v1/seller/mega-menu-items')
      .bearerToken(token)
      .json({
        sectionId,
        title: '۸ گیگ رم',
        type: 'filter',
        filter: { category: 'mobile', attrs: { ram: ['8GB'] } },
        sortOrder: 0,
        status: 'active',
      })
    createItem.assertStatus(201)
    assert.equal(createItem.body().type, 'filter')
    assert.deepEqual(createItem.body().filter.attrs, { ram: ['8GB'] })

    const tree = await client.get(`/api/v1/seller/mega-menus/${menuId}`).bearerToken(token)
    tree.assertStatus(200)
    assert.isAtLeast(tree.body().sections.length, 1)

    const destroyed = await client.delete(`/api/v1/seller/mega-menus/${menuId}`).bearerToken(token)
    destroyed.assertStatus(200)
  })
})
