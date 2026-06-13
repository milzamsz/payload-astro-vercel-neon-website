const DEFAULT_SERVER_URL = 'http://localhost:3000'

const stripWrappingQuotes = (value: string): string => {
  if (value.length >= 2) {
    const firstChar = value[0]
    const lastChar = value[value.length - 1]

    if (
      (firstChar === '"' && lastChar === '"') ||
      (firstChar === "'" && lastChar === "'")
    ) {
      return value.slice(1, -1)
    }
  }

  return value
}

const cleanEnvValue = (value?: null | string): string => {
  if (!value) {
    return ''
  }

  return stripWrappingQuotes(value.trim())
    .replace(/\\r|\\n|\\t/g, '')
    .replace(/[\r\n\t]+/g, '')
    .trim()
}

export const normalizeOrigin = (value?: null | string): null | string => {
  const cleanedValue = cleanEnvValue(value).replace(/\/+$/, '')

  if (!cleanedValue) {
    return null
  }

  const candidate = /^https?:\/\//i.test(cleanedValue)
    ? cleanedValue
    : `https://${cleanedValue}`

  try {
    return new URL(candidate).origin
  } catch {
    return null
  }
}

const splitOriginList = (value?: null | string): string[] =>
  cleanEnvValue(value)
    .split(/[,\s]+/)
    .map((entry) => normalizeOrigin(entry))
    .filter((entry): entry is string => Boolean(entry))

export const getServerURL = (): string =>
  normalizeOrigin(process.env.NEXT_PUBLIC_SERVER_URL) ?? DEFAULT_SERVER_URL

export const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>([
    getServerURL(),
    ...splitOriginList(process.env.PAYLOAD_ALLOWED_ORIGINS),
  ])

  ;[
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ]
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => Boolean(value))
    .forEach((value) => origins.add(value))

  return [...origins]
}
