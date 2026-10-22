"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { RekeningRow } from "@/lib/data"
import { hapusRekening, salinTahunRekening, simpanRekening } from "@/lib/actions/master"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { Cari, DialogForm, Field, KartuTabel, TombolUtama, fieldCls, tdCls, thCls } from "@/components/master/ui"

type Form = { id?: number; kode: string; uraian: string; isLeaf: boolean }

export function KelolaRekening({ rows, tahun, tahunList, dipakai }: { rows: RekeningRow[]; tahun: number; tahunList: number[]; dipakai: number[] }) {
  const router = useRouter()
  const filter = useFilterQuery()
  const [cari, setCari] = useState("")
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proses, setProses] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const dipakaiSet = useMemo(() => new Set(dipakai), [dipakai])

  const tampil = rows.filter((r) => !cari || r.kode.includes(cari) || r.uraian.toLowerCase().includes(cari.toLowerCase()))

  const simpan = async () => {
    if (!form) return
    setProses(true)
    const r = await simpanRekening({ ...form, tahun })
    setProses(false)
    if (!r.ok) return setError(r.pesan)
    setForm(null)
    router.refresh()
  }

  const hapus = async (row: RekeningRow) => {
    if (!window.confirm(`Hapus ${row.kode} – ${row.uraian}?`)) return
    const r = await hapusRekening(row.id)
    setInfo(r.ok ? `${row.kode} dihapus.` : r.pesan)
    router.refresh()
  }

  const salin = async () => {
    const ke = window.prompt(`Salin bagan akun tahun ${tahun} ke tahun berapa?`, String(tahun + 1))
    if (!ke) return
    const r = await salinTahunRekening(tahun, parseInt(ke, 10))
    setInfo(r.ok ? r.pesan ?? "Berhasil disalin." : r.pesan)
    if (r.ok) filter.set({ tahun: ke })
  }

  return (
    <>
      {info && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">{info}</div>}
      <KartuTabel
        toolbar={
          <>
            <select value={tahun} onChange={(e) => filter.set({ tahun: e.target.value })} className={`${fieldCls} w-auto`}>
              {tahunList.map((t) => (
                <option key={t} value={t}>
                  Tahun {t}
                </option>
              ))}
            </select>
            <Cari value={cari} onChange={setCari} placeholder="Cari kode atau uraian..." />
            <div className="flex-1" />
            <button onClick={salin} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              <i className="fa-regular fa-copy mr-2"></i>Salin ke Tahun Lain
            </button>
            <TombolUtama
              onClick={() => {
                setError(null)
                setForm({ kode: "", uraian: "", isLeaf: true })
              }}
            >
              <i className="fa-solid fa-plus"></i> Tambah Kode
            </TombolUtama>
          </>
        }
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Uraian</th>
              <th className={thCls}>Jenis</th>
              <th className={`${thCls} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((r) => (
              <tr key={r.id} className={r.isLeaf ? "" : "bg-slate-50/60 font-semibold"}>
                <td className={`${tdCls} font-mono text-xs`} style={{ paddingLeft: 16 + r.level * 12 }}>
                  {r.kode}
                </td>
                <td className={tdCls}>{r.uraian}</td>
                <td className={tdCls}>
                  <span className={r.isLeaf ? "leaf-badge" : "leaf-badge-item"}>{r.isLeaf ? "RINCIAN" : "INDUK"}</span>
                </td>
                <td className={`${tdCls} text-right whitespace-nowrap`}>
                  <button
                    onClick={() => {
                      setError(null)
                      setForm({ id: r.id, kode: r.kode, uraian: r.uraian, isLeaf: r.isLeaf })
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600"
                    title="Ubah"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    onClick={() => hapus(r)}
                    disabled={dipakaiSet.has(r.id)}
                    className="p-2 text-slate-500 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-500"
                    title={dipakaiSet.has(r.id) ? "Sudah berisi anggaran/realisasi" : "Hapus"}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400 text-sm">
                  Belum ada kode rekening untuk tahun {tahun}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </KartuTabel>

      <DialogForm
        open={!!form}
        onOpenChange={(v) => !v && setForm(null)}
        judul={form?.id ? "Ubah Kode Rekening" : `Tambah Kode Rekening ${tahun}`}
        deskripsi="Induk ditentukan otomatis dari prefix kode."
        error={error}
        proses={proses}
        onSimpan={simpan}
      >
        {form && (
          <>
            <Field label="Kode Rekening">
              <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} className={`${fieldCls} font-mono`} required />
            </Field>
            <Field label="Uraian">
              <input value={form.uraian} onChange={(e) => setForm({ ...form, uraian: e.target.value })} className={fieldCls} required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isLeaf} onChange={(e) => setForm({ ...form, isLeaf: e.target.checked })} />
              Baris rincian (bisa diisi anggaran/realisasi)
            </label>
          </>
        )}
      </DialogForm>
    </>
  )
}
