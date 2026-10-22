"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Lapisan fixed di atas seluruh layar untuk toast, modal, dan overlay memuat.
 * Anak-anaknya diposisikan `absolute` terhadap lapisan ini.
 */
export function Overlay({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[90] [&>*]:pointer-events-auto">{children}</div>,
    document.body,
  )
}

/** Judul halaman + aksi opsional, dipakai halaman master data & akun. */
export function PlainPage({
  title,
  deskripsi,
  actions,
  children,
}: {
  title: string
  deskripsi?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {deskripsi && <p className="text-slate-500">{deskripsi}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
