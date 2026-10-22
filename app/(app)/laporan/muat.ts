import "server-only"
import { requireUser } from "@/lib/auth"
import { daftarPuskesmas, daftarTahun } from "@/lib/data"
import { hitungKeuangan, infoPuskesmas } from "@/lib/laporan"
import { angka, pilihTahun } from "@/lib/params"

/** Data bersama halaman generator SP2B/SP3B. */
export async function muatLaporan(sp: Record<string, string | string[] | undefined>) {
  const user = await requireUser()
  const [tahunList, semua] = await Promise.all([daftarTahun(), daftarPuskesmas()])
  const tahun = pilihTahun(sp.tahun, tahunList)
  const bulanQ = angka(sp.bulan)
  const bulan = bulanQ && bulanQ >= 1 && bulanQ <= 12 ? bulanQ : new Date().getMonth() + 1

  const puskesmasId =
    user.role === "OPERATOR"
      ? user.puskesmasId!
      : angka(sp.puskesmas) ?? semua.find((p) => p.nama === "Puskesmas Rancabali")?.id ?? semua[0]?.id
  const pusk = puskesmasId ? await infoPuskesmas(puskesmasId) : null
  const keuangan = puskesmasId ? await hitungKeuangan(puskesmasId, tahun, bulan) : null

  return {
    user,
    tahun,
    tahunList,
    bulan,
    puskesmasList: user.role === "OPERATOR" ? semua.filter((p) => p.id === user.puskesmasId) : semua,
    terkunci: user.role === "OPERATOR",
    pusk,
    keuangan,
  }
}
