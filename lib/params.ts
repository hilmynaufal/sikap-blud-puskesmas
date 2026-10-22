export type SearchParams = Promise<Record<string, string | string[] | undefined>>

export function angka(v: string | string[] | undefined): number | null {
  const s = Array.isArray(v) ? v[0] : v
  if (!s) return null
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

/** Tahun default: tahun dari query, atau tahun terbaru yang punya bagan akun. */
export function pilihTahun(v: string | string[] | undefined, tersedia: number[]): number {
  const n = angka(v)
  if (n && n >= 2000 && n <= 2100) return n
  return tersedia[0] ?? new Date().getFullYear()
}
