import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      reason?: string
      details?: string
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // Fallback: log to console so it shows in server logs
      console.error('[DELETE REQUEST]', {
        user_id: user.id,
        email: user.email,
        reason: body.reason || 'none',
        details: body.details || '',
        requested_at: new Date().toISOString(),
      })
      // Still return success so UX is not broken
      return NextResponse.json({ ok: true, fallback: true })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Insert into deletion_requests table (create this in Supabase if not exists)
    const { error } = await admin.from('deletion_requests').insert({
      user_id: user.id,
      email: user.email,
      reason: body.reason || 'none',
      details: body.details || null,
      status: 'pending',
      requested_at: new Date().toISOString(),
    })

    if (error) {
      // Table may not exist yet — fallback to leads table
      const { error: leadsError } = await admin.from('leads').insert({
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        project_type: 'other',
        description: `ACCOUNT DELETION REQUEST\nReason: ${body.reason || 'none'}\nDetails: ${body.details || 'none'}\nUser ID: ${user.id}`,
        status: 'delete_request',
      })

      if (leadsError) {
        console.error('[DELETE REQUEST FALLBACK ERROR]', leadsError)
        return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE REQUEST ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
