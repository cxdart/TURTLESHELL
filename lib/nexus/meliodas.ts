export type NexusBotRecord = {
  id: string
  bot_name: string
  bot_slug: string
  status: string
  description?: string | null
}

export const MELIODAS_BOT_SLUG = 'meliodas'
export const MELIODAS_BOT_NAME = 'Meliodas XBot'
export const MELIODAS_BOT_DESCRIPTION =
  'Command-based X/Twitter automation bot with start-stop controls, account settings, and live activity logs.'

export function createFallbackMeliodasBot(userId: string): NexusBotRecord {
  return {
    id: `meliodas-${userId}`,
    bot_name: MELIODAS_BOT_NAME,
    bot_slug: MELIODAS_BOT_SLUG,
    status: 'active',
    description: MELIODAS_BOT_DESCRIPTION,
  }
}

function normalizeBot(bot: NexusBotRecord): NexusBotRecord {
  return {
    ...bot,
    bot_name: bot.bot_name || MELIODAS_BOT_NAME,
    bot_slug: bot.bot_slug || MELIODAS_BOT_SLUG,
    status: bot.status || 'active',
    description: bot.description || MELIODAS_BOT_DESCRIPTION,
  }
}

async function tryInsertMeliodasBot(
  supabase: any,
  userId: string
): Promise<NexusBotRecord | null> {
  try {
    const { data } = await supabase
      .from('user_bots')
      .insert({
        user_id: userId,
        service_type: 'nexus',
        bot_name: MELIODAS_BOT_NAME,
        bot_slug: MELIODAS_BOT_SLUG,
        status: 'active',
        description: MELIODAS_BOT_DESCRIPTION,
      })
      .select('*')
      .single()

    return data ? normalizeBot(data) : null
  } catch {
    return null
  }
}

export async function ensureMeliodasBotForUser(
  supabase: any,
  userId: string,
  bots: NexusBotRecord[] = []
) {
  const existing = bots.find((bot) => bot.bot_slug === MELIODAS_BOT_SLUG)

  if (existing) {
    const normalized = normalizeBot(existing)
    return {
      bot: normalized,
      bots: [normalized, ...bots.filter((bot) => bot.bot_slug !== MELIODAS_BOT_SLUG)],
    }
  }

  const inserted = await tryInsertMeliodasBot(supabase, userId)
  const bot = inserted ?? createFallbackMeliodasBot(userId)

  return {
    bot,
    bots: [bot, ...bots],
  }
}
