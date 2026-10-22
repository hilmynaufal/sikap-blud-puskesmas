import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { daftarPuskesmas } from "@/lib/data"
import { PlainPage } from "@/components/shell/page-frame"
import { KelolaSilpa } from "./kelola-silpa"

export const metadata = { title: "SILPA Puskesmas" }

export default async function Page() {
  await requireAdmin()
  const [puskesmas, silpa] = await Promise.all([
    daftarPuskesmas(),
    prisma.silpa.findMany({ select: { puskesmasId: true, tahun: true, nilai: true } }),
  ])
  const tahunAda = silpa.map((s) => s.tahun)
  const tahunTerakhir = Math.max(new Date().getFullYear() - 1, ...tahunAda)
  const tahunKolom = [...new Set([...tahunAda, tahunTerakhir])].sort((a, b) => a - b)
  const nilai: Record<string, number> = {}
  for (const s of silpa) nilai[`${s.puskesmasId}-${s.tahun}`] = Number(s.nilai)

  return (
    <PlainPage
      title="SILPA Puskesmas"
      deskripsi="SILPA akhir tahun menjadi saldo awal SP2B/SP3B pada tahun berikutnya (dibulatkan ke bawah)."
    >
      <KelolaSilpa puskesmas={puskesmas} tahunKolom={tahunKolom} nilai={nilai} />
    </PlainPage>
  )
}
