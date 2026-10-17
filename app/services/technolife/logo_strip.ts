import sharp from 'sharp'

/**
 * Techno Life product gallery watermark usually sits in the top-left on ~800×800 shots.
 * Coordinates are relative to that reference size and scale with the image.
 */
const LOGO_REF = 800
const LOGO_BOX = { x1: 33, y1: 33, x2: 167, y2: 93 }
const MIN_LOGO_PIXELS = 160

function scaledBox(width: number, height: number) {
  const x1 = Math.max(0, Math.round((LOGO_BOX.x1 * width) / LOGO_REF))
  const y1 = Math.max(0, Math.round((LOGO_BOX.y1 * height) / LOGO_REF))
  const x2 = Math.min(width, Math.max(x1 + 1, Math.round((LOGO_BOX.x2 * width) / LOGO_REF)))
  const y2 = Math.min(height, Math.max(y1 + 1, Math.round((LOGO_BOX.y2 * height) / LOGO_REF)))
  return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 }
}

function isLogoPixel(r: number, g: number, b: number) {
  const blue = b > 70 && b > g + 35 && b > r + 40 && g < 170 && r < 140
  const gold = r > 130 && r > b + 40 && g > 80 && g < 200 && b < 120 && r > g
  return blue || gold
}

function countLogoPixels(data: Buffer, channels: number) {
  let count = 0
  for (let i = 0; i + 2 < data.length; i += channels) {
    if (isLogoPixel(data[i]!, data[i + 1]!, data[i + 2]!)) count++
  }
  return count
}

function outputFormat(metaFormat: string | undefined, mimeHint?: string) {
  const fromMime = (mimeHint || '').toLowerCase()
  if (fromMime.includes('png') || metaFormat === 'png') return 'png' as const
  if (fromMime.includes('webp') || metaFormat === 'webp') return 'webp' as const
  return 'jpeg' as const
}

/**
 * If the Techno Life corner watermark is present, paint a white rectangle over it.
 * Phone corners under the watermark may be whitened — accepted for catalog imports.
 */
export async function stripTechnolifeLogo(
  input: Buffer,
  opts?: { mimeHint?: string; force?: boolean }
): Promise<{ buffer: Buffer; stripped: boolean; logoPixels: number }> {
  let image: sharp.Sharp
  try {
    image = sharp(input, { failOn: 'none' })
  } catch {
    return { buffer: input, stripped: false, logoPixels: 0 }
  }

  const meta = await image.metadata()
  const width = meta.width || 0
  const height = meta.height || 0
  if (width < 80 || height < 80) {
    return { buffer: input, stripped: false, logoPixels: 0 }
  }

  const box = scaledBox(width, height)
  const { data, info } = await image
    .clone()
    .extract(box)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const logoPixels = countLogoPixels(data, info.channels)
  if (!opts?.force && logoPixels < MIN_LOGO_PIXELS) {
    return { buffer: input, stripped: false, logoPixels }
  }

  const white = await sharp({
    create: {
      width: box.width,
      height: box.height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer()

  const format = outputFormat(meta.format, opts?.mimeHint)
  let pipeline = sharp(input, { failOn: 'none' }).composite([
    { input: white, left: box.left, top: box.top },
  ])

  if (format === 'png') pipeline = pipeline.png({ compressionLevel: 6 })
  else if (format === 'webp') pipeline = pipeline.webp({ quality: 95 })
  else pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true })

  const buffer = await pipeline.toBuffer()
  return { buffer, stripped: true, logoPixels }
}
