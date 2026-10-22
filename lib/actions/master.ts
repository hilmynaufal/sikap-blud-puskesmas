"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getCurrentUser, type CurrentUser } from "@/lib/auth"
import { cariKodeInduk, levelKode } from "@/lib/rekening"

export type Hasil = { ok: true; pesan?: string } | { ok: false; pesan: string }

async function admin(): Promise<CurrentUser | null> {
  const u = await getCurrentUser()
  return u?.role === "ADMIN" ? u : null
}

function gagal(err: unknown): Hasil {
  if (err instanceof z.ZodError) return { ok: false, pesan: err.issues[0]?.message ?? "Isian tidak valid" }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return { ok: false, pesan: "Data dengan kunci yang sama sudah ada." }
    if (err.code === "P2003") return { ok: false, pesan: "Data masih dipakai sehingga tidak bisa dihapus." }
  }
  console.error(err)
  return { ok: false, pesan: "Terjadi kesalahan pada server." }
}

async function audit(userId: number, aksi: string, entitas: string, detail: Prisma.InputJsonValue) {
  await prisma.auditLog.create({ data: { userId, aksi, entitas, detail } })
}

// ── Kode rekening ──────────────────────────────────────────────────────

/** Hitung ulang level & induk seluruh bagan akun satu tahun (dipanggil setelah perubahan kode). */
async function susunUlangPohon(tahun: number) {
  const rows = await prisma.kodeRekening.findMany({ where: { tahun }, select: { id: true, kode: true, parentId: true, level: true } })
  const idByKode = new Map(rows.map((r) => [r.kode, r.id]))
  const semua = new Set(idByKode.keys())
  const updates = rows
    .map((r) => {
      const induk = cariKodeInduk(r.kode, semua)
      return { id: r.id, parentId: induk ? idByKode.get(induk)! : null, level: levelKode(r.kode), lama: r }
    })
    .filter((u) => u.parentId !== u.lama.parentId || u.level !== u.lama.level)
  if (updates.length) {
    await prisma.$transaction(
      updates.map((u) => prisma.kodeRekening.update({ where: { id: u.id }, data: { parentId: u.parentId, level: u.level } })),
    )
  }
}

const rekeningSchema = z.object({
  id: z.number().int().optional(),
  tahun: z.number().int().min(2000).max(2100),
  kode: z.string().trim().regex(/^[0-9A-Za-z]+(\.[0-9A-Za-z]+)*$/, "Format kode tidak valid (contoh 5.1.02.01)"),
  uraian: z.string().trim().min(1, "Uraian wajib diisi").max(500),
  isLeaf: z.boolean(),
})

export async function simpanRekening(input: z.input<typeof rekeningSchema>): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    const d = rekeningSchema.parse(input)
    if (d.id) {
      const lama = await prisma.kodeRekening.findUnique({
        where: { id: d.id },
        include: { _count: { select: { anggaran: true, realisasi: true } } },
      })
      if (!lama) return { ok: false, pesan: "Kode rekening tidak ditemukan" }
      const dipakai = lama._count.anggaran + lama._count.realisasi > 0
      if (dipakai && !d.isLeaf) return { ok: false, pesan: "Rekening yang sudah berisi nilai harus tetap baris rincian." }
      await prisma.kodeRekening.update({ where: { id: d.id }, data: { kode: d.kode, uraian: d.uraian, isLeaf: d.isLeaf } })
    } else {
      await prisma.kodeRekening.create({ data: { tahun: d.tahun, kode: d.kode, uraian: d.uraian, isLeaf: d.isLeaf, level: levelKode(d.kode) } })
    }
    await susunUlangPohon(d.tahun)
    await audit(user.id, d.id ? "ubah" : "tambah", "kode_rekening", d)
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function hapusRekening(id: number): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    const r = await prisma.kodeRekening.delete({ where: { id } })
    await susunUlangPohon(r.tahun)
    await audit(user.id, "hapus", "kode_rekening", { id, kode: r.kode, tahun: r.tahun })
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Salin bagan akun tahun `dari` ke tahun `ke` (yang masih kosong) sebagai titik awal tahun anggaran baru. */
export async function salinTahunRekening(dari: number, ke: number): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    if (await prisma.kodeRekening.count({ where: { tahun: ke } })) {
      return { ok: false, pesan: `Bagan akun tahun ${ke} sudah ada.` }
    }
    const sumber = await prisma.kodeRekening.findMany({ where: { tahun: dari } })
    if (!sumber.length) return { ok: false, pesan: `Bagan akun tahun ${dari} kosong.` }
    await prisma.kodeRekening.createMany({
      data: sumber.map((s) => ({ tahun: ke, kode: s.kode, uraian: s.uraian, isLeaf: s.isLeaf, level: s.level })),
    })
    await susunUlangPohon(ke)
    await audit(user.id, "salin_tahun", "kode_rekening", { dari, ke, jumlah: sumber.length })
    revalidatePath("/", "layout")
    return { ok: true, pesan: `${sumber.length} kode disalin ke tahun ${ke}.` }
  } catch (err) {
    return gagal(err)
  }
}

// ── Puskesmas ─────────────────────────────────────────────────────────

const puskesmasSchema = z.object({
  id: z.number().int().optional(),
  nama: z.string().trim().min(3, "Nama wajib diisi").max(200),
  namaKepala: z.string().trim().max(200),
  nipKepala: z.string().trim().max(60),
  jabatanKepala: z.string().trim().max(200),
})

export async function simpanPuskesmas(input: z.input<typeof puskesmasSchema>): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    const { id, ...d } = puskesmasSchema.parse(input)
    const data = { nama: d.nama, namaKepala: d.namaKepala || null, nipKepala: d.nipKepala || null, jabatanKepala: d.jabatanKepala || null }
    if (id) await prisma.puskesmas.update({ where: { id }, data })
    else await prisma.puskesmas.create({ data })
    await audit(user.id, id ? "ubah" : "tambah", "puskesmas", { id: id ?? null, ...data })
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    return gagal(err)
  }
}

// ── SILPA ─────────────────────────────────────────────────────────────

const silpaSchema = z.object({
  puskesmasId: z.number().int(),
  tahun: z.number().int().min(2000).max(2100),
  nilai: z.number().min(-1e15).max(1e15).nullable(),
})

/** nilai null = hapus SILPA tahun tsb. */
export async function simpanSilpa(input: z.input<typeof silpaSchema>): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    const d = silpaSchema.parse(input)
    const where = { puskesmasId_tahun: { puskesmasId: d.puskesmasId, tahun: d.tahun } }
    if (d.nilai === null) await prisma.silpa.deleteMany({ where: { puskesmasId: d.puskesmasId, tahun: d.tahun } })
    else await prisma.silpa.upsert({ where, create: { puskesmasId: d.puskesmasId, tahun: d.tahun, nilai: d.nilai }, update: { nilai: d.nilai } })
    await audit(user.id, "simpan", "silpa", d)
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    return gagal(err)
  }
}

// ── Pengguna ──────────────────────────────────────────────────────────

const penggunaSchema = z
  .object({
    id: z.number().int().optional(),
    email: z.string().trim().toLowerCase().email("Email tidak valid"),
    nama: z.string().trim().min(2, "Nama wajib diisi").max(200),
    role: z.enum(["ADMIN", "OPERATOR"]),
    puskesmasId: z.number().int().nullable(),
    aktif: z.boolean(),
    password: z.string().max(200).optional(),
  })
  .refine((d) => d.role === "ADMIN" || d.puskesmasId, { message: "Operator wajib memilih puskesmas" })
  .refine((d) => d.id || (d.password && d.password.length >= 8), { message: "Password minimal 8 karakter" })
  .refine((d) => !d.password || d.password.length >= 8, { message: "Password minimal 8 karakter" })

export async function simpanPengguna(input: z.input<typeof penggunaSchema>): Promise<Hasil> {
  try {
    const user = await admin()
    if (!user) return { ok: false, pesan: "Akses ditolak" }
    const d = penggunaSchema.parse(input)
    if (d.id === user.id && (!d.aktif || d.role !== "ADMIN")) {
      return { ok: false, pesan: "Tidak bisa menonaktifkan atau menurunkan peran akun sendiri." }
    }
    const data = {
      email: d.email,
      nama: d.nama,
      role: d.role,
      puskesmasId: d.role === "OPERATOR" ? d.puskesmasId : null,
      aktif: d.aktif,
      ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
    }
    if (d.id) await prisma.user.update({ where: { id: d.id }, data })
    else await prisma.user.create({ data: { ...data, passwordHash: data.passwordHash! } })
    await audit(user.id, d.id ? "ubah" : "tambah", "pengguna", { id: d.id ?? null, email: d.email, role: d.role, reset: !!d.password })
    revalidatePath("/master/pengguna")
    return { ok: true }
  } catch (err) {
    return gagal(err)
  }
}

// ── Akun sendiri ──────────────────────────────────────────────────────

const gantiSchema = z
  .object({ lama: z.string().min(1, "Password lama wajib diisi"), baru: z.string().min(8, "Password baru minimal 8 karakter").max(200), ulang: z.string() })
  .refine((d) => d.baru === d.ulang, { message: "Konfirmasi password tidak sama" })

export async function gantiPassword(input: z.input<typeof gantiSchema>): Promise<Hasil> {
  try {
    const u = await getCurrentUser()
    if (!u) return { ok: false, pesan: "Sesi berakhir, silakan login ulang." }
    const d = gantiSchema.parse(input)
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } })
    if (!(await bcrypt.compare(d.lama, row.passwordHash))) return { ok: false, pesan: "Password lama salah" }
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(d.baru, 10) } })
    await audit(u.id, "ganti_password", "pengguna", { id: u.id })
    return { ok: true, pesan: "Password berhasil diganti." }
  } catch (err) {
    return gagal(err)
  }
}
