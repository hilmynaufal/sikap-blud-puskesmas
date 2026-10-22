"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatInputIDR, parseInputIDR } from "@/lib/format"
import type { RekeningRow } from "@/lib/data"
import { simpanAnggaran } from "@/lib/actions/input"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { useNotifikasi } from "@/components/puskesmas/notifikasi"
import { ModalSimpan, type StatusModal } from "@/components/puskesmas/modal-simpan"
import { JudulHalaman, KartuFilter, SelectFilter, TombolAksi } from "@/components/puskesmas/dashboard-ui"
import { BarSimpan, KartuTabelInput, PilihPuskesmas, useSiapInput } from "@/components/puskesmas/input-ui"

type Nilai = { murni: string; perubahan: string }

interface Props {
  master: RekeningRow[]
  existing: Record<number, { murni: number; perubahan: number }>
  tahun: number
  tahunList: number[]
  puskesmas: { id: number | null; nama: string }
  puskesmasList: { id: number; nama: string }[]
}

/** formatIDR versi layout anggaran lama: 0 dikosongkan. */
const fmt = (v: number | string) => {
  const s = formatInputIDR(v)
  return s === "0" ? "" : s
}

export function InputAnggaran({ master, existing, tahun, tahunList, puskesmas, puskesmasList }: Props) {
  const router = useRouter()
  const filter = useFilterQuery()
  const notif = useNotifikasi("emerald")
  const [nilai, setNilai] = useState<Record<number, Nilai>>(() =>
    Object.fromEntries(
      Object.entries(existing).map(([id, v]) => [id, { murni: fmt(Math.round(v.murni)), perubahan: fmt(Math.round(v.perubahan)) }]),
    ),
  )
  const [modal, setModal] = useState<StatusModal>("tutup")
  const siap = useSiapInput()
  const [pesanHasil, setPesanHasil] = useState("")

  const ringkasan = useMemo(() => {
    let totalMurni = 0
    let totalPerubahan = 0
    let count = 0
    for (const v of Object.values(nilai)) {
      const m = parseInputIDR(v.murni)
      const p = parseInputIDR(v.perubahan)
      totalMurni += m
      totalPerubahan += p
      if (m > 0 || p > 0) count++
    }
    return { totalMurni, totalPerubahan, count }
  }, [nilai])

  const dirty = master.some((r) => {
    if (!r.isLeaf) return false
    const e = existing[r.id]
    return (
      parseInputIDR(nilai[r.id]?.murni ?? "") !== Math.round(e?.murni ?? 0) ||
      parseInputIDR(nilai[r.id]?.perubahan ?? "") !== Math.round(e?.perubahan ?? 0)
    )
  })
  const rp = (n: number) => "Rp " + (n > 0 ? formatInputIDR(n) : "0")

  const gantiFilter = (ubah: Record<string, string | number | null>) => {
    if (dirty && !window.confirm("Ada perubahan yang belum disimpan. Lanjutkan tanpa menyimpan?")) return
    filter.set(ubah)
  }

  const ubah = (id: number, kolom: keyof Nilai, v: string) =>
    setNilai((s) => ({ ...s, [id]: { ...(s[id] ?? { murni: "", perubahan: "" }), [kolom]: fmt(v) } }))

  const bukaKonfirmasi = () => {
    if (!puskesmas.id) return notif.tampil("Peringatan", "Puskesmas belum dipilih!", "error")
    setModal("konfirmasi")
  }

  const eksekusi = async () => {
    const items = master
      .filter((r) => r.isLeaf)
      .map((r) => ({
        kodeRekeningId: r.id,
        murni: parseInputIDR(nilai[r.id]?.murni ?? ""),
        perubahan: parseInputIDR(nilai[r.id]?.perubahan ?? ""),
      }))
      .filter((i) => i.murni > 0 || i.perubahan > 0 || existing[i.kodeRekeningId] !== undefined)

    if (items.length === 0) {
      notif.tampil("Info", "Tidak ada data yang diisi untuk disimpan.", "error")
      return setModal("tutup")
    }

    setModal("menyimpan")
    const res = await simpanAnggaran({ puskesmasId: puskesmas.id, tahun, items })
    if (res.ok) {
      setPesanHasil(
        `Berhasil menyimpan ${res.jumlah} data anggaran untuk ${puskesmas.nama} tahun ${tahun}.` +
          (res.dihapus ? ` ${res.dihapus} data dikosongkan.` : ""),
      )
      setModal("berhasil")
      notif.tampil("Berhasil!", `${res.jumlah} data anggaran telah tersimpan.`, "success")
      router.refresh()
    } else {
      setPesanHasil(res.pesan)
      setModal("gagal")
      notif.tampil("Gagal Simpan", "Data gagal disimpan ke server.", "error")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {notif.elemen}

      <JudulHalaman judul="Input Anggaran Puskesmas" subjudul="Isi anggaran murni dan perubahan untuk setiap rekening rincian." />

      <KartuFilter
        filter={
          <>
            <PilihPuskesmas puskesmas={puskesmas} puskesmasList={puskesmasList} onChange={(v) => gantiFilter({ puskesmas: v })} />
            <SelectFilter ikon="fa-regular fa-calendar" value={tahun} onChange={(v) => gantiFilter({ tahun: v })}>
              {tahunList.map((t) => (
                <option key={t} value={t}>
                  Tahun Anggaran {t}
                </option>
              ))}
            </SelectFilter>
          </>
        }
        aksi={
          <TombolAksi
            ikon="fa-arrows-rotate"
            label="Refresh"
            warna="emerald"
            onClick={() => (dirty && !window.confirm("Buang perubahan yang belum disimpan?") ? null : filter.refresh())}
          />
        }
      />

      <KartuTabelInput
        judul={`Anggaran Murni & Perubahan ${tahun}`}
        keterangan={!siap ? "Menyiapkan form..." : filter.pending ? "Sinkronisasi data anggaran..." : "* Kosongkan kedua nilai untuk menghapus"}
        redup={filter.pending}
      >
        <table className="w-full excel-table excel-compact text-sm">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">
            <tr>
              <th className="w-40 py-3 text-left pl-4">Kode Rekening</th>
              <th className="py-3 text-left pl-4">Uraian Anggaran</th>
              <th className="w-48 py-3 text-right pr-4 !bg-slate-50 !text-slate-700 border-l border-slate-200">Anggaran Murni (Rp)</th>
              <th className="w-48 py-3 text-right pr-4 !bg-emerald-50 !text-emerald-800 border-l border-emerald-200">Anggaran Perubahan (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {master.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400">
                  Bagan akun tahun {tahun} belum tersedia. Hubungi admin kabupaten.
                </td>
              </tr>
            )}
            {master.map((row) => {
              const paddingLeftUraian = 16 + row.level * 20
              if (!row.isLeaf) {
                return (
                  <tr key={row.id} className="row-parent">
                    <td className="pl-4 py-2 border-r border-slate-200 font-mono text-[10px]">{row.kode}</td>
                    <td className="pr-4" style={{ paddingLeft: paddingLeftUraian }}>
                      {row.uraian}
                    </td>
                    <td className="bg-slate-100/30 border-l border-slate-200"></td>
                    <td className="bg-slate-100/30 border-l border-slate-200"></td>
                  </tr>
                )
              }
              return (
                <tr key={row.id}>
                  <td className="pl-4 py-2 border-r border-slate-200 font-mono text-slate-500 text-[10px]">{row.kode}</td>
                  <td className="pr-4 text-slate-700" style={{ paddingLeft: paddingLeftUraian }}>
                    {row.uraian}
                  </td>
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="text"
                      inputMode="numeric"
                      readOnly={!siap}
                      className="input-cell input-murni"
                      placeholder="0"
                      value={nilai[row.id]?.murni ?? ""}
                      onChange={(e) => ubah(row.id, "murni", e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-l border-emerald-100">
                    <input
                      type="text"
                      inputMode="numeric"
                      readOnly={!siap}
                      className="input-cell input-perubahan"
                      placeholder="0"
                      value={nilai[row.id]?.perubahan ?? ""}
                      onChange={(e) => ubah(row.id, "perubahan", e.target.value)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </KartuTabelInput>

      <BarSimpan
        tombol={
          <button
            onClick={bukaKonfirmasi}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Simpan Anggaran
          </button>
        }
      >
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ringkasan Input</p>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-emerald-600">{ringkasan.count}</span> Rekening diisi
              {dirty && <span className="ml-2 text-amber-600 font-medium">· belum disimpan</span>}
            </p>
          </div>
          <div className="border-l border-slate-200 pl-8">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Total Murni</p>
            <p className="text-sm font-bold text-slate-600">{rp(ringkasan.totalMurni)}</p>
          </div>
          <div className="border-l border-slate-200 pl-8">
            <p className="text-[10px] text-emerald-500 uppercase font-bold">Total Perubahan</p>
            <p className="text-lg font-black text-slate-800">{rp(ringkasan.totalPerubahan)}</p>
          </div>
        </div>
      </BarSimpan>

      <ModalSimpan
        status={modal}
        tema="emerald"
        periode={`TAHUN ${tahun}`}
        labelJumlah="Item Diisi:"
        jumlah={ringkasan.count}
        labelTotal="Total Perubahan:"
        total={rp(ringkasan.totalPerubahan)}
        pesanHasil={pesanHasil}
        ikonTombol={false}
        onBatal={() => setModal("tutup")}
        onSimpan={eksekusi}
      />
    </div>
  )
}
