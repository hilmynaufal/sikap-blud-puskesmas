import { requireUser, puskesmasUntuk } from "@/lib/auth"
import { dashboardAnggaran, daftarPuskesmas, daftarTahun, type JenisAnggaran } from "@/lib/data"
import { angka, type SearchParams } from "@/lib/params"
import { DashboardAnggaran } from "./dashboard-anggaran"

export const metadata = { title: "Dashboard Anggaran Puskesmas" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const sp = await searchParams
  const [tahunTersedia, puskesmasList] = await Promise.all([daftarTahun(), daftarPuskesmas()])
  // Kolom tahun: 3 tahun terakhir (seperti layout lama 2024–2026) + tahun lain yang punya bagan akun.
  const terbaru = tahunTersedia[0]
  const tahunKolom = [...new Set([...tahunTersedia, terbaru - 1, terbaru - 2])].sort((a, b) => a - b)
  const fokusQ = angka(sp.fokus)
  const fokus = fokusQ && tahunKolom.includes(fokusQ) ? fokusQ : null
  const puskesmasId = puskesmasUntuk(user, angka(sp.puskesmas))
  const jenisQ = Array.isArray(sp.jenis) ? sp.jenis[0] : sp.jenis
  const jenis: JenisAnggaran = jenisQ === "murni" || jenisQ === "perubahan" ? jenisQ : "efektif"
  const rows = await dashboardAnggaran(tahunKolom, puskesmasId, jenis)

  return (
    <DashboardAnggaran
      rows={rows}
      tahunKolom={tahunKolom}
      fokus={fokus}
      jenis={jenis}
      puskesmasId={puskesmasId}
      puskesmasList={puskesmasList}
      terkunci={user.role === "OPERATOR"}
    />
  )
}
