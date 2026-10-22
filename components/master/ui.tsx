"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/** Wadah tabel bergaya sama dengan halaman tabel menu-builder lama. */
export function KartuTabel({ toolbar, children }: { toolbar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {toolbar && <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">{toolbar}</div>}
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export const thCls = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200"
export const tdCls = "px-4 py-3 text-sm text-slate-700 border-b border-slate-100"
export const fieldCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"

export function Cari({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative max-w-md flex-1">
      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-900/5"
      />
    </div>
  )
}

export function TombolUtama({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 text-sm"
    >
      {children}
    </button>
  )
}

export function DialogForm({
  open,
  onOpenChange,
  judul,
  deskripsi,
  error,
  proses,
  onSimpan,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  judul: string
  deskripsi?: string
  error?: string | null
  proses?: boolean
  onSimpan: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{judul}</DialogTitle>
          {deskripsi && <DialogDescription>{deskripsi}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSimpan()
          }}
          className="space-y-4"
        >
          {children}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={proses}>
              {proses ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}
