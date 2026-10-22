import { z } from "zod"

/** Isian kepala surat yang boleh diubah pengguna; angka keuangan selalu dihitung ulang di server. */
export const sp3bFormSchema = z.object({
  puskesmasId: z.number().int().nullable(),
  tahun: z.number().int().min(2000).max(2100),
  bulan: z.number().int().min(1).max(12),
  tanggal: z.string().max(10),
  nomor: z.string().max(120),
  dasar: z.string().max(400),
  urusan: z.string().max(200),
  organisasi: z.string().max(200),
  blu: z.string().max(200),
  program: z.string().max(100),
  kota: z.string().max(100),
  tanggalTtd: z.string().max(10),
  jabatan: z.string().max(200),
  namaKepala: z.string().max(200),
  nip: z.string().max(60),
})
export type Sp3bForm = z.infer<typeof sp3bFormSchema>

export const sp2bFormSchema = z.object({
  puskesmasId: z.number().int().nullable(),
  tahun: z.number().int().min(2000).max(2100),
  bulan: z.number().int().min(1).max(12),
  tanggal: z.string().max(10),
  noSp3b: z.string().max(120),
  nomorSp2b: z.string().max(120),
  skpd: z.string().max(200),
  blu: z.string().max(200),
  kota: z.string().max(100),
  tanggalTtd: z.string().max(10),
  namaBud: z.string().max(200),
  nipBud: z.string().max(60),
})
export type Sp2bForm = z.infer<typeof sp2bFormSchema>

/** Nilai bawaan dari generator lama. */
export const DEFAULT_LAPORAN = {
  dasar: "Peraturan Bupati Bandung Nomor 359 Tahun 2025, Tanggal 24 Desember 2025",
  urusan: "URUSAN WAJIB PELAYANAN DASAR Kesehatan",
  organisasi: "DINAS KESEHATAN",
  program: "10.01",
  kota: "Soreang",
  skpd: "DINAS KESEHATAN",
  namaBud: "Hj Dewi Hartati, S.E., M.Si",
  nipBud: "19820715 201001 2 010",
}

/** "Puskesmas Ranca Malaka Endah" -> "RANCAMALAKAENDAH" (untuk nomor surat). */
export function kodeSurat(namaPuskesmas: string) {
  return namaPuskesmas.replace(/^puskesmas\s+/i, "").replace(/\s+/g, "").toUpperCase()
}

export function nomorDefault(jenis: "SP3B" | "SP2B", namaPuskesmas: string, bulan: number, tahun: number) {
  return `005/${jenis}-PKM${kodeSurat(namaPuskesmas)}/${String(bulan).padStart(2, "0")}/${tahun}`
}

const BULAN_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

/** "2026-05-31" -> "31 Mei 2026" */
export function formatTanggal(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return ""
  return `${parseInt(d, 10)} ${BULAN_ID[parseInt(m, 10)]} ${y}`
}
