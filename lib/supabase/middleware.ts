import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return supabaseResponse

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const isAuth = !!user
  const path = request.nextUrl.pathname

  const isAuthPage = path === "/login" || path === "/signup"
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/settings")

  if (!isAuth && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", path)
    return NextResponse.redirect(url)
  }
  if (isAuth && isAuthPage) {
    const url = request.nextUrl.clone()
    const next = request.nextUrl.searchParams.get("next")
    url.pathname = next && next.startsWith("/") ? next : "/dashboard"
    url.searchParams.delete("next")
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
