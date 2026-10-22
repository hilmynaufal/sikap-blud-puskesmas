import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, decryptSession } from "@/lib/session"

/**
 * Cek optimistik di edge: hanya memastikan cookie sesi valid.
 * Otorisasi sebenarnya (akun aktif, role, puskesmas) tetap dicek di server.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value)
  const isLogin = pathname === "/login"

  if (!session && !isLogin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ status: "error", message: "Tidak terautentikasi" }, { status: 401 })
    }
    const url = new URL("/login", request.url)
    if (pathname !== "/") url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
