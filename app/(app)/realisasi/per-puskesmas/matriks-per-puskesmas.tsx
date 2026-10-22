"use client"

import { DAFTAR_BULAN } from "@/lib/bulan"
import { exportExcel } from "@/lib/excel"
import type { BarisPerPuskesmas } from "@/lib/data"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { JudulHalaman, KartuFilter, KartuStat, Loader, SelectFilter, TombolAksi } from "@/components/puskesmas/dashboard-ui"
import { MatriksRekening } from "@/components/puskesmas/matriks"
import { BarHorizontal, Donat, potong } from "@/components/puskesmas/charts"

interface Props {
  rows: BarisPerPuskesmas[]
  tahun: number
  tahunList: number[]
  bulan: number | null
  puskesmasList: { id: number; nama: string }[]
}

/** Matriks Realisasi Per Puskesmas (menu 28 aplikasi lama, khusus admin kabupaten). */
export function MatriksPerPuskesmas({ rows, tahun, tahunList, bulan, puskesmasList }: Props) {
  const filter = useFilterQuery()

  const pendapatan = rows.find((r) => r.kode === "4")?.total ?? 0
  const belanja = rows.find((r) => r.kode === "5")?.total ?? 0

  const topRekening = rows
    .filter((r) => r.isLeaf && r.total > 0 && r.kode.startsWith("5"))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const belanjaRoot = rows.find((r) => r.kode === "5")

  const exportKeExcel = () => {
    const bulanLabel = bulan ? DAFTAR_BULAN[bulan - 1] : "Semua_Bulan"
    exportExcel({
      headers: ["Kode Rekening", "Uraian Rekening", ...puskesmasList.map((p) => p.nama), "Total Realisasi"],
      rows: rows.map((r) => [r.kode, r.uraian, ...puskesmasList.map((p) => r.perPuskesmas[p.id] ?? 0), r.total]),
      lebar: [25, 50, ...puskesmasList.map(() => 18), 20],
      namaFile: `Realisasi_Per_Puskesmas_${tahun}_${bulanLabel}.xlsx`,
      namaSheet: "Realisasi",
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <JudulHalaman
        judul="Realisasi Belanja Puskesmas Per-tahun"
        subjudul="Akumulasi realisasi bulanan berdasarkan Puskesmas dan Kode Rekening."
      />

      <KartuFilter
        filter={
          <>
            <SelectFilter ikon="fa-regular fa-calendar" fokus="indigo" value={tahun} onChange={(v) => filter.set({ tahun: v })}>
              {tahunList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter
              ikon="fa-regular fa-clock"
              fokus="indigo"
              value={bulan ?? "Semua"}
              onChange={(v) => filter.set({ bulan: v === "Semua" ? null : v })}
            >
              <option value="Semua">Semua Bulan</option>
              {DAFTAR_BULAN.map((b, i) => (
                <option key={b} value={i + 1}>
                  {b}
                </option>
              ))}
            </SelectFilter>
          </>
        }
        aksi={
          <>
            <TombolAksi ikon="fa-arrows-rotate" label="Refresh" warna="indigo" onClick={filter.refresh} />
            <TombolAksi ikon="fa-file-excel" label="Export Excel" warna="emerald" onClick={exportKeExcel} />
          </>
        }
      />

      {filter.pending ? (
        <Loader pesan="Mengkalkulasi data realisasi..." indigo />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KartuStat label="Realisasi Pendapatan" nilai={pendapatan} ikon="fa-vault" warnaIkon="emerald" besar="text-2xl" />
            <KartuStat label="Realisasi Belanja" nilai={belanja} ikon="fa-hand-holding-dollar" warnaIkon="rose" besar="text-2xl" />
            <KartuStat label="Surplus / Defisit" nilai={pendapatan - belanja} ikon="fa-scale-balanced" warnaIkon="indigo" besar="text-2xl" surplus />
          </div>

          <MatriksRekening
            judul="Matriks Realisasi Per Puskesmas"
            catatan={`Data akumulasi ${bulan ? DAFTAR_BULAN[bulan - 1] : "semua bulan"} ${tahun} · IDR (Rupiah)`}
            rows={rows}
            rowKey={(r) => r.id}
            kolom={puskesmasList.map((p) => ({ key: p.id, label: p.nama, nilai: (r: BarisPerPuskesmas) => r.perPuskesmas[p.id] ?? 0 }))}
            labelTotal="Total Realisasi"
            total={(r) => r.total}
            badge="ITEM"
            tegasLevelAtas
            lebarKolom={140}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>5 Rekening Realisasi Terbesar (Belanja)
              </h3>
              <div className="h-80">
                <BarHorizontal
                  labels={topRekening.map((d) => potong(d.uraian, 25))}
                  data={topRekening.map((d) => d.total)}
                  label="Nilai Realisasi"
                  warna="#6366F1"
                  radius={4}
                  tampilSumbuX
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>Proporsi Realisasi Per Puskesmas
              </h3>
              <div className="h-80">
                <Donat labels={puskesmasList.map((p) => p.nama)} data={puskesmasList.map((p) => belanjaRoot?.perPuskesmas[p.id] ?? 0)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
