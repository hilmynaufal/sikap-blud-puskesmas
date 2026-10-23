"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentUser, puskesmasWajib } from "@/lib/auth"

const cetakSchema = z.object({
  jenis: z.enum(["sp2b", "sp3b"]),
  puskesmasId: z.number().int().nullable(),
  tahun: z.number().int(),
  bulan: z.number().int().min(1).max(12),
})

/** Catat di audit_log bahwa SP2B/SP3B dicetak (PDF-nya dibuat di browser dari pratinjau). */
export async function catatCetak(input: z.input<typeof cetakSchema>) {
  const user = await getCurrentUser()
  if (!user) return
  const d = cetakSchema.parse(input)
  const puskesmasId = puskesmasWajib(user, d.puskesmasId)
  await prisma.auditLog.create({
    data: { userId: user.id, aksi: "cetak", entitas: d.jenis, detail: { puskesmasId, tahun: d.tahun, bulan: d.bulan } },
  })
}
