const SENSITIVE_KEYS = new Set([
  'card_number', 'number', 'cvc', 'exp_month', 'exp_year',
  'ssn', 'dob', 'routing_number', 'account_number',
  'secret', 'api_key', 'secret_key', 'client_secret',
  'token', 'access_token', 'refresh_token',
  'password', 'pin',
])

const PARTIAL_KEYS = ['id', 'customer', 'source', 'payment_method']

function maskValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length <= 4) return '****'
    return `****${value.slice(-4)}`
  }
  return '****'
}

export function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redactSensitiveFields)

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '****'
    } else if (PARTIAL_KEYS.some((pk) => lowerKey.includes(pk)) && typeof value === 'string') {
      result[key] = maskValue(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveFields(value)
    } else {
      result[key] = value
    }
  }
  return result
}
