"use client"

import { useEffect, useState } from "react"
import { Overlay } from "@/components/shell/page-frame"

export type StatusModal = "tutup" | "konfirmasi" | "menyimpan" | "berhasil" | "gagal"

const TEMA = {
  indigo: {
    lingkar: "bg-indigo-100 text-indigo-600",
    tombol: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
    total: "text-indigo-600",
  },
  emerald: {
    lingkar: "bg-emerald-100 text-emerald-600",
    tombol: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    total: "text-emerald-600",
  },
}

interface ModalSimpanProps {
  status: StatusModal
  tema: keyof typeof TEMA
  periode: string
  labelJumlah: string
  jumlah: number
  labelTotal: string
  total: string
  pesanHasil: string
  ikonTombol?: boolean
  onBatal: () => void
  onSimpan: () => void
}

/** Modal konfirmasi → proses → hasil, meniru #modal-confirm di layout input lama. */
export function ModalSimpan(p: ModalSimpanProps) {
  const t = TEMA[p.tema]
  const [tampil, setTampil] = useState(false)
  const aktif = p.status !== "tutup"

  useEffect(() => {
    if (!aktif) return setTampil(false)
    const id = setTimeout(() => setTampil(true), 10)
    return () => clearTimeout(id)
  }, [aktif])

  if (p.status === "tutup") return null
  const status = p.status

  const hasil = p.status === "berhasil" || p.status === "gagal"
  const lingkar =
    p.status === "gagal"
      ? "w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
      : `w-20 h-20 ${t.lingkar} rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
          p.status === "berhasil" ? "scale-110" : ""
        }`
  const ikon = {
    konfirmasi: "fa-circle-check",
    menyimpan: "fa-cloud-arrow-up fa-bounce",
    berhasil: "fa-check-double",
    gagal: "fa-triangle-exclamation",
  }[status]
  const judul = { konfirmasi: "Konfirmasi Simpan", menyimpan: "Sedang Menyimpan", berhasil: "Simpan Berhasil!", gagal: "Simpan Gagal" }[status]
  const desc =
    p.status === "konfirmasi"
      ? "Apakah Anda yakin data yang dimasukkan sudah benar? Data akan disimpan ke server."
      : p.status === "menyimpan"
        ? "Mohon tunggu sebentar, sistem sedang melakukan sinkronisasi data ke server."
        : p.pesanHasil

  return (
    <Overlay>
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => p.status !== "menyimpan" && p.onBatal()}
      ></div>
      <div
        className="bg-white rounded-2xl shadow-2xl z-10 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300"
        style={{ transform: tampil ? "scale(1)" : "scale(0.95)", opacity: tampil ? 1 : 0 }}
      >
        <div className="p-8">
          <div className={lingkar}>
            <i className={`fa-solid ${ikon} text-3xl`}></i>
          </div>

          <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">{judul}</h3>
          <p className="text-slate-500 text-center text-sm mb-6">{desc}</p>

          {!hasil && (
            <div className="bg-slate-50 rounded-xl p-4 mb-8 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Ringkasan</span>
                <span>{p.periode}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-slate-600">{p.labelJumlah}</span>
                <span className="text-sm font-bold text-slate-800">{p.jumlah}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="text-sm text-slate-600">{p.labelTotal}</span>
                <span className={`text-base font-black ${t.total}`}>{p.total}</span>
              </div>
            </div>
          )}

          {!hasil ? (
            <div className="flex gap-3">
              {p.status === "konfirmasi" && (
                <button
                  onClick={p.onBatal}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={p.onSimpan}
                disabled={p.status === "menyimpan"}
                className={`flex-1 py-3 px-4 ${t.tombol} text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
              >
                {p.status === "menyimpan" ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Proses...
                  </>
                ) : (
                  <>
                    {p.ikonTombol !== false && <i className="fa-solid fa-cloud-arrow-up"></i>} Ya, Simpan
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={p.onBatal}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                Tutup Jendela
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </Overlay>
  )
}
