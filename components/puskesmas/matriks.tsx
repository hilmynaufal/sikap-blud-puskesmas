"use client"

import { formatIDR } from "@/lib/format"

export type BarisMatriks = { kode: string; uraian: string; isLeaf: boolean; level: number }

export type KolomMatriks<T> = {
  key: string | number
  label: string
  nilai: (row: T) => number
  /** Kolom yang sedang difokuskan (mis. tahun terpilih di dashboard anggaran). */
  sorot?: boolean
}

interface Props<T extends BarisMatriks> {
  judul: string
  catatan: React.ReactNode
  rows: T[]
  rowKey: (row: T) => string | number
  kolom: KolomMatriks<T>[]
  labelTotal: string
  total: (row: T) => number
  badge?: "LEAF" | "ITEM"
  /** Tebalkan baris akun level teratas (4/5), seperti matriks per puskesmas lama. */
  tegasLevelAtas?: boolean
  lebarKolom?: number
}

// Lebar kolom sticky harus tetap: kolom uraian menempel tepat di sisi kanan kolom kode.
// Di layout lama kolom kode melebar sampai ±270px sementara uraian menempel di 150px,
// sehingga kode tertutup saat tabel digeser ke kanan.
const LEBAR_KODE = 230
const LEBAR_URAIAN = 340
const INDENT = 10

/** Tabel matriks rekening × kolom (bulan / tahun / puskesmas) dengan kolom kode & uraian menempel. */
export function MatriksRekening<T extends BarisMatriks>({
  judul,
  catatan,
  rows,
  rowKey,
  kolom,
  labelTotal,
  total,
  badge = "LEAF",
  tegasLevelAtas,
  lebarKolom = 110,
}: Props<T>) {
  const kodeStyle = { width: LEBAR_KODE, minWidth: LEBAR_KODE, maxWidth: LEBAR_KODE }
  const uraianStyle = { left: LEBAR_KODE, width: LEBAR_URAIAN, minWidth: LEBAR_URAIAN, maxWidth: LEBAR_URAIAN }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-slate-800 text-lg">{judul}</h3>
        <span className="text-xs text-slate-400 italic">{catatan}</span>
      </div>
      {/* Tinggi dibatasi agar scrollbar horizontal & header selalu terlihat tanpa scroll ke baris terakhir. */}
      <div className="overflow-auto max-h-[70vh]">
        <table className="text-left text-sm border-separate border-spacing-0">
          <thead className="text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-4 font-bold border-b border-r border-slate-200 sticky top-0 left-0 bg-slate-50 z-30" style={kodeStyle}>
                Kode Rekening
              </th>
              <th
                className="px-4 py-4 font-bold border-b border-r border-slate-200 sticky top-0 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                style={uraianStyle}
              >
                Uraian
              </th>
              {kolom.map((k) => (
                <th
                  key={k.key}
                  className={`px-4 py-4 font-bold text-right border-b border-r border-slate-200 sticky top-0 z-20 ${k.sorot ? "bg-blue-50 text-blue-700" : "bg-slate-50"}`}
                  style={{ minWidth: lebarKolom }}
                >
                  {k.label}
                </th>
              ))}
              <th className="px-4 py-4 font-bold text-right border-b border-slate-200 min-w-[140px] whitespace-nowrap sticky top-0 bg-slate-100 z-20">
                {labelTotal}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isParent = !row.isLeaf
              const levelAtas = tegasLevelAtas && row.level === 0
              // Latar sel sticky harus solid supaya kolom angka tidak tembus saat digeser.
              const latar = levelAtas ? "bg-slate-100" : isParent ? "bg-slate-50" : "bg-white"
              const tot = total(row)
              return (
                <tr key={rowKey(row)} className={`group ${levelAtas ? "font-bold text-slate-900" : isParent ? "font-semibold" : ""}`}>
                  <td
                    className={`py-3 pr-3 sticky left-0 z-10 border-b border-r border-slate-100 font-mono text-xs text-slate-600 break-all ${latar} group-hover:bg-blue-50`}
                    style={{ ...kodeStyle, paddingLeft: 16 + row.level * INDENT }}
                  >
                    {row.kode}
                  </td>
                  <td
                    className={`px-4 py-3 sticky z-10 border-b border-r border-slate-100 text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] ${latar} group-hover:bg-blue-50`}
                    style={uraianStyle}
                  >
                    <span className="align-middle">{row.uraian}</span>
                    {!isParent && <span className={`${badge === "ITEM" ? "leaf-badge-item" : "leaf-badge"} align-middle`}>{badge}</span>}
                  </td>
                  {kolom.map((k) => {
                    const v = k.nilai(row)
                    return (
                      <td
                        key={k.key}
                        className={`px-4 py-3 text-right text-xs font-mono whitespace-nowrap border-b border-r border-slate-100 ${
                          k.sorot ? "bg-blue-50 font-bold" : isParent ? "bg-slate-50/50" : ""
                        } group-hover:bg-blue-50/50 ${v > 0 ? "text-slate-900" : "text-slate-300"}`}
                      >
                        {formatIDR(v)}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap border-b border-slate-100 bg-slate-50 group-hover:bg-blue-50">
                    {formatIDR(tot)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
