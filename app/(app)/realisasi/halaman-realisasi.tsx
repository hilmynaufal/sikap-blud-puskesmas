import { requireUser, puskesmasUntuk } from "@/lib/auth"
import { dashboardRealisasi, daftarPuskesmas, daftarTahun } from "@/lib/data"
import { angka, pilihTahun, type SearchParams } from "@/lib/params"
import { DashboardRealisasi } from "./dashboard-realisasi"

/** Server wrapper bersama untuk dashboard bulanan & kumulatif. */
export async function HalamanRealisasi({ mode, searchParams }: { mode: "bulanan" | "kumulatif"; searchParams: SearchParams }) {
  const user = await requireUser()
  const sp = await searchParams
  const [tahunList, puskesmasList] = await Promise.all([daftarTahun(), daftarPuskesmas()])
  const tahun = pilihTahun(sp.tahun, tahunList)
  const puskesmasId = puskesmasUntuk(user, angka(sp.puskesmas))
  const rows = await dashboardRealisasi(tahun, puskesmasId)

  return (
    <DashboardRealisasi
      mode={mode}
      rows={rows}
      tahun={tahun}
      tahunList={tahunList}
      puskesmasId={puskesmasId}
      puskesmasList={puskesmasList}
      terkunci={user.role === "OPERATOR"}
    />
  )
}
