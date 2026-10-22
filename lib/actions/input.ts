"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { AksesDitolak, getCurrentUser, puskesmasWajib } from "@/lib/auth"

export type HasilSimpan = { ok: true; jumlah: number; dihapus: number } | { ok: false; pesan: string }

const nilaiSchema = z.number().int().min(0).max(1e15)

const realisasiSchema = z.object({
  puskesmasId: z.number().int().nullable(),
  tahun: z.number().int().min(2000).max(2100),
  bulan: z.number().int().min(1).max(12),
  items: z.array(z.object({ kodeRekeningId: z.number().int(), nilai: nilaiSchema })).max(5000),
})

const anggaranSchema = z.object({
  puskesmasId: z.number().int().nullable(),
  tahun: z.number().int().min(2000).max(2100),
  items: z
    .array(z.object({ kodeRekeningId: z.number().int(), murni: nilaiSchema, perubahan: nilaiSchema }))
    .max(5000),
})

/** Pastikan semua kode milik tahun tsb dan berupa baris rincian (leaf). */
async function validasiKode(tahun: number, ids: number[]) {
  if (ids.length === 0) return
  const valid = await prisma.kodeRekening.count({ where: { id: { in: ids }, tahun, isLeaf: true } })
  if (valid !== new Set(ids).size) throw new AksesDitolak("Kode rekening tidak valid untuk tahun ini")
}

function gagal(err: unknown): HasilSimpan {
  if (err instanceof AksesDitolak) return { ok: false, pesan: err.message }
  if (err instanceof z.ZodError) return { ok: false, pesan: "Data yang dikirim tidak valid" }
  console.error(err)
  return { ok: false, pesan: "Gagal menyimpan ke database." }
}

/**
 * Simpan satu periode realisasi. Nilai 0 / kosong = hapus baris yang ada,
 * sehingga operator bisa mengoreksi salah input (di aplikasi lama tidak bisa).
 */
export async function simpanRealisasi(input: z.input<typeof realisasiSchema>): Promise<HasilSimpan> {
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, pesan: "Sesi berakhir, silakan login ulang." }
    const data = realisasiSchema.parse(input)
    const puskesmasId = puskesmasWajib(user, data.puskesmasId)
    await validasiKode(data.tahun, data.items.map((i) => i.kodeRekeningId))

    const isi = data.items.filter((i) => i.nilai > 0)
    const kosong = data.items.filter((i) => i.nilai === 0).map((i) => i.kodeRekeningId)

    const [hapus] = await prisma.$transaction([
      prisma.realisasi.deleteMany({
        where: { puskesmasId, tahun: data.tahun, bulan: data.bulan, kodeRekeningId: { in: kosong } },
      }),
      ...isi.map((i) =>
        prisma.realisasi.upsert({
          where: { puskesmasId_kodeRekeningId_bulan: { puskesmasId, kodeRekeningId: i.kodeRekeningId, bulan: data.bulan } },
          create: { puskesmasId, kodeRekeningId: i.kodeRekeningId, tahun: data.tahun, bulan: data.bulan, nilai: i.nilai, updatedById: user.id },
          update: { nilai: i.nilai, updatedById: user.id },
        }),
      ),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          aksi: "simpan",
          entitas: "realisasi",
          detail: { puskesmasId, tahun: data.tahun, bulan: data.bulan, diisi: isi.length, dikosongkan: kosong.length } as Prisma.InputJsonValue,
        },
      }),
    ])
    revalidatePath("/realisasi", "layout")
    revalidatePath("/laporan", "layout")
    return { ok: true, jumlah: isi.length, dihapus: hapus.count }
  } catch (err) {
    return gagal(err)
  }
}

export async function simpanAnggaran(input: z.input<typeof anggaranSchema>): Promise<HasilSimpan> {
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, pesan: "Sesi berakhir, silakan login ulang." }
    const data = anggaranSchema.parse(input)
    const puskesmasId = puskesmasWajib(user, data.puskesmasId)
    await validasiKode(data.tahun, data.items.map((i) => i.kodeRekeningId))

    const isi = data.items.filter((i) => i.murni > 0 || i.perubahan > 0)
    const kosong = data.items.filter((i) => i.murni === 0 && i.perubahan === 0).map((i) => i.kodeRekeningId)

    const [hapus] = await prisma.$transaction([
      prisma.anggaran.deleteMany({ where: { puskesmasId, tahun: data.tahun, kodeRekeningId: { in: kosong } } }),
      ...isi.map((i) =>
        prisma.anggaran.upsert({
          where: { puskesmasId_kodeRekeningId: { puskesmasId, kodeRekeningId: i.kodeRekeningId } },
          create: { puskesmasId, kodeRekeningId: i.kodeRekeningId, tahun: data.tahun, nilaiMurni: i.murni, nilaiPerubahan: i.perubahan, updatedById: user.id },
          update: { nilaiMurni: i.murni, nilaiPerubahan: i.perubahan, updatedById: user.id },
        }),
      ),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          aksi: "simpan",
          entitas: "anggaran",
          detail: { puskesmasId, tahun: data.tahun, diisi: isi.length, dikosongkan: kosong.length } as Prisma.InputJsonValue,
        },
      }),
    ])
    revalidatePath("/anggaran", "layout")
    return { ok: true, jumlah: isi.length, dihapus: hapus.count }
  } catch (err) {
    return gagal(err)
  }
}
