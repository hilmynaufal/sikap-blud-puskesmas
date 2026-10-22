"use client"

import { exportExcel } from "@/lib/excel"
import type { BarisTahunan } from "@/lib/data"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { JudulHalaman, KartuFilter, KartuStat, Loader, SelectFilter, TombolAksi } from "@/components/puskesmas/dashboard-ui"
import { MatriksRekening } from "@/components/puskesmas/matriks"
import { BarHorizontal, potong } from "@/components/puskesmas/charts"

interface Props {
  rows: BarisTahunan[]
  tahunKolom: number[]
  fokus: number | null
  puskesmasId: number | null
  puskesmasList: { id: number; nama: string }[]
  terkunci: boolean
}

/** Dashboard Anggaran Puskesmas (menu 25 aplikasi lama). */
export function DashboardAnggaran({ rows, tahunKolom, fokus, puskesmasId, puskesmasList, terkunci }: Props) {
  const filter = useFilterQuery()
  const nilaiFokus = (r: BarisTahunan | undefined) => (r ? (fokus ? r.tahunan[fokus] ?? 0 : r.total) : 0)

  const pendapatan = nilaiFokus(rows.find((r) => r.kode === "4"))
  const belanja = nilaiFokus(rows.find((r) => r.kode === "5"))

  const chartData = rows
    .filter((r) => r.isLeaf)
    .map((r) => ({ label: r.uraian, value: nilaiFokus(r) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const exportKeExcel = () => {
    const nama = puskesmasId ? puskesmasList.find((p) => p.id === puskesmasId)?.nama ?? "" : ""
    const puskLabel = puskesmasId ? nama.replace(/\s+/g, "_") : "Semua_Puskesmas"
    const tahunLabel = fokus ? `Tahun_${fokus}` : "Semua_Tahun"
    exportExcel({
      headers: ["Kode Rekening", "Uraian Rekening", ...tahunKolom.map((t) => `Thn ${t}`), "Total Akumulasi"],
      rows: rows.map((r) => [r.kode, r.uraian, ...tahunKolom.map((t) => r.tahunan[t] ?? 0), nilaiFokus(r)]),
      lebar: [25, 50, ...tahunKolom.map(() => 20), 22],
      namaFile: `Anggaran_${puskLabel}_${tahunLabel}.xlsx`,
      namaSheet: "Anggaran",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <JudulHalaman judul="Dashboard Anggaran Puskesmas" subjudul="Monitoring perbandingan nilai anggaran antar tahun anggaran." />

      <KartuFilter
        filter={
          <>
            <SelectFilter
              ikon="fa-solid fa-hospital"
              value={puskesmasId ?? "all"}
              disabled={terkunci}
              minW
              onChange={(v) => filter.set({ puskesmas: v === "all" ? null : v })}
            >
              <option value="all">Semua Puskesmas</option>
              {puskesmasList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter ikon="fa-regular fa-calendar" value={fokus ?? "all"} onChange={(v) => filter.set({ fokus: v === "all" ? null : v })}>
              <option value="all">Tampilkan Semua Tahun</option>
              {[...tahunKolom].reverse().map((t) => (
                <option key={t} value={t}>
                  Fokus Tahun {t}
                </option>
              ))}
            </SelectFilter>
          </>
        }
        aksi={
          <>
            <TombolAksi ikon="fa-arrows-rotate" label="Refresh" warna="blue" onClick={filter.refresh} />
            <TombolAksi ikon="fa-file-excel" label="Export Excel" warna="emerald" onClick={exportKeExcel} />
          </>
        }
      />

      {filter.pending ? (
        <Loader pesan="Mengambil data anggaran..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KartuStat label="Total Anggaran Pendapatan" nilai={pendapatan} ikon="fa-wallet" warnaIkon="emerald" />
            <KartuStat label="Total Anggaran Belanja" nilai={belanja} ikon="fa-hand-holding-dollar" warnaIkon="rose" />
            <KartuStat label="Rencana Surplus/Defisit" nilai={pendapatan - belanja} ikon="fa-scale-balanced" warnaIkon="blue" surplus />
          </div>

          <MatriksRekening
            judul="Matriks Anggaran Per Tahun"
            catatan="* Nilai Anggaran dalam Rupiah (IDR)"
            rows={rows}
            rowKey={(r) => r.kode}
            kolom={tahunKolom.map((t) => ({ key: t, label: `Thn ${t}`, nilai: (r: BarisTahunan) => r.tahunan[t] ?? 0, sorot: fokus === t }))}
            labelTotal="Total Akumulasi"
            total={(r) => r.total}
            lebarKolom={140}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Komposisi Anggaran Terbesar (Leaf Nodes)</h3>
            <div className="h-64">
              <BarHorizontal
                labels={chartData.map((d) => potong(d.label, 30))}
                data={chartData.map((d) => d.value)}
                label={fokus ? `Anggaran Tahun ${fokus}` : "Total Anggaran Accumulative"}
                warna="#2563EB"
                legend
                fontKecil
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
