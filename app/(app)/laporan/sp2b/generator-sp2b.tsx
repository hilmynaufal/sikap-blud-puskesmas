"use client"

import { useState } from "react"
import type { DataKeuangan } from "@/lib/laporan"
import { DEFAULT_LAPORAN, nomorDefault, type Sp2bForm } from "@/lib/laporan-form"
import { useFilterQuery } from "@/components/puskesmas/pilih-periode"
import { useNotifikasi } from "@/components/puskesmas/notifikasi"
import { JudulHalaman } from "@/components/puskesmas/dashboard-ui"
import { DokumenSp2b } from "@/components/laporan/dokumen"
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
  pusk: { id: number; nama: string } | null
  keuangan: DataKeuangan | null
}

const KOSONG: DataKeuangan = { saldoAwal: 0, pendapatan: 0, belanja: 0, saldoAkhir: 0, bPegawai: 0, bBarang: 0, bModal: 0, jumlahKodePendapatan: 0 }

/** Generator SP2B BLU (dulu public/layouts/sp2b-generator.html). */
export function GeneratorSp2b({ tahun, tahunList, bulan, puskesmasList, terkunci, pusk, keuangan }: Props) {
  const filter = useFilterQuery()
  const notif = useNotifikasi("indigo")
  const [umum, setUmum] = useIsianTersimpan("sp2b-umum", {
    skpd: DEFAULT_LAPORAN.skpd,
    kota: DEFAULT_LAPORAN.kota,
    namaBud: DEFAULT_LAPORAN.namaBud,
    nipBud: DEFAULT_LAPORAN.nipBud,
  })
  const namaPusk = pusk?.nama ?? ""
  const [auto, setAuto] = useState({
    tanggal: hariIni(),
    tanggalTtd: hariIni(),
    noSp3b: nomorDefault("SP3B", namaPusk, bulan, tahun),
    nomorSp2b: nomorDefault("SP2B", namaPusk, bulan, tahun),
    blu: namaPusk,
  })
  const ubahAuto = (k: keyof typeof auto, v: string) => setAuto((a) => ({ ...a, [k]: v }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [skala, setSkala] = useState(90)
  const [mencetak, setMencetak] = useState(false)

  const k = keuangan ?? KOSONG
  const form: Sp2bForm = { puskesmasId: pusk?.id ?? null, tahun, bulan, ...umum, ...auto }

  const cetak = async () => {
    setMencetak(true)
    const err = await unduhPdf("sp2b", form)
    setMencetak(false)
    if (err) notif.tampil("Gagal", err, "error")
    else notif.tampil("Berhasil", "PDF SP2B berhasil dibuat.", "success")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {notif.elemen}
      {filter.pending && (
        <Overlay>
          <OverlayMemuat />
        </Overlay>
      )}

      <JudulHalaman judul="Generator SP2B BLU" subjudul="Surat Pengesahan Pendapatan dan Belanja BLUD Puskesmas." />

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
            <label className="text-xs font-medium text-slate-500">Tanggal</label>
            <input type="date" value={auto.tanggal} onChange={(e) => ubahAuto("tanggal", e.target.value)} className={filterCls} />
          </div>
          <div className="flex-1"></div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-slate-500">Skala {skala}%</label>
            <input type="range" min={60} max={100} step={1} value={skala} onChange={(e) => setSkala(Number(e.target.value))} className="w-28 accent-blue-600" />
          </div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <i className="fa-solid fa-sliders text-xs"></i> Pengaturan
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
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <KartuPengaturan ikon="fa-hashtag" judul="Nomor Surat">
            <div>
              <Label>No. SP3B (referensi)</Label>
              <input value={auto.noSp3b} onChange={(e) => ubahAuto("noSp3b", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>Nomor SP2B</Label>
              <input value={auto.nomorSp2b} onChange={(e) => ubahAuto("nomorSp2b", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>SKPD</Label>
              <input value={umum.skpd} onChange={(e) => setUmum("skpd", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label auto>Nama BLU</Label>
              <input value={auto.blu} onChange={(e) => ubahAuto("blu", e.target.value)} className={inputCls} />
            </div>
          </KartuPengaturan>

          <KartuPengaturan ikon="fa-coins" judul="Data Keuangan" api>
            <FieldApi label="Saldo Awal" nilai={k.saldoAwal} />
            <FieldApi label="Pendapatan" nilai={k.pendapatan} />
            <FieldApi label="Belanja" nilai={k.belanja} />
          </KartuPengaturan>

          <KartuPengaturan ikon="fa-stamp" judul="Kuasa BUD / Penandatangan">
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
              <Label>Nama BUD / Kuasa BUD</Label>
              <input value={umum.namaBud} onChange={(e) => setUmum("namaBud", e.target.value)} className={inputCls} />
            </div>
            <div>
              <Label>NIP</Label>
              <input value={umum.nipBud} onChange={(e) => setUmum("nipBud", e.target.value)} className={inputCls} />
            </div>
          </KartuPengaturan>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <DokumenSp2b f={form} k={k} zoom={skala} />
        </div>
      </div>
    </div>
  )
}
