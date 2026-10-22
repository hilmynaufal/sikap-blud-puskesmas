"use client"

import { useCallback, useState } from "react"
import { Overlay } from "@/components/shell/page-frame"

type Tema = "indigo" | "emerald"
type Toast = { id: number; judul: string; pesan: string; tipe: "success" | "error"; keluar: boolean }

/** Toast pojok kanan atas, sama dengan showNotification() di layout input lama. */
export function useNotifikasi(tema: Tema) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const tampil = useCallback((judul: string, pesan: string, tipe: "success" | "error" = "success") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, judul, pesan, tipe, keluar: false }])
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, keluar: true } : x))), 4000)
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const sukses = tema === "indigo" ? "bg-indigo-600" : "bg-emerald-600"

  const elemen = (
    <Overlay>
    <div className="absolute top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${t.tipe === "success" ? sukses : "bg-red-600"} text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[320px] pointer-events-auto ${
            t.keluar ? "animate-slide-out" : "animate-slide-in"
          }`}
        >
          <div className="mt-0.5">
            <i className={`fa-solid ${t.tipe === "success" ? "fa-circle-check" : "fa-circle-exclamation"} text-lg`}></i>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{t.judul}</h4>
            <p className="text-xs opacity-90 mt-0.5">{t.pesan}</p>
          </div>
        </div>
      ))}
    </div>
    </Overlay>
  )

  return { tampil, elemen }
}
