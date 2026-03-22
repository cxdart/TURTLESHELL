import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const from = searchParams.get('from') ?? 'login'
  const next = searchParams.get('next') ?? (from === 'signup' ? '/' : '/systems')
  const popup = searchParams.get('popup') === '1'

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'shell.portarab.com'
  const proto = headersList.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (popup) {
        const qs = new URLSearchParams({ success: '1', from, next })
        return NextResponse.redirect(`${origin}/auth/google/popup-done?${qs.toString()}`)
      }
      return NextResponse.redirect(
        `${origin}/redirecting?from=${from}&to=${encodeURIComponent(next)}`
      )
    }
  }

  if (popup) {
    return NextResponse.redirect(`${origin}/auth/google/popup-done?success=0&error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
