"use client"

import { formatCurrency } from "@/lib/format"

export function KartuStat({
  label,
  nilai,
  ikon,
  warnaIkon,
  besar = "text-3xl",
  surplus,
}: {
  label: string
  nilai: number
  ikon: string
  warnaIkon: "emerald" | "rose" | "blue" | "indigo"
  besar?: "text-3xl" | "text-2xl"
  /** Kartu surplus: hijau kalau >= 0, merah kalau < 0. */
  surplus?: boolean
}) {
  const ikonCls = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
  }[warnaIkon]
  const warnaNilai = surplus ? (nilai < 0 ? "text-rose-600" : "text-emerald-600") : "text-slate-800"
  // Ukuran font mengikuti lebar kartu (container query) supaya angka miliaran tidak terpotong;
  // "Rp" dipisah spasi biasa (bukan nbsp dari Intl) agar boleh turun baris di kartu sempit.
  const ukuran = besar === "text-3xl" ? "[font-size:clamp(1.125rem,6.5cqw,1.875rem)]" : "[font-size:clamp(1.05rem,6cqw,1.5rem)]"
  const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.abs(nilai))
  return (
    <div className="@container bg-white rounded-xl p-6 shadow-sm border border-slate-100 min-w-0">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className={`${ukuran} leading-tight font-bold ${warnaNilai} mt-2 tabular-nums`} title={formatCurrency(nilai)}>
            {nilai < 0 ? "-" : ""}Rp {angka}
          </h3>
        </div>
        <div className={`hidden @[18rem]:block p-3 ${ikonCls} rounded-lg shrink-0`}>
          <i className={`fa-solid ${ikon} text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

export function SelectFilter({
  ikon,
  value,
  onChange,
  disabled,
  minW,
  fokus = "blue",
  children,
}: {
  ikon: string
  value: string | number
  onChange: (v: string) => void
  disabled?: boolean
  minW?: boolean
  fokus?: "blue" | "indigo"
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i className={`${ikon} text-slate-400 text-xs`}></i>
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-8 pr-4 py-2 border-none text-sm rounded-lg focus:ring-2 ${
          fokus === "blue" ? "focus:ring-blue-500" : "focus:ring-indigo-500"
        } block w-full font-medium text-slate-700 ${minW ? "min-w-[200px]" : ""} ${
          disabled ? "bg-gray-200 cursor-not-allowed" : "bg-gray-50"
        }`}
      >
        {children}
      </select>
    </div>
  )
}

export function Loader({ pesan, indigo }: { pesan: string; indigo?: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <div className={`loader ${indigo ? "loader-indigo mb-4" : ""}`}></div>
      <span className={`${indigo ? "animate-pulse" : "ml-3 mt-4"} text-slate-500`}>{pesan}</span>
    </div>
  )
}

/** Judul + subjudul halaman dashboard (tanpa frame). */
export function JudulHalaman({ judul, subjudul }: { judul: string; subjudul: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{judul}</h1>
      <p className="text-slate-500">{subjudul}</p>
    </div>
  )
}

/** Kartu filter: select di kiri, tombol aksi di kanan. */
export function KartuFilter({ filter, aksi }: { filter: React.ReactNode; aksi: React.ReactNode }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
      {filter}
      <div className="flex-1" />
      {aksi}
    </div>
  )
}

export function TombolAksi({ ikon, label, warna, onClick }: { ikon: string; label: string; warna: "blue" | "indigo" | "emerald"; onClick: () => void }) {
  const hover = {
    blue: "hover:text-blue-600 hover:bg-blue-50",
    indigo: "hover:text-indigo-600 hover:bg-indigo-50",
    emerald: "hover:text-emerald-600 hover:bg-emerald-50",
  }[warna]
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 ${hover} rounded-lg transition`}>
      <i className={`fa-solid ${ikon}`}></i>
      <span>{label}</span>
    </button>
  )
}
