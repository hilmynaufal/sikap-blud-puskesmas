"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { simpanSilpa } from "@/lib/actions/master"
import { formatDokumen } from "@/lib/format"
import { Cari, DialogForm, Field, KartuTabel, fieldCls, tdCls, thCls } from "@/components/master/ui"

type Form = { puskesmasId: number; nama: string; tahun: number; nilai: string }

export function KelolaSilpa({
  puskesmas,
  tahunKolom,
  nilai,
}: {
  puskesmas: { id: number; nama: string }[]
  tahunKolom: number[]
  nilai: Record<string, number>
}) {
  const router = useRouter()
  const [cari, setCari] = useState("")
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proses, setProses] = useState(false)
  const [kolom, setKolom] = useState(tahunKolom)

  const tampil = puskesmas.filter((p) => !cari || p.nama.toLowerCase().includes(cari.toLowerCase()))

  const simpan = async () => {
    if (!form) return
    const teks = form.nilai.trim().replace(/\./g, "").replace(",", ".")
    const angka = teks === "" ? null : Number(teks)
    if (angka !== null && !Number.isFinite(angka)) return setError("Nilai tidak valid")
    setProses(true)
    const r = await simpanSilpa({ puskesmasId: form.puskesmasId, tahun: form.tahun, nilai: angka })
    setProses(false)
    if (!r.ok) return setError(r.pesan)
    setForm(null)
    router.refresh()
  }

  return (
    <>
      <KartuTabel
        toolbar={
          <>
            <Cari value={cari} onChange={setCari} placeholder="Cari puskesmas..." />
            <div className="flex-1" />
            <button
              onClick={() => setKolom((k) => [...k, Math.max(...k) + 1])}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              <i className="fa-solid fa-plus mr-2"></i>Kolom Tahun {Math.max(...kolom) + 1}
            </button>
          </>
        }
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Puskesmas</th>
              {kolom.map((t) => (
                <th key={t} className={`${thCls} text-right`}>
                  SILPA {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tampil.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className={`${tdCls} font-semibold`}>{p.nama}</td>
                {kolom.map((t) => {
                  const v = nilai[`${p.id}-${t}`]
                  return (
                    <td key={t} className={`${tdCls} text-right font-mono text-xs`}>
                      <button
                        onClick={() => {
                          setError(null)
                          setForm({ puskesmasId: p.id, nama: p.nama, tahun: t, nilai: v === undefined ? "" : String(v).replace(".", ",") })
                        }}
                        className={`hover:text-blue-600 hover:underline ${v === undefined ? "text-slate-300" : ""}`}
                      >
                        {v === undefined ? "isi" : formatDokumen(v)}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </KartuTabel>

      <DialogForm
        open={!!form}
        onOpenChange={(v) => !v && setForm(null)}
        judul={form ? `SILPA ${form.tahun} – ${form.nama}` : ""}
        deskripsi="Kosongkan untuk menghapus. Gunakan koma untuk desimal."
        error={error}
        proses={proses}
        onSimpan={simpan}
      >
        {form && (
          <Field label="Nilai SILPA (Rp)">
            <input value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} className={`${fieldCls} font-mono text-right`} autoFocus />
          </Field>
        )}
      </DialogForm>
    </>
  )
}
