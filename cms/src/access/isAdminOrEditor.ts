import type { AccessArgs } from 'payload'

type UserWithRole = {
  role?: null | string
}

export const isAdminOrEditor = ({ req: { user } }: AccessArgs): boolean => {
  if (!user) return false
  const role = (user as UserWithRole).role
  return role === 'admin' || role === 'editor'
}

export const isAdmin = ({ req: { user } }: AccessArgs): boolean => {
  if (!user) return false
  const role = (user as UserWithRole).role
  return role === 'admin'
}
