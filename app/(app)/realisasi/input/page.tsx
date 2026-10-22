import { requireUser } from "@/lib/auth"
import { daftarPuskesmas, daftarTahun, masterRekening, nilaiRealisasi } from "@/lib/data"
import { angka, pilihTahun, type SearchParams } from "@/lib/params"
import { InputRealisasi } from "./input-realisasi"

export const metadata = { title: "Input Realisasi Puskesmas" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const sp = await searchParams
  const tahunList = await daftarTahun()
  const tahun = pilihTahun(sp.tahun, tahunList)
  const bulanQ = angka(sp.bulan)
  const bulan = bulanQ && bulanQ >= 1 && bulanQ <= 12 ? bulanQ : new Date().getMonth() + 1

  const puskesmasList = user.role === "ADMIN" ? await daftarPuskesmas() : []
  // Operator dikunci ke puskesmasnya; admin memilih lewat ?puskesmas=
  const puskesmasId = user.role === "OPERATOR" ? user.puskesmasId! : angka(sp.puskesmas) ?? puskesmasList[0]?.id
  const puskesmasNama =
    user.role === "OPERATOR" ? user.puskesmasNama! : puskesmasList.find((p) => p.id === puskesmasId)?.nama ?? "-"

  const [master, existing] = await Promise.all([
    masterRekening(tahun),
    puskesmasId ? nilaiRealisasi(puskesmasId, tahun, bulan) : Promise.resolve({}),
  ])

  return (
    <InputRealisasi
      key={`${puskesmasId}-${tahun}-${bulan}`}
      master={master}
      existing={existing}
      tahun={tahun}
      tahunList={[...new Set([tahun, ...tahunList])].sort((a, b) => b - a)}
      bulan={bulan}
      puskesmas={{ id: puskesmasId ?? null, nama: puskesmasNama }}
      puskesmasList={puskesmasList}
    />
  )
}
