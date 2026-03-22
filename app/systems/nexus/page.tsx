import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactModal from '@/components/ContactModal'
import NexusPageClient from './NexusPageClient'
import { ensureMeliodasBotForUser } from '@/lib/nexus/meliodas'

export default async function NexusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check they actually own NEXUS
  const { data: svc } = await supabase
    .from('user_services')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')
    .single()

  if (!svc) redirect('/systems')

  // Fetch their assigned bots
  const { data: bots } = await supabase
    .from('user_bots')
    .select('*')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')

  const { bots: assignedBots } = await ensureMeliodasBotForUser(supabase, user.id, bots || [])

  return (
    <>
      <NexusPageClient bots={assignedBots} />
      <ContactModal />
    </>
  )
}
