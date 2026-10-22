"use client"

import { useEffect, useState } from "react"
import { SelectFilter } from "@/components/puskesmas/dashboard-ui"

/**
 * true setelah komponen ter-hydrate. Sel input dikunci (readOnly) sebelum itu:
 * ketikan yang masuk sebelum hydrate akan ditimpa React ke nilai awal tanpa pemberitahuan.
 */
export function useSiapInput() {
  const [siap, setSiap] = useState(false)
  useEffect(() => setSiap(true), [])
  return siap
}

/** Pilihan puskesmas di halaman input: admin bisa memilih, operator terkunci ke puskesmasnya. */
export function PilihPuskesmas({
  puskesmas,
  puskesmasList,
  onChange,
}: {
  puskesmas: { id: number | null; nama: string }
  puskesmasList: { id: number; nama: string }[]
  onChange: (id: string) => void
}) {
  const terkunci = puskesmasList.length === 0
  return (
    <SelectFilter ikon="fa-solid fa-hospital" value={puskesmas.id ?? ""} disabled={terkunci} minW onChange={onChange}>
      {terkunci ? (
        <option value={puskesmas.id ?? ""}>{puskesmas.nama}</option>
      ) : (
        puskesmasList.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}
          </option>
        ))
      )}
    </SelectFilter>
  )
}

/** Wadah tabel input: tinggi dibatasi supaya bar simpan di bawahnya selalu terlihat. */
export function KartuTabelInput({ judul, keterangan, redup, children }: { judul: string; keterangan: string; redup: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-slate-800 text-lg">{judul}</h3>
        <span className="text-xs text-slate-400 italic">{keterangan}</span>
      </div>
      <div className={`overflow-auto max-h-[calc(100vh-26rem)] min-h-[320px] transition-opacity ${redup ? "opacity-50 pointer-events-none" : ""}`}>
        {children}
      </div>
    </div>
  )
}

/**
 * Bar ringkasan + tombol simpan (dulu footer fixed di dalam iframe).
 * Menempel di bawah area scroll supaya tombol simpan selalu terlihat di layar pendek.
 */
export function BarSimpan({ children, tombol }: { children: React.ReactNode; tombol: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 bg-white rounded-xl border border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] p-4 flex flex-col md:flex-row justify-between items-center gap-4">
      {children}
      {tombol}
    </div>
  )
}
