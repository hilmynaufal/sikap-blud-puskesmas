"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DAFTAR_BULAN } from "@/lib/bulan"
import { formatInputIDR, parseInputIDR } from "@/lib/format"
import type { RekeningRow } from "@/lib/data"
import { simpanRealisasi } from "@/lib/actions/input"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { useNotifikasi } from "@/components/puskesmas/notifikasi"
import { ModalSimpan, type StatusModal } from "@/components/puskesmas/modal-simpan"
import { JudulHalaman, KartuFilter, SelectFilter, TombolAksi } from "@/components/puskesmas/dashboard-ui"
import { BarSimpan, KartuTabelInput, PilihPuskesmas, useSiapInput } from "@/components/puskesmas/input-ui"

interface Props {
  master: RekeningRow[]
  existing: Record<number, number>
  tahun: number
  tahunList: number[]
  bulan: number
  puskesmas: { id: number | null; nama: string }
  puskesmasList: { id: number; nama: string }[]
}

export function InputRealisasi({ master, existing, tahun, tahunList, bulan, puskesmas, puskesmasList }: Props) {
  const router = useRouter()
  const filter = useFilterQuery()
  const notif = useNotifikasi("indigo")
  const [nilai, setNilai] = useState<Record<number, string>>(() =>
    Object.fromEntries(Object.entries(existing).map(([id, v]) => [id, formatInputIDR(Math.round(v))])),
  )
  const [modal, setModal] = useState<StatusModal>("tutup")
  const siap = useSiapInput()
  const [pesanHasil, setPesanHasil] = useState("")

  const { count, total } = useMemo(() => {
    let count = 0
    let total = 0
    for (const v of Object.values(nilai)) {
      const n = parseInputIDR(v)
      if (n > 0) {
        total += n
        count++
      }
    }
    return { count, total }
  }, [nilai])

  const dirty = master.some((m) => m.isLeaf && parseInputIDR(nilai[m.id] ?? "") !== Math.round(existing[m.id] ?? 0))
  const totalStr = "Rp " + (total > 0 ? formatInputIDR(total) : "0")
  const namaBulan = DAFTAR_BULAN[bulan - 1]

  const gantiFilter = (ubah: Record<string, string | number | null>) => {
    if (dirty && !window.confirm("Ada perubahan yang belum disimpan. Lanjutkan tanpa menyimpan?")) return
    filter.set(ubah)
  }

  const bukaKonfirmasi = () => {
    if (!puskesmas.id) return notif.tampil("Peringatan", "Puskesmas belum dipilih!", "error")
    setModal("konfirmasi")
  }

  const eksekusi = async () => {
    // Kirim yang terisi + yang dulu ada (supaya bisa dikosongkan/dihapus).
    const items = master
      .filter((m) => m.isLeaf)
      .map((m) => ({ kodeRekeningId: m.id, nilai: parseInputIDR(nilai[m.id] ?? "") }))
      .filter((i) => i.nilai > 0 || existing[i.kodeRekeningId] !== undefined)

    if (items.length === 0) {
      notif.tampil("Info", "Tidak ada data yang diisi untuk disimpan.", "error")
      return setModal("tutup")
    }

    setModal("menyimpan")
    const res = await simpanRealisasi({ puskesmasId: puskesmas.id, tahun, bulan, items })
    if (res.ok) {
      setPesanHasil(
        `Berhasil menyimpan ${res.jumlah} data realisasi untuk ${puskesmas.nama} periode ${namaBulan} ${tahun}.` +
          (res.dihapus ? ` ${res.dihapus} data dikosongkan.` : ""),
      )
      setModal("berhasil")
      notif.tampil("Berhasil!", `${res.jumlah} data realisasi telah tersimpan.`, "success")
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

      <JudulHalaman judul="Input Realisasi Puskesmas" subjudul="Isi nilai realisasi bulanan untuk setiap rekening rincian." />

      <KartuFilter
        filter={
          <>
            <PilihPuskesmas puskesmas={puskesmas} puskesmasList={puskesmasList} onChange={(v) => gantiFilter({ puskesmas: v })} />
            <SelectFilter ikon="fa-regular fa-clock" value={bulan} onChange={(v) => gantiFilter({ bulan: v })}>
              {DAFTAR_BULAN.map((b, i) => (
                <option key={b} value={i + 1}>
                  {b}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter ikon="fa-regular fa-calendar" value={tahun} onChange={(v) => gantiFilter({ tahun: v })}>
              {tahunList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectFilter>
          </>
        }
        aksi={
          <TombolAksi
            ikon="fa-arrows-rotate"
            label="Refresh"
            warna="indigo"
            onClick={() => (dirty && !window.confirm("Buang perubahan yang belum disimpan?") ? null : filter.refresh())}
          />
        }
      />

      <KartuTabelInput
        judul={`Realisasi ${namaBulan} ${tahun}`}
        keterangan={!siap ? "Menyiapkan form..." : filter.pending ? "Sinkronisasi data realisasi..." : "* Kosongkan nilai untuk menghapus"}
        redup={filter.pending}
      >
        <table className="w-full excel-table text-sm">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">
            <tr>
              <th className="w-48 py-3 text-left pl-4">Kode Rekening</th>
              <th className="py-3 text-left pl-4">Uraian Anggaran</th>
              <th className="w-64 py-3 text-right pr-4 !bg-amber-50 !text-amber-800 border-l border-amber-200">Realisasi (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {master.length === 0 && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-400">
                  Bagan akun tahun {tahun} belum tersedia. Hubungi admin kabupaten.
                </td>
              </tr>
            )}
            {master.map((row) => {
              const paddingLeftUraian = 16 + row.level * 24
              if (!row.isLeaf) {
                return (
                  <tr key={row.id} className="row-parent">
                    <td className="pl-6 py-2 border-r border-slate-200 font-mono text-[11px]">{row.kode}</td>
                    <td className="pr-4" style={{ paddingLeft: paddingLeftUraian }}>
                      {row.uraian}
                    </td>
                    <td className="bg-slate-100/50"></td>
                  </tr>
                )
              }
              return (
                <tr key={row.id}>
                  <td className="pl-6 py-2 border-r border-slate-200 font-mono text-slate-500 text-[11px]">{row.kode}</td>
                  <td className="pr-4 text-slate-700" style={{ paddingLeft: paddingLeftUraian }}>
                    {row.uraian}
                  </td>
                  <td className="p-0 border-l border-amber-100">
                    <input
                      type="text"
                      inputMode="numeric"
                      readOnly={!siap}
                      className="input-cell"
                      placeholder="0"
                      value={nilai[row.id] ?? ""}
                      onChange={(e) => setNilai((s) => ({ ...s, [row.id]: formatInputIDR(e.target.value) }))}
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
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Simpan ke Server
          </button>
        }
      >
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ringkasan Input</p>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-indigo-600">{count}</span> Akun diisi
              {dirty && <span className="ml-2 text-amber-600 font-medium">· belum disimpan</span>}
            </p>
          </div>
          <div className="border-l border-slate-200 pl-8">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Realisasi</p>
            <p className="text-lg font-black text-slate-800">{totalStr}</p>
          </div>
        </div>
      </BarSimpan>

      <ModalSimpan
        status={modal}
        tema="indigo"
        periode={`${namaBulan.toUpperCase()} ${tahun}`}
        labelJumlah="Akun Diisi:"
        jumlah={count}
        labelTotal="Total Realisasi:"
        total={totalStr}
        pesanHasil={pesanHasil}
        onBatal={() => setModal("tutup")}
        onSimpan={eksekusi}
      />
    </div>
  )
}
