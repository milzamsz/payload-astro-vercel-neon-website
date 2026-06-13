import type { AccessArgs, Where } from 'payload'

export const authenticatedOrPublished = ({ req: { user } }: AccessArgs): boolean | Where => {
  if (user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}
