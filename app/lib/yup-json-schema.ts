// ─────────────────────────────────────────────────────────────────────────────
// Derives a JSON Schema (draft-07 subset) from a Yup schema's describe() output.
// Used to feed Monaco's JSON language service so the request-body editor gets
// property/enum autocomplete (Ctrl+Space) that stays in sync with the Yup
// validation already defined in validation-schemas.ts — no schema duplicated.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AnySchema,
  SchemaDescription,
  SchemaFieldDescription,
  SchemaInnerTypeDescription,
  SchemaObjectDescription,
} from 'yup'

export interface JsonSchema {
  type?: string
  enum?: (string | number)[]
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  description?: string
}

const YUP_TO_JSON_TYPE: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'string',
}

function hasFields(desc: SchemaFieldDescription): desc is SchemaObjectDescription {
  return 'fields' in desc
}

function hasInnerType(desc: SchemaFieldDescription): desc is SchemaInnerTypeDescription {
  return 'innerType' in desc
}

function isBaseDescription(desc: SchemaFieldDescription): desc is SchemaDescription {
  return 'tests' in desc && 'oneOf' in desc
}

function isRequired(desc: SchemaFieldDescription): boolean {
  return isBaseDescription(desc) && desc.tests.some((test) => test.name === 'required')
}

function describeField(desc: SchemaFieldDescription): JsonSchema {
  const schema: JsonSchema = { type: YUP_TO_JSON_TYPE[desc.type] ?? desc.type }

  if (isBaseDescription(desc) && desc.oneOf.length > 0) {
    schema.enum = desc.oneOf as (string | number)[]
  }

  if (hasFields(desc)) {
    const properties: Record<string, JsonSchema> = {}
    const required: string[] = []
    for (const [key, fieldDesc] of Object.entries(desc.fields)) {
      properties[key] = describeField(fieldDesc)
      if (isRequired(fieldDesc)) required.push(key)
    }
    schema.properties = properties
    if (required.length > 0) schema.required = required
  }

  if (hasInnerType(desc) && desc.innerType && !Array.isArray(desc.innerType)) {
    schema.items = describeField(desc.innerType)
  }

  return schema
}

export function yupToJsonSchema(schema: AnySchema): JsonSchema {
  return describeField(schema.describe())
}
