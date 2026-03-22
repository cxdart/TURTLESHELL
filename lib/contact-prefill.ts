import type { User } from '@supabase/supabase-js'

export type ContactPrefill = {
  name: string
  email: string
  phone: string
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function buildContactPrefill(user: User | null | undefined): ContactPrefill {
  if (!user) return { name: '', email: '', phone: '' }

  const metadata = user.user_metadata ?? {}
  const name =
    asNonEmptyString(metadata.full_name) ||
    asNonEmptyString(metadata.fullName) ||
    asNonEmptyString(metadata.name) ||
    asNonEmptyString(metadata.username) ||
    asNonEmptyString(user.email?.split('@')[0]) ||
    ''

  const email = asNonEmptyString(user.email)
  const phone =
    asNonEmptyString(metadata.phone) ||
    asNonEmptyString(metadata.phone_number) ||
    asNonEmptyString(user.phone) ||
    ''

  return { name, email, phone }
}

