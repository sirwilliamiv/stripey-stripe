const SENSITIVE_KEYS = new Set([
  'number', 'cvc', 'exp_month', 'exp_year',
  'card', 'pan', 'ssn', 'tax_id', 'dob',
  'account_number', 'routing_number',
])

export function redactSensitiveFields(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(redactSensitiveFields)

  const obj = value as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      if (val !== null && typeof val === 'object') {
        // Sensitive key wrapping an object — recurse so nested sensitive fields are redacted
        result[key] = redactSensitiveFields(val)
      } else {
        result[key] = '[REDACTED]'
      }
    } else {
      result[key] = redactSensitiveFields(val)
    }
  }

  return result
}
