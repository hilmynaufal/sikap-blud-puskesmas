import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { daftarTahun, masterRekening } from "@/lib/data"
import { pilihTahun, type SearchParams } from "@/lib/params"
import { PlainPage } from "@/components/shell/page-frame"
import { KelolaRekening } from "./kelola-rekening"

export const metadata = { title: "Master Kode Rekening" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const sp = await searchParams
  const tahunList = await daftarTahun()
  const tahun = pilihTahun(sp.tahun, tahunList)
  const [rows, dipakai] = await Promise.all([
    masterRekening(tahun),
    prisma.kodeRekening.findMany({
      where: { tahun, OR: [{ anggaran: { some: {} } }, { realisasi: { some: {} } }] },
      select: { id: true },
    }),
  ])

  return (
    <PlainPage title="Master Kode Rekening" deskripsi="Bagan akun per tahun anggaran. Hanya baris rincian (leaf) yang bisa diisi nilai.">
      <KelolaRekening rows={rows} tahun={tahun} tahunList={tahunList} dipakai={dipakai.map((d) => d.id)} />
    </PlainPage>
  )
}
