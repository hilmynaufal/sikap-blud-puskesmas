/** Bulatkan ke 2 desimal (sen) untuk menghindari sisa pecahan floating point (0,1 + 0,2). */
export const bulat2 = (n: number) => Math.round(n * 100) / 100

/** Opsi Intl: tampilkan ",xx" hanya jika nilainya memang punya pecahan. */
function opsiDesimal(n: number): Intl.NumberFormatOptions {
  const adaPecahan = Math.round(Math.abs(n) * 100) % 100 !== 0
  return adaPecahan ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }
}

/** Format sel tabel dashboard: 0 tampil sebagai "-". */
export const formatIDR = (num: number) =>
  num === 0 ? "-" : new Intl.NumberFormat("id-ID", opsiDesimal(num)).format(num)

export const formatCurrency = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", ...opsiDesimal(num) }).format(num)

/** Angka tanpa simbol mata uang, mis. 1250000.5 -> "1.250.000,50", 1250000 -> "1.250.000". */
export const formatAngka = (num: number) => new Intl.NumberFormat("id-ID", opsiDesimal(num)).format(num)

/**
 * Format isian angka selagi diketik (format Indonesia).
 * - Titik = pemisah ribuan (diabaikan saat diketik), koma = desimal, maksimal 2 angka di belakang koma.
 * - Koma di akhir dipertahankan supaya pengguna bisa melanjutkan mengetik desimal ("1.000," -> "1.000,").
 * - Nol di depan dibuang ("0" lalu diketik "300000" -> "300.000", bukan "0.300.000").
 */
export function formatInputIDR(val: string): string {
  const bersih = val.replace(/[^0-9,]/g, "")
  if (!bersih) return ""
  const iKoma = bersih.indexOf(",")
  const adaKoma = iKoma !== -1
  const bulatMentah = adaKoma ? bersih.slice(0, iKoma) : bersih
  const desimal = adaKoma ? bersih.slice(iKoma + 1).replace(/,/g, "").slice(0, 2) : ""
  const bulat = bulatMentah.replace(/^0+(?=\d)/, "") || (adaKoma ? "0" : "")
  const bulatFormat = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return adaKoma ? `${bulatFormat},${desimal}` : bulatFormat
}

/** "1.250.000,5" -> 1250000.5 ; isian kosong/tidak valid -> 0. */
export function parseInputIDR(val: string): number {
  const n = parseFloat(val.replace(/\./g, "").replace(",", "."))
  return Number.isFinite(n) ? bulat2(n) : 0
}

/** Nilai dari database -> teks isian, mis. 1250000.5 -> "1.250.000,50". */
export function keIsian(num: number): string {
  if (!num) return ""
  const [bulat, desimal] = bulat2(num).toFixed(2).split(".")
  return formatInputIDR(desimal === "00" ? bulat : `${bulat},${desimal}`)
}

/** Format dokumen SP2B/SP3B: dua desimal, 0 tampil "-". */
export function formatDokumen(num: number): string {
  if (!num) return "-"
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}
