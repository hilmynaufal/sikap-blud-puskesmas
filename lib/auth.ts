import { cache } from "react"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { readSession } from "@/lib/session"

export type CurrentUser = {
  id: number
  nama: string
  email: string
  role: "ADMIN" | "OPERATOR"
  puskesmasId: number | null
  puskesmasNama: string | null
}

/** Sesi diverifikasi ulang ke DB tiap request supaya akun nonaktif langsung terputus. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { puskesmas: { select: { nama: true } } },
  })
  if (!user || !user.aktif) return null
  if (user.role === "OPERATOR" && !user.puskesmasId) return null
  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    puskesmasId: user.puskesmasId,
    puskesmasNama: user.puskesmas?.nama ?? null,
  }
})

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (user.role !== "ADMIN") redirect("/")
  return user
}

export class AksesDitolak extends Error {}

/**
 * Operator selalu dikunci ke puskesmasnya sendiri, apa pun yang diminta klien.
 * Admin boleh memilih puskesmas mana saja (null = semua, hanya untuk tampilan rekap).
 */
export function puskesmasUntuk(user: CurrentUser, diminta: number | null | undefined): number | null {
  if (user.role === "OPERATOR") return user.puskesmasId
  return diminta ?? null
}

/** Untuk operasi tulis: wajib satu puskesmas konkret. */
export function puskesmasWajib(user: CurrentUser, diminta: number | null | undefined): number {
  const id = puskesmasUntuk(user, diminta)
  if (!id) throw new AksesDitolak("Puskesmas harus dipilih")
  return id
}
