// Build timestamp — evaluated once when Next.js starts (i.e., on each deploy/restart)
// Clients poll this endpoint; when the value changes, they hard-reload.
const BUILD_ID = Date.now().toString()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return new Response(JSON.stringify({ v: BUILD_ID }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
