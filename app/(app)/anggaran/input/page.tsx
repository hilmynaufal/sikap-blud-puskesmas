import { requireUser } from "@/lib/auth"
import { daftarPuskesmas, daftarTahun, masterRekening, nilaiAnggaran } from "@/lib/data"
import { angka, pilihTahun, type SearchParams } from "@/lib/params"
import { InputAnggaran } from "./input-anggaran"

export const metadata = { title: "Input Anggaran Puskesmas" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const sp = await searchParams
  const tahunList = await daftarTahun()
  const tahun = pilihTahun(sp.tahun, tahunList)

  const puskesmasList = user.role === "ADMIN" ? await daftarPuskesmas() : []
  const puskesmasId = user.role === "OPERATOR" ? user.puskesmasId! : angka(sp.puskesmas) ?? puskesmasList[0]?.id
  const puskesmasNama =
    user.role === "OPERATOR" ? user.puskesmasNama! : puskesmasList.find((p) => p.id === puskesmasId)?.nama ?? "-"

  const [master, existing] = await Promise.all([
    masterRekening(tahun),
    puskesmasId ? nilaiAnggaran(puskesmasId, tahun) : Promise.resolve({}),
  ])

  return (
    <InputAnggaran
      key={`${puskesmasId}-${tahun}`}
      master={master}
      existing={existing}
      tahun={tahun}
      tahunList={[...new Set([tahun, ...tahunList])].sort((a, b) => b - a)}
      puskesmas={{ id: puskesmasId ?? null, nama: puskesmasNama }}
      puskesmasList={puskesmasList}
    />
  )
}
