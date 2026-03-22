import { createClient } from '@/lib/supabase/server'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    null
  return <NavbarClient user={user} name={name} />
}
