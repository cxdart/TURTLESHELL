import { notFound, redirect } from 'next/navigation'
import ContactModal from '@/components/ContactModal'
import { createClient } from '@/lib/supabase/server'
import NexusBotPageClient from './NexusBotPageClient'
import MeliodasBotPageClient from './MeliodasBotPageClient'
import { ensureMeliodasBotForUser, MELIODAS_BOT_SLUG } from '@/lib/nexus/meliodas'

type NexusBotPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function NexusBotPage({ params }: NexusBotPageProps) {
  const { slug } = await params
  const botSlug = decodeURIComponent(slug)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: svc } = await supabase
    .from('user_services')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')
    .single()

  if (!svc) redirect('/systems')

  let { data: bot } = await supabase
    .from('user_bots')
    .select('*')
    .eq('user_id', user.id)
    .eq('service_type', 'nexus')
    .eq('bot_slug', botSlug)
    .maybeSingle()

  if (!bot && botSlug === MELIODAS_BOT_SLUG) {
    const ensured = await ensureMeliodasBotForUser(supabase, user.id, [])
    bot = ensured.bot
  }

  if (!bot) notFound()

  return (
    <>
      {bot.bot_slug === MELIODAS_BOT_SLUG ? (
        <MeliodasBotPageClient bot={bot} />
      ) : (
        <NexusBotPageClient bot={bot} />
      )}
      <ContactModal />
    </>
  )
}
