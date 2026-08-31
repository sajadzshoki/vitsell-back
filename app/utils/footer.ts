import ContentBlock from '#models/content_block'

export type FooterPayload = {
  trustItems: unknown[]
  columns: unknown[]
  socials: unknown[]
  about: string
  copyright: string
  contact: {
    phones: { label: string; href: string }[]
    email: { label: string; href: string }
  }
  appStores: unknown[]
  badges: unknown[]
}

const emptyContact: FooterPayload['contact'] = {
  phones: [],
  email: { label: '', href: '' },
}

async function block<T>(key: string, fallback: T): Promise<T> {
  const row = await ContentBlock.find(key)
  return (row?.value as T) ?? fallback
}

export async function loadFooterPayload(): Promise<FooterPayload> {
  const [trustItems, columns, socials, about, copyright, contact, appStores, badges] =
    await Promise.all([
      block<unknown[]>('footerTrustItems', []),
      block<unknown[]>('footerColumns', []),
      block<unknown[]>('footerSocials', []),
      block<string>('footerAbout', ''),
      block<string>('footerCopyright', ''),
      block<FooterPayload['contact']>('footerContact', emptyContact),
      block<unknown[]>('footerAppStores', []),
      block<unknown[]>('footerBadges', []),
    ])

  return {
    trustItems,
    columns,
    socials,
    about,
    copyright,
    contact: contact ?? emptyContact,
    appStores,
    badges,
  }
}

export async function saveFooterPayload(payload: FooterPayload): Promise<FooterPayload> {
  const entries: [string, unknown][] = [
    ['footerTrustItems', payload.trustItems],
    ['footerColumns', payload.columns],
    ['footerSocials', payload.socials],
    ['footerAbout', payload.about],
    ['footerCopyright', payload.copyright],
    ['footerContact', payload.contact],
    ['footerAppStores', payload.appStores],
    ['footerBadges', payload.badges],
  ]

  await Promise.all(
    entries.map(([key, value]) => ContentBlock.updateOrCreate({ key }, { key, value }))
  )

  return payload
}
