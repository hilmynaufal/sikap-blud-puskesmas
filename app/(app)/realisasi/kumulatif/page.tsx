import type { SearchParams } from "@/lib/params"
import { HalamanRealisasi } from "../halaman-realisasi"

export const metadata = { title: "Dashboard Total Realisasi Kumulatif" }

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <HalamanRealisasi mode="kumulatif" searchParams={searchParams} />
}
