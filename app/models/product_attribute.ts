import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type AttributeType =
  | 'text'
  | 'select'
  | 'multi_select'
  | 'boolean'
  | 'number'
  | 'color'
  | 'measurement'

export type AttributeStatus = 'active' | 'inactive'

export type AttributeValue = {
  id: string
  label: string
  value: string
  meta?: string | null
  sortOrder: number
  status?: 'active' | 'inactive'
  slug?: string
}

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (!value) return fallback
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

export default class ProductAttribute extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'product_attributes'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare type: AttributeType

  @column({
    prepare: (value: AttributeValue[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray<AttributeValue>(value),
  })
  declare values: AttributeValue[]

  @column()
  declare status: AttributeStatus

  @column()
  declare sortOrder: number

  @column()
  declare filterable: boolean

  @column()
  declare searchable: boolean

  @column()
  declare variantDefining: boolean

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray<string>(value).map(String),
  })
  declare categoryIds: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      type: this.type,
      values: Array.isArray(this.values) ? this.values : [],
      status: this.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Number(this.sortOrder) || 0,
      filterable: Boolean(this.filterable),
      searchable: Boolean(this.searchable),
      variantDefining: Boolean(this.variantDefining),
      categoryIds: Array.isArray(this.categoryIds) ? this.categoryIds : [],
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
