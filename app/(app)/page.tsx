import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { halamanAwal } from "@/lib/nav"

export default async function Home() {
  const user = await requireUser()
  redirect(halamanAwal(user.role))
}
