import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_ENDPOINTS = new Set([
  'status',
  'logs',
  'credentials',
  'credentials-reveal',
  'settings',
  'passcode-reveal',
  'start',
  'stop',
])

const DEFAULT_API_BASE = 'http://127.0.0.1:5000'
const REVEAL_ENDPOINTS = new Set(['credentials-reveal', 'passcode-reveal'])

function getUpstreamEndpoint(endpoint: string) {
  switch (endpoint) {
    case 'credentials-reveal':
      return 'credentials/reveal'
    case 'passcode-reveal':
      return 'settings/passcode/reveal'
    default:
      return endpoint
  }
}

async function authorizeOwnedBot(botSlug: string) {
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

  const { data: bot } = await supabase
    .from('user_bots')
    .select('id, bot_slug')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')
    .eq('bot_slug', botSlug)
    .maybeSingle()

  if (!bot) {
    return {
      error: NextResponse.json({ error: 'Bot not found' }, { status: 404 }),
    }
  }

  return { bot }
}

function getUpstreamUrl(botId: string, endpoint: string) {
  const baseUrl = (process.env.MELIODAS_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '')
  return `${baseUrl}/api/bots/${encodeURIComponent(botId)}/${getUpstreamEndpoint(endpoint)}`
}

async function proxyRequest(request: NextRequest, botSlug: string, endpoint: string) {
  const auth = await authorizeOwnedBot(botSlug)
  if ('error' in auth) return auth.error

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (REVEAL_ENDPOINTS.has(endpoint) && request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const headers = new Headers()
  const contentType = request.headers.get('content-type')

  if (contentType) headers.set('Content-Type', contentType)

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  try {
    const upstream = await fetch(getUpstreamUrl(auth.bot.id, endpoint), {
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
    if (REVEAL_ENDPOINTS.has(endpoint)) {
      responseHeaders.set('Cache-Control', 'no-store')
    }

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
    botSlug: string
    endpoint: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { botSlug, endpoint } = await context.params
  return proxyRequest(request, botSlug, endpoint)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { botSlug, endpoint } = await context.params
  return proxyRequest(request, botSlug, endpoint)
}
