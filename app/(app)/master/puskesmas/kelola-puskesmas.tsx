"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { simpanPuskesmas } from "@/lib/actions/master"
import { Cari, DialogForm, Field, KartuTabel, TombolUtama, fieldCls, tdCls, thCls } from "@/components/master/ui"

type Row = { id: number; nama: string; namaKepala: string | null; nipKepala: string | null; jabatanKepala: string | null; jumlahAkun: number }
type Form = { id?: number; nama: string; namaKepala: string; nipKepala: string; jabatanKepala: string }

export function KelolaPuskesmas({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [cari, setCari] = useState("")
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proses, setProses] = useState(false)

  const q = cari.toLowerCase()
  const tampil = rows.filter((r) => !q || r.nama.toLowerCase().includes(q) || (r.namaKepala ?? "").toLowerCase().includes(q))

  const simpan = async () => {
    if (!form) return
    setProses(true)
    const r = await simpanPuskesmas(form)
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
            <Cari value={cari} onChange={setCari} placeholder="Cari puskesmas atau kepala..." />
            <div className="flex-1" />
            <TombolUtama
              onClick={() => {
                setError(null)
                setForm({ nama: "Puskesmas ", namaKepala: "", nipKepala: "", jabatanKepala: "" })
              }}
            >
              <i className="fa-solid fa-plus"></i> Tambah Puskesmas
            </TombolUtama>
          </>
        }
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Puskesmas</th>
              <th className={thCls}>Kepala</th>
              <th className={thCls}>NIP</th>
              <th className={thCls}>Jabatan</th>
              <th className={`${thCls} text-center`}>Akun</th>
              <th className={`${thCls} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className={`${tdCls} font-semibold`}>{r.nama}</td>
                <td className={tdCls}>{r.namaKepala ?? <span className="text-rose-500">belum diisi</span>}</td>
                <td className={`${tdCls} font-mono text-xs`}>{r.nipKepala ?? "-"}</td>
                <td className={tdCls}>{r.jabatanKepala ?? "-"}</td>
                <td className={`${tdCls} text-center`}>{r.jumlahAkun}</td>
                <td className={`${tdCls} text-right`}>
                  <button
                    onClick={() => {
                      setError(null)
                      setForm({ id: r.id, nama: r.nama, namaKepala: r.namaKepala ?? "", nipKepala: r.nipKepala ?? "", jabatanKepala: r.jabatanKepala ?? "" })
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600"
                    title="Ubah"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </KartuTabel>

      <DialogForm
        open={!!form}
        onOpenChange={(v) => !v && setForm(null)}
        judul={form?.id ? "Ubah Puskesmas" : "Tambah Puskesmas"}
        error={error}
        proses={proses}
        onSimpan={simpan}
      >
        {form && (
          <>
            <Field label="Nama Puskesmas">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={fieldCls} required />
            </Field>
            <Field label="Nama Kepala Puskesmas">
              <input value={form.namaKepala} onChange={(e) => setForm({ ...form, namaKepala: e.target.value })} className={fieldCls} />
            </Field>
            <Field label="NIP">
              <input value={form.nipKepala} onChange={(e) => setForm({ ...form, nipKepala: e.target.value })} className={`${fieldCls} font-mono`} />
            </Field>
            <Field label="Jabatan (tertulis di SP3B)">
              <input value={form.jabatanKepala} onChange={(e) => setForm({ ...form, jabatanKepala: e.target.value })} className={fieldCls} />
            </Field>
          </>
        )}
      </DialogForm>
    </>
  )
}
