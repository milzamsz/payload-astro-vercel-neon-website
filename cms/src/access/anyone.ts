import type { AccessArgs } from 'payload'

export const anyone = (_args: AccessArgs): boolean => {
  return true
}
