import type { SearchParams } from "@/lib/params"
import { HalamanRealisasi } from "../halaman-realisasi"

export const metadata = { title: "Dashboard Realisasi Puskesmas" }

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <HalamanRealisasi mode="bulanan" searchParams={searchParams} />
}
