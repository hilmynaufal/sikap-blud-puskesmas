import { requireUser } from "@/lib/auth"
import { menuUntuk } from "@/lib/nav"
import { AppShell } from "@/components/shell/app-shell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <AppShell
      menus={menuUntuk(user.role)}
      user={{ nama: user.nama, email: user.email, role: user.role, puskesmasNama: user.puskesmasNama }}
    >
      {children}
    </AppShell>
  )
}
