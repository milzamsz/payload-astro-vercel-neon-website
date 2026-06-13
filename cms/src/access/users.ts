import type { Access, AccessArgs, FieldAccess } from 'payload'
import type { PayloadRequest } from 'payload'

type AppUser = {
  id: number | string
  role?: null | string
}

const HAS_ADMIN_CONTEXT_KEY = 'users.hasAdmin'
const HAS_USERS_CONTEXT_KEY = 'users.hasUsers'

const getUserFromRequest = (req: PayloadRequest): AppUser | null => {
  if (!req.user) {
    return null
  }

  return req.user as AppUser
}

const isAdminUser = (user: AppUser | null): boolean => user?.role === 'admin'

const hasAnyAdmin = async (req: PayloadRequest): Promise<boolean> => {
  const cachedValue = req.context[HAS_ADMIN_CONTEXT_KEY]

  if (typeof cachedValue === 'boolean') {
    return cachedValue
  }

  const { docs } = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      role: {
        equals: 'admin',
      },
    },
  })

  const hasAdmin = docs.length > 0
  req.context[HAS_ADMIN_CONTEXT_KEY] = hasAdmin

  return hasAdmin
}

const hasAnyUsers = async (req: PayloadRequest): Promise<boolean> => {
  const cachedValue = req.context[HAS_USERS_CONTEXT_KEY]

  if (typeof cachedValue === 'boolean') {
    return cachedValue
  }

  const { docs } = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    pagination: false,
  })

  const hasUsers = docs.length > 0
  req.context[HAS_USERS_CONTEXT_KEY] = hasUsers

  return hasUsers
}

export const adminOrSelf: Access = ({ req }: AccessArgs) => {
  const user = getUserFromRequest(req)

  if (!user) {
    return false
  }

  if (isAdminUser(user)) {
    return true
  }

  return {
    id: {
      equals: user.id,
    },
  }
}

export const adminOnlyOrBootstrap: Access = async ({ req }: AccessArgs) => {
  const user = getUserFromRequest(req)

  if (isAdminUser(user)) {
    return true
  }

  if (!user) {
    return !(await hasAnyUsers(req))
  }

  return !(await hasAnyAdmin(req))
}

export const canManageUserRole: FieldAccess = async ({ doc, id, req }) => {
  const user = getUserFromRequest(req)

  if (isAdminUser(user)) {
    return true
  }

  if (!user) {
    return !(await hasAnyUsers(req))
  }

  const hasAdmin = await hasAnyAdmin(req)

  if (hasAdmin) {
    return false
  }

  if (typeof doc?.id === 'undefined' && typeof id === 'undefined') {
    return true
  }

  const targetID =
    typeof doc?.id !== 'undefined'
      ? String(doc.id)
      : typeof id !== 'undefined'
        ? String(id)
        : null

  return targetID === String(user.id)
}
