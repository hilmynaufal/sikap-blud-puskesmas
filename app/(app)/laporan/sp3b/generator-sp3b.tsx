"use client"

import { useState } from "react"
import type { DataKeuangan } from "@/lib/laporan"
import { DEFAULT_LAPORAN, nomorDefault, type Sp3bForm } from "@/lib/laporan-form"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { useNotifikasi } from "@/components/puskesmas/notifikasi"
import { JudulHalaman } from "@/components/puskesmas/dashboard-ui"
import { DokumenSp3b } from "@/components/laporan/dokumen"
import { Overlay } from "@/components/shell/page-frame"
import {
  FieldApi,
  FilterPeriode,
  KartuPengaturan,
  Label,
  OverlayMemuat,
  filterCls,
  hariIni,
  inputCls,
  unduhPdf,
  useIsianTersimpan,
} from "@/components/laporan/generator-ui"

interface Props {
  tahun: number
  tahunList: number[]
  bulan: number
  puskesmasList: { id: number; nama: string }[]
  terkunci: boolean
  pusk: { id: number; nama: string; namaKepala: string | null; nipKepala: string | null; jabatanKepala: string | null } | null
  keuangan: DataKeuangan | null
}

const KOSONG: DataKeuangan = { saldoAwal: 0, pendapatan: 0, belanja: 0, saldoAkhir: 0, bPegawai: 0, bBarang: 0, bModal: 0, jumlahKodePendapatan: 0 }

/** Generator SP3B BLU (dulu public/layouts/sp3b-generator.html). */
export function GeneratorSp3b({ tahun, tahunList, bulan, puskesmasList, terkunci, pusk, keuangan }: Props) {
  const filter = useFilterQuery()
  const notif = useNotifikasi("indigo")
  const [umum, setUmum] = useIsianTersimpan("sp3b-umum", {
    dasar: DEFAULT_LAPORAN.dasar,
    urusan: DEFAULT_LAPORAN.urusan,
    organisasi: DEFAULT_LAPORAN.organisasi,
    program: DEFAULT_LAPORAN.program,
    kota: DEFAULT_LAPORAN.kota,
  })
  const namaPusk = pusk?.nama ?? ""
  // Isian yang otomatis mengikuti puskesmas/periode (reset saat filter berganti lewat key).
  const [auto, setAuto] = useState({
    tanggal: hariIni(),
    tanggalTtd: hariIni(),
    nomor: nomorDefault("SP3B", namaPusk, bulan, tahun),
    blu: namaPusk,
    jabatan: pusk?.jabatanKepala ?? `Kepala ${namaPusk}`,
    namaKepala: pusk?.namaKepala ?? "",
    nip: pusk?.nipKepala ?? "",
  })
  const ubahAuto = (k: keyof typeof auto, v: string) => setAuto((a) => ({ ...a, [k]: v }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mencetak, setMencetak] = useState(false)

  const k = keuangan ?? KOSONG
  const form: Sp3bForm = { puskesmasId: pusk?.id ?? null, tahun, bulan, ...umum, ...auto }

  const cetak = async () => {
    setMencetak(true)
    const err = await unduhPdf("sp3b", form)
    setMencetak(false)
    if (err) notif.tampil("Gagal", err, "error")
    else notif.tampil("Berhasil", "PDF SP3B berhasil dibuat.", "success")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {notif.elemen}
      {filter.pending && (
        <Overlay>
          <OverlayMemuat />
        </Overlay>
      )}

      <JudulHalaman judul="Generator SP3B BLU" subjudul="Surat Permintaan Pengesahan Pendapatan dan Belanja BLUD Puskesmas." />

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <FilterPeriode
            puskesmasId={pusk?.id ?? null}
            puskesmasList={puskesmasList}
            terkunci={terkunci}
            bulan={bulan}
            tahun={tahun}
            tahunList={tahunList}
            onChange={filter.set}
          />
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-slate-500">Tanggal Surat</label>
            <input type="date" value={auto.tanggal} onChange={(e) => ubahAuto("tanggal", e.target.value)} className={filterCls} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-slate-500">Nomor Surat</label>
            <input value={auto.nomor} onChange={(e) => ubahAuto("nomor", e.target.value)} className={`${filterCls} w-60`} />
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <i className="fa-solid fa-sliders text-xs"></i>
            <span>Pengaturan</span>
            <i className="fa-solid fa-chevron-down text-xs transition-transform" style={{ transform: settingsOpen ? "rotate(180deg)" : "none" }}></i>
          </button>
          <button
            onClick={cetak}
            disabled={mencetak || !pusk}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg font-semibold shadow transition text-sm"
          >
            {mencetak ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs"></i> Menyimpan...
              </>
            ) : (
              <>
                <i className="fa-solid fa-print text-xs"></i> Cetak PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: settingsOpen ? 1200 : 0 }}
      >
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KartuPengaturan ikon="fa-landmark" judul="Data Instansi">
            <div>
              <Label>Dasar Pengesahan</Label>
              <textarea rows={2} value={umum.dasar} onChange={(e) => setUmum("dasar", e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <Label>Urusan</Label>
              <input value={umum.urusan} onChange={(e) => setUmum("urusan", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>Organisasi</Label>
              <input value={umum.organisasi} onChange={(e) => setUmum("organisasi", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label auto>Nama BLU</Label>
              <input value={auto.blu} onChange={(e) => ubahAuto("blu", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>Program Kegiatan</Label>
              <input value={umum.program} onChange={(e) => setUmum("program", e.target.value)} className={inputCls} />
            </div>
          </KartuPengaturan>

          <KartuPengaturan ikon="fa-coins" judul="Data Keuangan" api>
            <FieldApi label="Saldo Awal" nilai={k.saldoAwal} />
            <FieldApi label="Pendapatan" nilai={k.pendapatan} />
            <FieldApi label="Belanja" nilai={k.belanja} />
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rincian Belanja</p>
              <FieldApi label="Pegawai BLUD" nilai={k.bPegawai} kecil />
              <FieldApi label="Barang & Jasa" nilai={k.bBarang} kecil />
              <FieldApi label="Modal" nilai={k.bModal} kecil />
            </div>
          </KartuPengaturan>

          <KartuPengaturan ikon="fa-signature" judul="Penandatangan">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Kota TTD</Label>
                <input value={umum.kota} onChange={(e) => setUmum("kota", e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label>Tanggal TTD</Label>
                <input type="date" value={auto.tanggalTtd} onChange={(e) => ubahAuto("tanggalTtd", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <Label auto>Jabatan</Label>
              <input value={auto.jabatan} onChange={(e) => ubahAuto("jabatan", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label auto>Nama Kepala</Label>
              <input value={auto.namaKepala} onChange={(e) => ubahAuto("namaKepala", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label auto>NIP</Label>
              <input value={auto.nip} onChange={(e) => ubahAuto("nip", e.target.value)} className={inputCls} />
            </div>
          </KartuPengaturan>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <DokumenSp3b f={form} k={k} />
        </div>
      </div>
    </div>
  )
}
