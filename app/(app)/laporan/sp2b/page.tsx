import type { SearchParams } from "@/lib/params"
import { muatLaporan } from "../muat"
import { GeneratorSp2b } from "./generator-sp2b"

export const metadata = { title: "SP2B" }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const d = await muatLaporan(await searchParams)
  return (
    <GeneratorSp2b
      key={`${d.pusk?.id}-${d.tahun}-${d.bulan}`}
      tahun={d.tahun}
      tahunList={d.tahunList}
      bulan={d.bulan}
      puskesmasList={d.puskesmasList}
      terkunci={d.terkunci}
      pusk={d.pusk}
      keuangan={d.keuangan}
    />
  )
}
