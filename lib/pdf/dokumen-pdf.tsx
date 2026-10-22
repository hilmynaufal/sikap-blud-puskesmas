import { Document, Image, Page, Text, View } from "@react-pdf/renderer"
import { DAFTAR_BULAN } from "@/lib/bulan"
import { formatDokumen } from "@/lib/format"
import { formatTanggal, type Sp2bForm, type Sp3bForm } from "@/lib/laporan-form"
import type { DataKeuangan } from "@/lib/laporan"
import { barisTabelSp3b, KODE_PENDAPATAN_UTAMA } from "@/components/laporan/dokumen"
import { Tabel, type Baris } from "./tabel"

const MM = 2.835

// ── SP3B ─────────────────────────────────────────────────────────────

const KOLOM_SP3B = [17.0, 3.3, 10.5, 1.7, 17.0, 17.5, 9.8, 10.3, 12.9]

export function PdfSp3b({ f, k, logo }: { f: Sp3bForm; k: DataKeuangan; logo: Buffer }) {
  const kosong = (h: number): Baris => ({ h, sel: [{ cs: 9 }] })
  const saldo = (label: string, v: number, garis = false): Baris => ({
    h: 27,
    garisBawah: garis,
    sel: [{ cs: 2 }, { t: label, pl: 2, pr: 0 }, { t: ":", align: "center", pl: 0, pr: 0 }, { t: formatDokumen(v), align: "right", pr: 10 }, { cs: 4 }],
  })
  const info = (label: string, v: string, garis = false, wrap = false): Baris => ({
    h: 27,
    garisBawah: garis,
    sel: [{ t: label, pl: 4 }, { t: ":", align: "center" }, { cs: 7, t: v, bold: true, wrap }],
  })

  const baris: Baris[] = [
    {
      h: 27,
      sel: [
        { t: "Tanggal", align: "right" },
        { t: ":", align: "center" },
        { cs: 3, t: formatTanggal(f.tanggal), bold: true },
        { t: "Nomor  :", align: "right" },
        { cs: 3, t: f.nomor },
      ],
    },
    kosong(4),
    { h: 27, garisAtas: true, garisBawah: true, sel: [{ cs: 9, t: `Kepala SKPD ${f.organisasi} memohon kepada :`, pl: 4 }] },
    { h: 27, garisBawah: true, sel: [{ cs: 9, t: "Bendahara Umum Daerah selaku PPKD", pl: 4 }] },
    { h: 27, sel: [{ cs: 9, t: "agar mengesahkan dan membukukan pendapatan dan belanja sejumlah :", pl: 4 }] },
    saldo("Saldo Awal", k.saldoAwal),
    saldo("Pendapatan", k.pendapatan),
    saldo("Belanja", k.belanja),
    saldo("Saldo Akhir", k.saldoAkhir, true),
    {
      h: 27,
      garisBawah: true,
      sel: [
        { t: "Untuk Bulan", pl: 4 },
        { t: ":", align: "center" },
        { cs: 3, t: DAFTAR_BULAN[f.bulan - 1].toUpperCase(), bold: true },
        { cs: 4, t: `Tahun Anggaran ${f.tahun}`, pl: 4 },
      ],
    },
    kosong(8),
    info("Dasar Pengesahan", f.dasar, false, true),
    info("Urusan", f.urusan),
    info("Organisasi", f.organisasi),
    info("Nama BLU", f.blu),
    info("Program Kegiatan", f.program, true),
    {
      h: 28,
      sel: [
        { cs: 5, t: "PENDAPATAN", bold: true, align: "center", kotak: "cbL" },
        { cs: 4, t: "BELANJA", bold: true, align: "center", kotak: "cbR" },
      ],
    },
    {
      h: 28,
      sel: [
        { cs: 2, t: "KODE REKENING", bold: true, align: "center", kotak: "cbL" },
        { cs: 3, t: "JUMLAH", bold: true, align: "center", kotak: "cb" },
        { cs: 2, t: "JENIS BELANJA", bold: true, align: "center", kotak: "cb" },
        { cs: 2, t: "JUMLAH", bold: true, align: "center", kotak: "cbR" },
      ],
    },
    ...barisTabelSp3b(k).map(
      (b, i): Baris => ({
        h: 27,
        sel: [
          { cs: 2, t: i === 0 ? KODE_PENDAPATAN_UTAMA : "", align: "center", kotak: "cbL" },
          { cs: 3, t: i === 0 ? formatDokumen(k.pendapatan) : "", align: "right", pr: 6, kotak: "cb" },
          { cs: 2, t: b?.label ?? "", pl: 4, kotak: "cb" },
          { cs: 2, t: b ? formatDokumen(k[b.key]) : "", align: "right", pr: 6, kotak: "cbR" },
        ],
      }),
    ),
    { h: 27, sel: [{ cs: 2, kotak: "cbL" }, { cs: 3, kotak: "cb" }, { cs: 2, kotak: "cb" }, { cs: 2, kotak: "cbR" }] },
    {
      h: 28,
      sel: [
        { cs: 2, t: "JUMLAH PENDAPATAN", bold: true, align: "center", size: 8, kotak: "cbL" },
        { cs: 3, t: formatDokumen(k.pendapatan), bold: true, align: "right", pr: 6, kotak: "cb" },
        { cs: 2, t: "JUMLAH BELANJA", bold: true, align: "center", size: 8, kotak: "cb" },
        { cs: 2, t: formatDokumen(k.belanja), bold: true, align: "right", pr: 6, kotak: "cbR" },
      ],
    },
    kosong(12),
    kosong(12),
    { h: 26, sel: [{ cs: 6 }, { t: `${f.kota},`, align: "right" }, { cs: 2, t: formatTanggal(f.tanggalTtd), bold: true, pl: 4 }] },
    { h: 26, sel: [{ cs: 6 }, { cs: 3, t: f.jabatan, bold: true, align: "center", wrap: true }] },
    ...Array.from({ length: 7 }, () => kosong(14)),
    { h: 26, sel: [{ cs: 6 }, { cs: 3, t: f.namaKepala, bold: true, align: "center", underline: true }] },
    { h: 26, sel: [{ cs: 6 }, { cs: 3, t: `NIP. ${f.nip}`, align: "center" }] },
    kosong(10),
  ]

  return (
    <Document title={`SP3B ${f.blu} ${DAFTAR_BULAN[f.bulan - 1]} ${f.tahun}`}>
      <Page size="A4" style={{ paddingTop: 10 * MM, paddingRight: 12 * MM, paddingBottom: 15 * MM, paddingLeft: 12 * MM }}>
        <View style={{ borderWidth: 0.5, borderBottomWidth: 0, flexDirection: "row", alignItems: "center", paddingVertical: 4.5, paddingHorizontal: 7.5 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={{ width: 45, height: 45, marginRight: 7.5, objectFit: "contain" }} />
          <Text style={{ flex: 1, fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.4 }}>
            {"PEMERINTAH KABUPATEN BANDUNG\nSURAT PERMINTAAN PENGESAHAN PENDAPATAN DAN BELANJA (SP3B)\nBLU"}
          </Text>
        </View>
        <View style={{ borderWidth: 1, borderTopWidth: 0 }}>
          <Tabel kolom={KOLOM_SP3B} baris={baris} padding={[2.25, 3.75]} fontSize={9.5} />
        </View>
      </Page>
    </Document>
  )
}

// ── SP2B ─────────────────────────────────────────────────────────────

const KOLOM_INFO = [16, 2, 33, 19, 2, 28]
const KOLOM_SALDO = [5, 18, 3, 20, 54]

export function PdfSp2b({ f, k, logo }: { f: Sp2bForm; k: DataKeuangan; logo: Buffer }) {
  const tanggal = formatTanggal(f.tanggal)
  const pad: [number, number] = [0.75, 4.5]
  const fs = 6.5
  const info = (a: string, b: string, c: string, d: string, garis = false): Baris => ({
    garisBawah: garis,
    sel: [{ t: a }, { t: ":", align: "center" }, { t: b, bold: true }, { t: c }, { t: ":", align: "center" }, { t: d, bold: true }],
  })
  const saldo = (label: string, v: number, garis = false): Baris => ({
    garisBawah: garis,
    sel: [{}, { t: label }, { t: ":", align: "center" }, { t: formatDokumen(v), align: "right", pr: 6 }, {}],
  })

  return (
    <Document title={`SP2B ${f.blu} ${DAFTAR_BULAN[f.bulan - 1]} ${f.tahun}`}>
      <Page size="A4" style={{ paddingTop: 10 * MM, paddingRight: 14 * MM, paddingBottom: 12 * MM, paddingLeft: 14 * MM }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 4.5, marginBottom: 4.5 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={{ width: 49, height: 49, marginRight: 7.5, objectFit: "contain" }} />
          <Text style={{ flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.5 }}>
            {"PEMERINTAH KABUPATEN BANDUNG\nSURAT PENGESAHAN PENDAPATAN DAN BELANJA BLU"}
          </Text>
        </View>
        <View style={{ borderWidth: 1 }}>
          <Tabel
            kolom={KOLOM_INFO}
            padding={pad}
            fontSize={fs}
            baris={[
              info("No. SP3B", f.noSp3b, "Nama BUD / Kuasa BUD", f.namaBud),
              info("Tanggal", tanggal, "Nomor", f.nomorSp2b),
              info("SKPD", f.skpd, "Tanggal", tanggal),
              info("Nama BLU", f.blu, "Tahun Anggaran", String(f.tahun), true),
              { sel: [{ cs: 6, t: "telah disahkan pendapatan dan belanja sejumlah :", pl: 3 }] },
            ]}
          />
          <Tabel
            kolom={KOLOM_SALDO}
            padding={pad}
            fontSize={fs}
            baris={[
              saldo("Saldo Awal", k.saldoAwal),
              saldo("Pendapatan", k.pendapatan),
              saldo("Belanja", k.belanja),
              saldo("Saldo Akhir", k.saldoAkhir, true),
            ]}
          />
          <Tabel
            kolom={KOLOM_INFO}
            padding={pad}
            fontSize={fs}
            baris={[
              { h: 10, sel: [{ cs: 6 }] },
              { sel: [{ cs: 3 }, { cs: 3, t: `${f.kota}, ${formatTanggal(f.tanggalTtd)}`, align: "right", pr: 7.5 }] },
              { sel: [{ cs: 3 }, { cs: 3, t: "KUASA BENDAHARA UMUM DAERAH", bold: true, align: "right", pr: 7.5 }] },
              { h: 60, sel: [{ cs: 6 }] },
              { sel: [{ cs: 3 }, { cs: 3, t: f.namaBud, bold: true, underline: true, align: "right", pr: 7.5 }] },
              { sel: [{ cs: 3 }, { cs: 3, t: `NIP. ${f.nipBud}`, align: "right", pr: 7.5 }] },
              { h: 10, sel: [{ cs: 6 }] },
            ]}
          />
        </View>
      </Page>
    </Document>
  )
}
