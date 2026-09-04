import ContentBlock from '#models/content_block'

export const ABOUT_PAGE_KEY = 'aboutPage'

export async function loadAboutPage(): Promise<Record<string, unknown> | null> {
  const block = await ContentBlock.find(ABOUT_PAGE_KEY)
  if (!block?.value || typeof block.value !== 'object') return null
  return block.value as Record<string, unknown>
}

export async function saveAboutPage(payload: Record<string, unknown>) {
  await ContentBlock.updateOrCreate(
    { key: ABOUT_PAGE_KEY },
    { key: ABOUT_PAGE_KEY, value: payload }
  )
  return payload
}
