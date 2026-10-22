"use client"

import { useEffect, useState } from "react"
import { DAFTAR_BULAN } from "@/lib/bulan"

export const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
export const filterCls =
  "px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"

/** Isian umum (dasar, urusan, BUD, dll.) diingat per browser supaya tidak diketik ulang tiap bulan. */
export function useIsianTersimpan<T extends Record<string, string>>(kunci: string, awal: T) {
  const [nilai, setNilai] = useState<T>(awal)
  useEffect(() => {
    try {
      const s = localStorage.getItem(kunci)
      if (s) setNilai((n) => ({ ...n, ...JSON.parse(s) }))
    } catch {}
  }, [kunci])
  const ubah = (k: keyof T, v: string) =>
    setNilai((n) => {
      const baru = { ...n, [k]: v }
      try {
        localStorage.setItem(kunci, JSON.stringify(baru))
      } catch {}
      return baru
    })
  return [nilai, ubah] as const
}

export function Label({ children, auto }: { children: React.ReactNode; auto?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {children}{" "}
      {auto && (
        <span className="text-blue-400 font-normal text-xs">
          <i className="fa-solid fa-rotate text-xs"></i> Auto
        </span>
      )}
    </label>
  )
}

export function KartuPengaturan({ ikon, judul, api, children }: { ikon: string; judul: string; api?: boolean; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${api ? "border-blue-100" : "border-slate-200"} overflow-hidden`}>
      <div
        className={`${api ? "bg-blue-50 border-blue-100 justify-between" : "bg-slate-50 border-slate-200"} border-b px-4 py-2.5 flex items-center gap-2`}
      >
        <div className="flex items-center gap-2">
          <i className={`fa-solid ${ikon} text-blue-600 text-xs`}></i>
          <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">{judul}</h3>
        </div>
        {api && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            <i className="fa-solid fa-database text-xs mr-1"></i>DB
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

export function FieldApi({ label, nilai, kecil }: { label: string; nilai: number; kecil?: boolean }) {
  if (kecil) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
        <input value={nilai} readOnly className="api-field flex-1 px-2 py-1.5 text-xs border border-blue-200 rounded-lg outline-none" />
      </div>
    )
  }
  return (
    <div>
      <Label>{label}</Label>
      <input value={nilai} readOnly className="api-field w-full px-3 py-2 text-sm border border-blue-200 rounded-lg outline-none" />
    </div>
  )
}

export function FilterPeriode({
  puskesmasId,
  puskesmasList,
  terkunci,
  bulan,
  tahun,
  tahunList,
  onChange,
}: {
  puskesmasId: number | null
  puskesmasList: { id: number; nama: string }[]
  terkunci: boolean
  bulan: number
  tahun: number
  tahunList: number[]
  onChange: (u: Record<string, string>) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-medium text-slate-500">Puskesmas</label>
        <select
          value={puskesmasId ?? ""}
          disabled={terkunci}
          onChange={(e) => onChange({ puskesmas: e.target.value })}
          className={`${filterCls} min-w-[200px] ${terkunci ? "!bg-gray-200 cursor-not-allowed" : ""}`}
        >
          {puskesmasList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-medium text-slate-500">Bulan</label>
        <select value={bulan} onChange={(e) => onChange({ bulan: e.target.value })} className={filterCls}>
          {DAFTAR_BULAN.map((b, i) => (
            <option key={b} value={i + 1}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-medium text-slate-500">Tahun</label>
        <select value={tahun} onChange={(e) => onChange({ tahun: e.target.value })} className={filterCls}>
          {tahunList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export function OverlayMemuat() {
  return (
    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
      <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="text-slate-600 font-medium">Memuat data dari server…</p>
    </div>
  )
}

/** Minta PDF ke server lalu unduh. */
export async function unduhPdf(jenis: "sp3b" | "sp2b", body: unknown): Promise<string | null> {
  const res = await fetch(`/api/laporan/${jenis}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => null)
    return j?.message ?? "Gagal membuat PDF"
  }
  const blob = await res.blob()
  const nama = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `${jenis}.pdf`
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
  return null
}

export function hariIni() {
  return new Date().toLocaleDateString("en-CA")
}
