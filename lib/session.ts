import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "sikap_session"
const DURASI_DETIK = 60 * 60 * 10 // 10 jam, cukup untuk satu hari kerja

export type SessionPayload = {
  userId: number
  role: "ADMIN" | "OPERATOR"
}

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET minimal 32 karakter")
  return new TextEncoder().encode(secret)
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURASI_DETIK}s`)
    .sign(secretKey())
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] })
    if (typeof payload.userId !== "number") return null
    return { userId: payload.userId, role: payload.role as SessionPayload["role"] }
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encryptSession(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURASI_DETIK,
  })
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return decryptSession(store.get(SESSION_COOKIE)?.value)
}
