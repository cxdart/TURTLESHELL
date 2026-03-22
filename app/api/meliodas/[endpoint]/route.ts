import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_ENDPOINTS = new Set([
  'status',
  'logs',
  'credentials',
  'settings',
  'start',
  'stop',
])

const DEFAULT_API_BASE = 'http://127.0.0.1:5000'

async function authorizeNexusUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: service } = await supabase
    .from('user_services')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')
    .maybeSingle()

  if (!service) {
    return {
      error: NextResponse.json({ error: 'NEXUS access required' }, { status: 403 }),
    }
  }

  return { user }
}

function getUpstreamUrl(endpoint: string) {
  const baseUrl = (process.env.MELIODAS_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '')
  return `${baseUrl}/api/${endpoint}`
}

async function proxyRequest(request: NextRequest, endpoint: string) {
  const auth = await authorizeNexusUser()
  if ('error' in auth) return auth.error

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const headers = new Headers()
  const passcode = request.headers.get('x-passcode')
  const contentType = request.headers.get('content-type')

  if (passcode) headers.set('X-Passcode', passcode)
  if (contentType) headers.set('Content-Type', contentType)

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  try {
    const upstream = await fetch(getUpstreamUrl(endpoint), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const text = await upstream.text()
    const responseHeaders = new Headers()
    responseHeaders.set(
      'content-type',
      upstream.headers.get('content-type') || 'application/json; charset=utf-8'
    )

    return new NextResponse(text, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Meliodas backend is unreachable.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    )
  }
}

type RouteContext = {
  params: Promise<{
    endpoint: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { endpoint } = await context.params
  return proxyRequest(request, endpoint)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { endpoint } = await context.params
  return proxyRequest(request, endpoint)
}
