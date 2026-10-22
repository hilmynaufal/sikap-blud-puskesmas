import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PlainPage } from "@/components/shell/page-frame"
import { KelolaPuskesmas } from "./kelola-puskesmas"

export const metadata = { title: "Master Puskesmas" }

export default async function Page() {
  await requireAdmin()
  const rows = await prisma.puskesmas.findMany({
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, namaKepala: true, nipKepala: true, jabatanKepala: true, _count: { select: { users: true } } },
  })
  return (
    <PlainPage title="Puskesmas & Kepala" deskripsi="Data kepala puskesmas dipakai otomatis sebagai penandatangan SP3B.">
      <KelolaPuskesmas rows={rows.map(({ _count, ...r }) => ({ ...r, jumlahAkun: _count.users }))} />
    </PlainPage>
  )
}
