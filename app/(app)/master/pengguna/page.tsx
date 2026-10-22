import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { daftarPuskesmas } from "@/lib/data"
import { PlainPage } from "@/components/shell/page-frame"
import { KelolaPengguna } from "./kelola-pengguna"

export const metadata = { title: "Pengguna" }

export default async function Page() {
  const me = await requireAdmin()
  const [users, puskesmas] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { nama: "asc" }],
      select: { id: true, email: true, nama: true, role: true, puskesmasId: true, aktif: true, lastLoginAt: true, puskesmas: { select: { nama: true } } },
    }),
    daftarPuskesmas(),
  ])
  return (
    <PlainPage title="Pengguna" deskripsi="Operator terikat ke satu puskesmas; admin kabupaten melihat semua puskesmas.">
      <KelolaPengguna
        meId={me.id}
        puskesmas={puskesmas}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          nama: u.nama,
          role: u.role,
          puskesmasId: u.puskesmasId,
          puskesmasNama: u.puskesmas?.nama ?? null,
          aktif: u.aktif,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </PlainPage>
  )
}
