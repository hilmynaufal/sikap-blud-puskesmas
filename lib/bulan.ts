export const DAFTAR_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const

export type NamaBulan = (typeof DAFTAR_BULAN)[number]

/** "Maret" -> 3; null kalau bukan nama bulan yang valid. */
export function bulanKeAngka(nama: string): number | null {
  const idx = DAFTAR_BULAN.findIndex((b) => b.toLowerCase() === nama.trim().toLowerCase())
  return idx === -1 ? null : idx + 1
}

export function namaBulan(angka: number): NamaBulan {
  return DAFTAR_BULAN[angka - 1]
}
