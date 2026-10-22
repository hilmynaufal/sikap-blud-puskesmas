/** Format sel tabel dashboard: 0 tampil sebagai "-". */
export const formatIDR = (num: number) => (num === 0 ? "-" : new Intl.NumberFormat("id-ID").format(num))

export const formatCurrency = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num)

/**
 * Format input: hanya digit, dipisah titik ribuan.
 * Nol di depan dibuang ("0" lalu diketik "300000" -> "300.000", bukan "0.300.000").
 */
export function formatInputIDR(val: string | number): string {
  const num = val.toString().replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "")
  if (!num) return ""
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function parseInputIDR(val: string): number {
  return parseInt(val.replace(/\./g, ""), 10) || 0
}

/** Format dokumen SP2B/SP3B: dua desimal, 0 tampil "-". */
export function formatDokumen(num: number): string {
  if (!num) return "-"
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}
