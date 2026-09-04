import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null as unknown as ReturnType<typeof createBrowserClient>
  return createBrowserClient(url, key)
}

export async function getUser() {
  const supabase = createClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const supabase = createClient()
  if (!supabase) return
  await supabase.auth.signOut()
}
