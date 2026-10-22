"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { simpanPengguna } from "@/lib/actions/master"
import { Cari, DialogForm, Field, KartuTabel, TombolUtama, fieldCls, tdCls, thCls } from "@/components/master/ui"

type User = {
  id: number
  email: string
  nama: string
  role: "ADMIN" | "OPERATOR"
  puskesmasId: number | null
  puskesmasNama: string | null
  aktif: boolean
  lastLoginAt: string | null
}
type Form = Omit<User, "puskesmasNama" | "lastLoginAt" | "id"> & { id?: number; password: string }

export function KelolaPengguna({ users, puskesmas, meId }: { users: User[]; puskesmas: { id: number; nama: string }[]; meId: number }) {
  const router = useRouter()
  const [cari, setCari] = useState("")
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proses, setProses] = useState(false)

  const q = cari.toLowerCase()
  const tampil = users.filter(
    (u) => !q || u.nama.toLowerCase().includes(q) || u.email.includes(q) || (u.puskesmasNama ?? "").toLowerCase().includes(q),
  )

  const simpan = async () => {
    if (!form) return
    setProses(true)
    const r = await simpanPengguna({ ...form, password: form.password || undefined })
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
            <Cari value={cari} onChange={setCari} placeholder="Cari nama, email, atau puskesmas..." />
            <div className="flex-1" />
            <TombolUtama
              onClick={() => {
                setError(null)
                setForm({ email: "", nama: "", role: "OPERATOR", puskesmasId: puskesmas[0]?.id ?? null, aktif: true, password: "" })
              }}
            >
              <i className="fa-solid fa-plus"></i> Tambah Pengguna
            </TombolUtama>
          </>
        }
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Nama</th>
              <th className={thCls}>Email</th>
              <th className={thCls}>Peran</th>
              <th className={thCls}>Puskesmas</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Login Terakhir</th>
              <th className={`${thCls} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className={`${tdCls} font-semibold`}>{u.nama}</td>
                <td className={tdCls}>{u.email}</td>
                <td className={tdCls}>
                  <span className={u.role === "ADMIN" ? "leaf-badge" : "leaf-badge-item"}>{u.role === "ADMIN" ? "ADMIN" : "OPERATOR"}</span>
                </td>
                <td className={tdCls}>{u.puskesmasNama ?? "-"}</td>
                <td className={tdCls}>
                  {u.aktif ? <span className="text-emerald-600 font-medium">Aktif</span> : <span className="text-slate-400">Nonaktif</span>}
                </td>
                <td className={`${tdCls} text-xs text-slate-500`}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                </td>
                <td className={`${tdCls} text-right`}>
                  <button
                    onClick={() => {
                      setError(null)
                      setForm({ id: u.id, email: u.email, nama: u.nama, role: u.role, puskesmasId: u.puskesmasId, aktif: u.aktif, password: "" })
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
        judul={form?.id ? "Ubah Pengguna" : "Tambah Pengguna"}
        error={error}
        proses={proses}
        onSimpan={simpan}
      >
        {form && (
          <>
            <Field label="Nama">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={fieldCls} required />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldCls} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peran">
                <select
                  value={form.role}
                  disabled={form.id === meId}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}
                  className={fieldCls}
                >
                  <option value="OPERATOR">Operator Puskesmas</option>
                  <option value="ADMIN">Admin Kabupaten</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.aktif ? "1" : "0"}
                  disabled={form.id === meId}
                  onChange={(e) => setForm({ ...form, aktif: e.target.value === "1" })}
                  className={fieldCls}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </Field>
            </div>
            {form.role === "OPERATOR" && (
              <Field label="Puskesmas">
                <select
                  value={form.puskesmasId ?? ""}
                  onChange={(e) => setForm({ ...form, puskesmasId: Number(e.target.value) || null })}
                  className={fieldCls}
                >
                  {puskesmas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={form.id ? "Reset Password (kosongkan jika tidak diubah)" : "Password (min. 8 karakter)"}>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={fieldCls}
                required={!form.id}
              />
            </Field>
          </>
        )}
      </DialogForm>
    </>
  )
}
