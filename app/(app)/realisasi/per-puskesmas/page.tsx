import { requireAdmin } from "@/lib/auth"
import { daftarPuskesmas, daftarTahun, realisasiPerPuskesmas } from "@/lib/data"
import { angka, pilihTahun, type SearchParams } from "@/lib/params"
import { MatriksPerPuskesmas } from "./matriks-per-puskesmas"

export const metadata = { title: "Realisasi Belanja Puskesmas Per-tahun" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const sp = await searchParams
  const [tahunList, puskesmasList] = await Promise.all([daftarTahun(), daftarPuskesmas()])
  const tahun = pilihTahun(sp.tahun, tahunList)
  const bulanQ = angka(sp.bulan)
  const bulan = bulanQ && bulanQ >= 1 && bulanQ <= 12 ? bulanQ : null
  const rows = await realisasiPerPuskesmas(tahun, bulan)

  return <MatriksPerPuskesmas rows={rows} tahun={tahun} tahunList={tahunList} bulan={bulan} puskesmasList={puskesmasList} />
}
