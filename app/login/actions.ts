"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"

export type LoginState = { error?: string; email?: string }

// Pembatas sederhana per proses: 5 percobaan gagal per email dalam 15 menit.
const gagal = new Map<string, { n: number; sejak: number }>()
const JENDELA_MS = 15 * 60 * 1000
const MAKS_GAGAL = 5

function terkunci(email: string) {
  const g = gagal.get(email)
  if (!g) return false
  if (Date.now() - g.sejak > JENDELA_MS) {
    gagal.delete(email)
    return false
  }
  return g.n >= MAKS_GAGAL
}

function catatGagal(email: string) {
  const g = gagal.get(email)
  if (!g || Date.now() - g.sejak > JENDELA_MS) gagal.set(email, { n: 1, sejak: Date.now() })
  else g.n++
}

function aman(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const next = aman(formData.get("next") as string | null)

  if (!email || !password) return { error: "Email dan password harus diisi", email }
  if (terkunci(email)) return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.", email }

  const user = await prisma.user.findUnique({ where: { email } })
  const cocok = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!user || !cocok) {
    catatGagal(email)
    return { error: "Email atau password salah", email }
  }
  if (!user.aktif) return { error: "Akun Anda tidak aktif. Silakan hubungi administrator.", email }

  gagal.delete(email)
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession({ userId: user.id, role: user.role })
  redirect(next)
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
