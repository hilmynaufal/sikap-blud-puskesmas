"use client"

import { useMemo } from "react"
import { DAFTAR_BULAN } from "@/lib/bulan"
import { exportExcel } from "@/lib/excel"
import type { BarisBulanan } from "@/lib/data"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { JudulHalaman, KartuFilter, KartuStat, Loader, SelectFilter, TombolAksi } from "@/components/puskesmas/dashboard-ui"
import { MatriksRekening } from "@/components/puskesmas/matriks"
import { BarHorizontal } from "@/components/puskesmas/charts"

interface Props {
  mode: "bulanan" | "kumulatif"
  rows: BarisBulanan[]
  tahun: number
  tahunList: number[]
  puskesmasId: number | null
  puskesmasList: { id: number; nama: string }[]
  terkunci: boolean
}

/** Dashboard Realisasi Bulanan (menu 21 lama) dan Kumulatif (menu 30 lama). */
export function DashboardRealisasi({ mode, rows, tahun, tahunList, puskesmasId, puskesmasList, terkunci }: Props) {
  const filter = useFilterQuery()
  const kumulatif = mode === "kumulatif"

  // Nilai yang ditampilkan per bulan: apa adanya, atau dijumlah berjalan untuk kumulatif.
  const tampil = useMemo(
    () =>
      rows.map((r) => {
        let berjalan = 0
        return { ...r, tampil: r.bulanan.map((v) => (kumulatif ? (berjalan += v) : v)) }
      }),
    [rows, kumulatif],
  )

  const pendapatan = rows.find((r) => r.kode === "4")?.total ?? 0
  const belanja = rows.find((r) => r.kode === "5")?.total ?? 0

  const topLeaves = rows
    .filter((r) => r.isLeaf && r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const exportKeExcel = () => {
    const nama = puskesmasId ? puskesmasList.find((p) => p.id === puskesmasId)?.nama ?? "" : ""
    const puskLabel = puskesmasId ? nama.replace(/\s+/g, "_") : "Semua_Puskesmas"
    exportExcel({
      headers: ["Kode Rekening", "Uraian", ...DAFTAR_BULAN, "Total"],
      rows: tampil.map((r) => [r.kode, r.uraian, ...r.tampil, r.total]),
      lebar: [25, 50, ...DAFTAR_BULAN.map(() => 15), 18],
      namaFile: `Realisasi${kumulatif ? "_Kumulatif" : ""}_${puskLabel}_${tahun}.xlsx`,
      namaSheet: "Realisasi",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <JudulHalaman
        judul={kumulatif ? "Dashboard Realisasi Kumulatif" : "Dashboard Realisasi Puskesmas"}
        subjudul={
          kumulatif ? "Monitoring akumulasi penyerapan anggaran dari bulan ke bulan." : "Monitoring rincian penyerapan anggaran per bulan."
        }
      />

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
            <SelectFilter ikon="fa-regular fa-calendar" value={tahun} onChange={(v) => filter.set({ tahun: v })}>
              {tahunList.map((t) => (
                <option key={t} value={t}>
                  {t}
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
        <Loader pesan="Mengambil data dari server..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KartuStat label="Total Pendapatan (YTD)" nilai={pendapatan} ikon="fa-money-bill-trend-up" warnaIkon="emerald" />
            <KartuStat label="Total Belanja (YTD)" nilai={belanja} ikon="fa-cart-shopping" warnaIkon="rose" />
            <KartuStat label="Surplus / Defisit" nilai={pendapatan - belanja} ikon="fa-scale-balanced" warnaIkon="blue" surplus />
          </div>

          <MatriksRekening
            judul={kumulatif ? "Matriks Realisasi Anggaran Kumulatif (YTD)" : "Matriks Realisasi Anggaran Per Bulan"}
            catatan={kumulatif ? "* Nilai kumulatif dalam Rupiah (IDR)" : "* Nilai dalam Rupiah (IDR)"}
            rows={tampil}
            rowKey={(r) => r.id}
            kolom={DAFTAR_BULAN.map((b, i) => ({ key: b, label: b, nilai: (r: (typeof tampil)[number]) => r.tampil[i] }))}
            labelTotal="Total"
            total={(r) => r.total}
          />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Top 5 Realisasi (Leaf Nodes)</h3>
            <div className="h-64">
              <BarHorizontal
                labels={topLeaves.map((d) => d.uraian.substring(0, 25))}
                data={topLeaves.map((d) => d.total)}
                label="Total Realisasi"
                warna="#3B82F6"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
