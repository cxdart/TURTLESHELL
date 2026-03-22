import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MAX_PAGES = 25
const PER_PAGE = 200

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function POST(request: Request) {
  let identifier = ''

  try {
    const body = (await request.json()) as { identifier?: unknown }
    identifier = normalize(body?.identifier)
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier is required.' }, { status: 400 })
  }

  if (identifier.includes('@')) {
    return NextResponse.json({ email: identifier })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Username login is not configured for this environment.' },
      { status: 503 }
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) {
      return NextResponse.json({ error: 'Unable to resolve username.' }, { status: 500 })
    }

    const users = data?.users ?? []
    const match = users.find((user) => {
      const email = normalize(user.email)
      const usernameFromMeta = normalize((user.user_metadata as { username?: unknown } | null)?.username)
      const emailLocalPart = email.includes('@') ? email.split('@')[0] : ''
      return usernameFromMeta === identifier || emailLocalPart === identifier
    })

    if (match?.email) {
      return NextResponse.json({ email: normalize(match.email) })
    }

    if (users.length < PER_PAGE) break
  }

  return NextResponse.json({ error: 'Username not found.' }, { status: 404 })
}
