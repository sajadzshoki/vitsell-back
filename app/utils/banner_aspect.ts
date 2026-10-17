/** Normalize admin input ("16:9", "16*9", "16/9") → CSS "16/9" */
export function normalizeAspectRatio(
  value: string | null | undefined,
  fallback = '4/1'
): string {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  const m = raw
    .replace(/×/g, 'x')
    .match(/^(\d+(?:\.\d+)?)\s*[:/*xX]\s*(\d+(?:\.\d+)?)$/)
  if (!m) return fallback
  const w = Number(m[1])
  const h = Number(m[2])
  if (!(w > 0) || !(h > 0)) return fallback
  return `${trimNum(w)}/${trimNum(h)}`
}

function trimNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(n)
}
