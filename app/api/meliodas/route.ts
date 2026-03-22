import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REMOVED_PAYLOAD = {
  error: 'Legacy Meliodas endpoint removed. Use the bot-scoped API route.',
}

export async function GET() {
  return NextResponse.json(REMOVED_PAYLOAD, { status: 410 })
}

export async function POST() {
  return NextResponse.json(REMOVED_PAYLOAD, { status: 410 })
}
