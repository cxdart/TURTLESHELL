import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Username resolution has been removed. Use email to sign in.' },
    { status: 410 }
  )
}
