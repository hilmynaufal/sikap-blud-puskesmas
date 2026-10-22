/** Kedalaman kode = jumlah titik ("5.1.02" -> 2). */
export function levelKode(kode: string): number {
  return (kode.match(/\./g) || []).length
}

/**
 * Induk = prefix terpanjang (dipotong per segmen titik) yang ada di himpunan kode.
 * Bagan akun lama punya lubang (mis. 5.1.01.02.06.0022 tanpa 5.1.01.02), jadi
 * induk tidak selalu satu level di atasnya.
 */
export function cariKodeInduk(kode: string, semuaKode: Set<string>): string | null {
  const parts = kode.split(".")
  while (parts.length > 1) {
    parts.pop()
    const kandidat = parts.join(".")
    if (semuaKode.has(kandidat)) return kandidat
  }
  return null
}

export function bandingkanKode(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}
