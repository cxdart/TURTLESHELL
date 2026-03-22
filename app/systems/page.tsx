import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactModal from '@/components/ContactModal'
import SystemsPageClient from './SystemsPageClient'

export default async function SystemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  const { data: userServices } = await supabase
    .from('user_services')
    .select('service_type')
    .eq('user_id', user.id)

  const owned = new Set((userServices || []).map((s: { service_type: string }) => s.service_type))

  return (
    <>
      <SystemsPageClient name={name} ownedKeys={[...owned]} />
      <ContactModal />
    </>
  )
}
