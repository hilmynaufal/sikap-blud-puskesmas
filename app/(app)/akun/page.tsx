import { requireUser } from "@/lib/auth"
import { PlainPage } from "@/components/shell/page-frame"
import { FormGantiPassword } from "./form-ganti-password"

export const metadata = { title: "Akun Saya" }

export default async function Page() {
  const user = await requireUser()
  return (
    <PlainPage title="Akun Saya" deskripsi={`${user.nama} · ${user.email}`}>
      <FormGantiPassword />
    </PlainPage>
  )
}
