import "server-only"
import { prisma } from "@/lib/db"

export type DataKeuangan = {
  saldoAwal: number
  pendapatan: number
  belanja: number
  saldoAkhir: number
  bPegawai: number
  bBarang: number
  bModal: number
  /** Banyak kode pendapatan (leaf) bernilai bulan ini; menentukan jumlah baris tabel SP3B. */
  jumlahKodePendapatan: number
}

/**
 * Perhitungan SP2B/SP3B, sama dengan calcSP3B() di generator lama:
 * - pendapatan/belanja = jumlah rekening rincian (leaf) berawalan 4/5 pada bulan tsb
 * - saldo awal = SILPA tahun lalu (dibulatkan ke bawah) + (pendapatan - belanja) Januari s.d. bulan sebelumnya
 */
export async function hitungKeuangan(puskesmasId: number, tahun: number, bulan: number): Promise<DataKeuangan> {
  const rows = await prisma.realisasi.findMany({
    where: { puskesmasId, tahun, bulan: { lte: bulan }, kodeRekening: { isLeaf: true } },
    select: { bulan: true, nilai: true, kodeRekening: { select: { kode: true } } },
  })

  const jumlah = (filterBulan: (b: number) => boolean, prefix: string) =>
    rows
      .filter((r) => filterBulan(r.bulan) && r.kodeRekening.kode.startsWith(prefix))
      .reduce((s, r) => s + Number(r.nilai), 0)

  const ini = (b: number) => b === bulan
  const sebelum = (b: number) => b < bulan

  const silpa = await prisma.silpa.findUnique({
    where: { puskesmasId_tahun: { puskesmasId, tahun: tahun - 1 } },
    select: { nilai: true },
  })
  const silpaLalu = silpa ? Math.floor(Number(silpa.nilai)) : 0

  const pendapatan = jumlah(ini, "4")
  const belanja = jumlah(ini, "5")
  const saldoAwal = silpaLalu + jumlah(sebelum, "4") - jumlah(sebelum, "5")

  return {
    saldoAwal,
    pendapatan,
    belanja,
    saldoAkhir: saldoAwal + pendapatan - belanja,
    bPegawai: jumlah(ini, "5.1.01"),
    bBarang: jumlah(ini, "5.1.02"),
    bModal: jumlah(ini, "5.2"),
    jumlahKodePendapatan: new Set(
      rows.filter((r) => ini(r.bulan) && r.kodeRekening.kode.startsWith("4") && Number(r.nilai) > 0).map((r) => r.kodeRekening.kode),
    ).size,
  }
}

export async function infoPuskesmas(puskesmasId: number) {
  return prisma.puskesmas.findUnique({
    where: { id: puskesmasId },
    select: { id: true, nama: true, namaKepala: true, nipKepala: true, jabatanKepala: true },
  })
}
