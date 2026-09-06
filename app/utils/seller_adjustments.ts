import ContentBlock from '#models/content_block'

export const FINANCE_ADJUSTMENTS_KEY = 'finance_adjustments'

export type SellerFinanceAdjustmentType =
  | 'accounting_correction'
  | 'manual_refund_adjustment'
  | 'fee_correction'
  | 'other'

export type SellerFinanceAdjustmentRow = {
  id: string
  type: SellerFinanceAdjustmentType
  amount: number
  reason: string
  orderId: string | null
  actorId: string
  actorName: string
  createdAt: string
}

const ADJUSTMENT_TYPES: SellerFinanceAdjustmentType[] = [
  'accounting_correction',
  'manual_refund_adjustment',
  'fee_correction',
  'other',
]

function asType(value: unknown): SellerFinanceAdjustmentType {
  const s = String(value || '')
  if (ADJUSTMENT_TYPES.includes(s as SellerFinanceAdjustmentType)) {
    return s as SellerFinanceAdjustmentType
  }
  return 'other'
}

export function normalizeAdjustment(raw: unknown, index = 0): SellerFinanceAdjustmentRow {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const amount = Math.round(Number(src.amount) || 0)
  return {
    id: String(src.id || `adj-${Date.now()}-${index}`),
    type: asType(src.type),
    amount,
    reason: String(src.reason || '').trim() || 'بدون دلیل',
    orderId: src.orderId ? String(src.orderId).trim() : null,
    actorId: String(src.actorId || 'admin'),
    actorName: String(src.actorName || 'ادمین'),
    createdAt: String(src.createdAt || new Date().toISOString()),
  }
}

export async function loadFinanceAdjustments(): Promise<SellerFinanceAdjustmentRow[]> {
  const block = await ContentBlock.find(FINANCE_ADJUSTMENTS_KEY)
  const raw = block?.value
  if (!Array.isArray(raw)) return []
  return raw
    .map((row, index) => normalizeAdjustment(row, index))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

async function saveFinanceAdjustments(rows: SellerFinanceAdjustmentRow[]) {
  await ContentBlock.updateOrCreate(
    { key: FINANCE_ADJUSTMENTS_KEY },
    { key: FINANCE_ADJUSTMENTS_KEY, value: rows },
  )
  return rows
}

export async function querySellerAdjustments(filters?: {
  q?: string
  type?: string
}) {
  let items = await loadFinanceAdjustments()
  const q = filters?.q?.trim().toLowerCase()
  if (q) {
    items = items.filter(
      (row) =>
        row.id.toLowerCase().includes(q)
        || row.reason.toLowerCase().includes(q)
        || (row.orderId || '').toLowerCase().includes(q)
        || row.actorName.toLowerCase().includes(q)
        || row.type.toLowerCase().includes(q),
    )
  }
  if (filters?.type && filters.type !== 'all') {
    items = items.filter((row) => row.type === filters.type)
  }

  const typeCounts: Record<string, number> = { all: items.length }
  for (const row of items) {
    typeCounts[row.type] = (typeCounts[row.type] || 0) + 1
  }

  const credit = items.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0)
  const debit = items.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)

  return {
    items,
    total: items.length,
    typeCounts,
    summary: {
      credit,
      debit,
      net: credit - debit,
    },
  }
}

export async function createFinanceAdjustment(input: {
  type: SellerFinanceAdjustmentType
  amount: number
  reason: string
  orderId?: string | null
  actorId?: string
  actorName?: string
}) {
  const reason = String(input.reason || '').trim()
  if (!reason) return { ok: false as const, error: 'دلیل الزامی است' }
  const amount = Math.round(Number(input.amount) || 0)
  if (!amount) return { ok: false as const, error: 'مبلغ نامعتبر است' }

  const row: SellerFinanceAdjustmentRow = {
    id: `adj-${Date.now().toString(36)}`,
    type: asType(input.type),
    amount,
    reason,
    orderId: input.orderId ? String(input.orderId).trim() : null,
    actorId: String(input.actorId || 'admin'),
    actorName: String(input.actorName || 'ادمین'),
    createdAt: new Date().toISOString(),
  }

  const current = await loadFinanceAdjustments()
  const next = [row, ...current]
  await saveFinanceAdjustments(next)
  return { ok: true as const, adjustment: row }
}

export function projectAdjustmentsToTransactions(
  adjustments: SellerFinanceAdjustmentRow[],
) {
  return adjustments.map((a) => ({
    id: `tx-adj-${a.id}`,
    type: 'adjustment' as const,
    amount: Math.abs(a.amount),
    signedAmount: a.amount,
    status: 'completed' as const,
    paymentMethod: '',
    gateway: '',
    orderId: a.orderId,
    customerId: null as string | null,
    customerName: a.actorName,
    reference: a.id,
    paymentId: null as string | null,
    refundId: null as string | null,
    settlementId: null as string | null,
    adjustmentId: a.id,
    createdAt: a.createdAt,
    completedAt: a.createdAt,
    sourceLabel: 'تعدیل مالی',
  }))
}
