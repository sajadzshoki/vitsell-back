import vine from '@vinejs/vine'

const aboutItem = vine.object({
  id: vine.string().trim(),
  icon: vine.string().trim().optional(),
  value: vine.string().trim().optional(),
  label: vine.string().trim().optional(),
  title: vine.string().trim().optional(),
  description: vine.string().trim().optional(),
  year: vine.string().trim().optional(),
  name: vine.string().trim().optional(),
  role: vine.string().trim().optional(),
  bio: vine.string().trim().optional(),
  image: vine.string().trim().optional(),
})

const seoSchema = vine.object({
  metaTitle: vine.string().trim().optional(),
  metaDescription: vine.string().trim().optional(),
  metaKeywords: vine.string().trim().optional(),
  canonicalUrl: vine.string().trim().optional(),
  robots: vine.string().trim().optional(),
  ogTitle: vine.string().trim().optional(),
  ogDescription: vine.string().trim().optional(),
  ogImage: vine.string().trim().optional(),
  twitterTitle: vine.string().trim().optional(),
  twitterDescription: vine.string().trim().optional(),
  twitterImage: vine.string().trim().optional(),
})

export const aboutValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    subtitle: vine.string().trim().optional(),
    eyebrow: vine.string().trim().optional(),
    heroImage: vine.string().trim().optional(),
    storyTitle: vine.string().trim().optional(),
    story: vine.array(vine.string()).optional(),
    missionTitle: vine.string().trim().optional(),
    mission: vine.string().trim().optional(),
    visionTitle: vine.string().trim().optional(),
    vision: vine.string().trim().optional(),
    stats: vine.array(aboutItem.clone()).optional(),
    values: vine.array(aboutItem.clone()).optional(),
    milestones: vine.array(aboutItem.clone()).optional(),
    teamTitle: vine.string().trim().optional(),
    teamSubtitle: vine.string().trim().optional(),
    team: vine.array(aboutItem.clone()).optional(),
    cta: vine
      .object({
        title: vine.string().trim().optional(),
        subtitle: vine.string().trim().optional(),
        primaryLabel: vine.string().trim().optional(),
        primaryTo: vine.string().trim().optional(),
        secondaryLabel: vine.string().trim().optional(),
        secondaryTo: vine.string().trim().optional(),
      })
      .optional(),
    seo: seoSchema.clone().optional(),
    mapLat: vine.number().min(-90).max(90).nullable().optional(),
    mapLng: vine.number().min(-180).max(180).nullable().optional(),
    sectionVisibility: vine
      .object({
        hero: vine.boolean().optional(),
        stats: vine.boolean().optional(),
        story: vine.boolean().optional(),
        values: vine.boolean().optional(),
        milestones: vine.boolean().optional(),
        team: vine.boolean().optional(),
        map: vine.boolean().optional(),
        cta: vine.boolean().optional(),
      })
      .optional(),
  })
)
