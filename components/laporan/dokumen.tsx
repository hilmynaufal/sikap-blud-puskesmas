/* Pratinjau dokumen di layar, markup disalin dari sp3b-generator.html & sp2b-generator.html.
   PDF resmi dibuat di server (lib/pdf) dari data yang sama. */
import { formatDokumen } from "@/lib/format"
import { DAFTAR_BULAN } from "@/lib/bulan"
import { formatTanggal, type Sp2bForm, type Sp3bForm } from "@/lib/laporan-form"
import type { DataKeuangan } from "@/lib/laporan"

const BELANJA_ITEMS = [
  { label: "Belanja Pegawai BLUD", key: "bPegawai" },
  { label: "Belanja Barang dan Jasa BLUD", key: "bBarang" },
  { label: "Belanja Modal", key: "bModal" },
] as const

/** Baris tabel: minimal 3 (jenis belanja), ditambah bila kode pendapatan lebih banyak. */
export function barisTabelSp3b(k: DataKeuangan) {
  const n = Math.max(k.jumlahKodePendapatan, BELANJA_ITEMS.length)
  return Array.from({ length: n }, (_, i) => BELANJA_ITEMS[i] ?? null)
}

/** Kode pendapatan utama yang dicetak di tabel SP3B (sama dengan generator lama). */
export const KODE_PENDAPATAN_UTAMA = "4.1.02.01.01.0001"

export function DokumenSp3b({ f, k, zoom }: { f: Sp3bForm; k: DataKeuangan; zoom?: number }) {
  const h = (px: number) => ({ height: px })
  return (
    <div className="sp-doc sp3b-doc" style={zoom ? { zoom: `${zoom}%` } : undefined}>
      <div className="sp3b-header-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Logo Kabupaten Bandung" />
        <h1>
          PEMERINTAH KABUPATEN BANDUNG
          <br />
          SURAT PERMINTAAN PENGESAHAN PENDAPATAN DAN BELANJA (SP3B)
          <br />
          BLU
        </h1>
      </div>

      <div className="sp3b-form-body">
        <table>
          <colgroup>
            {[17.0, 3.3, 10.5, 1.7, 17.0, 17.5, 9.8, 10.3, 12.9].map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <tbody>
            <tr style={h(27)}>
              <td className="right">Tanggal</td>
              <td className="center">:</td>
              <td colSpan={3} className="bold left">{formatTanggal(f.tanggal)}</td>
              <td className="right">Nomor &nbsp;:</td>
              <td colSpan={3} className="left">{f.nomor}</td>
            </tr>
            <tr style={h(4)}><td colSpan={9}></td></tr>
            <tr style={h(27)} className="div-line">
              <td colSpan={9} style={{ paddingLeft: 4, borderTop: "1px solid black" }}>
                Kepala SKPD <span className="bold">{f.organisasi}</span> memohon kepada :
              </td>
            </tr>
            <tr style={h(27)} className="div-line">
              <td colSpan={9} style={{ paddingLeft: 4 }}>Bendahara Umum Daerah selaku PPKD</td>
            </tr>
            <tr style={h(27)}>
              <td colSpan={9} style={{ paddingLeft: 4 }}>agar mengesahkan dan membukukan pendapatan dan belanja sejumlah :</td>
            </tr>
            {(
              [
                ["Saldo Awal", k.saldoAwal],
                ["Pendapatan", k.pendapatan],
                ["Belanja", k.belanja],
                ["Saldo Akhir", k.saldoAkhir],
              ] as const
            ).map(([label, v], i) => (
              <tr key={label} style={h(27)} className={i === 3 ? "div-line" : undefined}>
                <td colSpan={2}></td>
                <td>{label}</td>
                <td className="center">:</td>
                <td className="right" style={{ paddingRight: 10 }}>{formatDokumen(v)}</td>
                <td colSpan={4}></td>
              </tr>
            ))}
            <tr style={h(27)} className="div-line">
              <td style={{ paddingLeft: 4 }}>Untuk Bulan</td>
              <td className="center">:</td>
              <td colSpan={3} className="bold left">{DAFTAR_BULAN[f.bulan - 1].toUpperCase()}</td>
              <td colSpan={4} style={{ paddingLeft: 4 }}>
                Tahun Anggaran <span className="bold">{f.tahun}</span>
              </td>
            </tr>
            <tr style={h(8)}><td colSpan={9}></td></tr>
            {(
              [
                ["Dasar Pengesahan", f.dasar, true],
                ["Urusan", f.urusan, false],
                ["Organisasi", f.organisasi, false],
                ["Nama BLU", f.blu, false],
                ["Program Kegiatan", f.program, false],
              ] as const
            ).map(([label, v, wrap], i) => (
              <tr key={label} style={h(27)} className={i === 4 ? "div-line" : undefined}>
                <td style={{ paddingLeft: 4 }}>{label}</td>
                <td className="center">:</td>
                <td colSpan={7} className={`bold left ${wrap ? "wrap" : ""}`}>{v}</td>
              </tr>
            ))}
            <tr style={h(28)}>
              <td colSpan={5} className="cb cb-no-l bold center">PENDAPATAN</td>
              <td colSpan={4} className="cb cb-no-r bold center">BELANJA</td>
            </tr>
            <tr style={h(28)}>
              <td colSpan={2} className="cb cb-no-l bold center">KODE REKENING</td>
              <td colSpan={3} className="cb bold center">JUMLAH</td>
              <td colSpan={2} className="cb bold center">JENIS BELANJA</td>
              <td colSpan={2} className="cb cb-no-r bold center">JUMLAH</td>
            </tr>
            {barisTabelSp3b(k).map((b, i) => (
              <tr key={i} style={h(27)}>
                <td colSpan={2} className="cb cb-no-l center">{i === 0 ? KODE_PENDAPATAN_UTAMA : ""}</td>
                <td colSpan={3} className="cb right" style={{ paddingRight: 6 }}>{i === 0 ? formatDokumen(k.pendapatan) : ""}</td>
                <td colSpan={2} className="cb left" style={{ paddingLeft: 4 }}>{b?.label ?? ""}</td>
                <td colSpan={2} className="cb cb-no-r right" style={{ paddingRight: 6 }}>{b ? formatDokumen(k[b.key]) : ""}</td>
              </tr>
            ))}
            <tr style={h(27)}>
              <td colSpan={2} className="cb cb-no-l"></td>
              <td colSpan={3} className="cb"></td>
              <td colSpan={2} className="cb"></td>
              <td colSpan={2} className="cb cb-no-r"></td>
            </tr>
            <tr style={h(28)}>
              <td colSpan={2} className="cb cb-no-l bold center" style={{ fontSize: "8pt" }}>JUMLAH PENDAPATAN</td>
              <td colSpan={3} className="cb bold right" style={{ paddingRight: 6 }}>{formatDokumen(k.pendapatan)}</td>
              <td colSpan={2} className="cb bold center" style={{ fontSize: "8pt" }}>JUMLAH BELANJA</td>
              <td colSpan={2} className="cb cb-no-r bold right" style={{ paddingRight: 6 }}>{formatDokumen(k.belanja)}</td>
            </tr>
            <tr style={h(12)}><td colSpan={9}></td></tr>
            <tr style={h(12)}><td colSpan={9}></td></tr>
            <tr style={h(26)}>
              <td colSpan={6}></td>
              <td className="right">{f.kota},</td>
              <td colSpan={2} className="bold left" style={{ paddingLeft: 4 }}>{formatTanggal(f.tanggalTtd)}</td>
            </tr>
            <tr style={h(26)}>
              <td colSpan={6}></td>
              <td colSpan={3} className="bold center wrap">{f.jabatan}</td>
            </tr>
            {Array.from({ length: 7 }, (_, i) => (
              <tr key={`s${i}`} style={h(14)}><td colSpan={9}></td></tr>
            ))}
            <tr style={h(26)}>
              <td colSpan={6}></td>
              <td colSpan={3} className="center"><span className="sig-name">{f.namaKepala}</span></td>
            </tr>
            <tr style={h(26)}>
              <td colSpan={6}></td>
              <td colSpan={3} className="center">NIP. {f.nip}</td>
            </tr>
            <tr style={h(10)}><td colSpan={9}></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const KOLOM_INFO = [16, 2, 33, 19, 2, 28]
const KOLOM_SALDO = [5, 18, 3, 20, 54]

function Cols({ w }: { w: number[] }) {
  return (
    <colgroup>
      {w.map((x, i) => (
        <col key={i} style={{ width: `${x}%` }} />
      ))}
    </colgroup>
  )
}

export function DokumenSp2b({ f, k, zoom }: { f: Sp2bForm; k: DataKeuangan; zoom?: number }) {
  const tanggal = formatTanggal(f.tanggal)
  return (
    <div className="sp-doc sp2b-doc" style={zoom ? { zoom: `${zoom}%` } : undefined}>
      <div className="sp2b-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Logo Kabupaten Bandung" />
        <h1>
          PEMERINTAH KABUPATEN BANDUNG
          <br />
          SURAT PENGESAHAN PENDAPATAN DAN BELANJA BLU
        </h1>
      </div>

      <div className="sp2b-box">
        <table>
          <Cols w={KOLOM_INFO} />
          <tbody>
            {(
              [
                ["No. SP3B", f.noSp3b, "Nama BUD / Kuasa BUD", f.namaBud],
                ["Tanggal", tanggal, "Nomor", f.nomorSp2b],
                ["SKPD", f.skpd, "Tanggal", tanggal],
                ["Nama BLU", f.blu, "Tahun Anggaran", String(f.tahun)],
              ] as const
            ).map(([a, b, c, d], i) => (
              <tr key={a + c} className={i === 3 ? "row-divider" : undefined}>
                <td>{a}</td>
                <td className="center">:</td>
                <td className="bold">{b}</td>
                <td>{c}</td>
                <td className="center">:</td>
                <td className="bold">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <Cols w={KOLOM_INFO} />
          <tbody>
            <tr>
              <td colSpan={6} style={{ paddingLeft: 4 }}>telah disahkan pendapatan dan belanja sejumlah :</td>
            </tr>
          </tbody>
        </table>
        <table>
          <Cols w={KOLOM_SALDO} />
          <tbody>
            {(
              [
                ["Saldo Awal", k.saldoAwal],
                ["Pendapatan", k.pendapatan],
                ["Belanja", k.belanja],
                ["Saldo Akhir", k.saldoAkhir],
              ] as const
            ).map(([label, v], i) => (
              <tr key={label} className={i === 3 ? "row-divider" : undefined}>
                <td></td>
                <td>{label}</td>
                <td className="center">:</td>
                <td className="right" style={{ paddingRight: 8 }}>{formatDokumen(v)}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <Cols w={KOLOM_INFO} />
          <tbody>
            <tr><td colSpan={6}></td></tr>
            <tr>
              <td colSpan={3}></td>
              <td colSpan={3} className="right" style={{ paddingRight: 10 }}>{f.kota}, {formatTanggal(f.tanggalTtd)}</td>
            </tr>
            <tr>
              <td colSpan={3}></td>
              <td colSpan={3} className="bold right" style={{ paddingRight: 10 }}>KUASA BENDAHARA UMUM DAERAH</td>
            </tr>
            <tr style={{ height: 60 }}><td colSpan={6}></td></tr>
            <tr>
              <td colSpan={3}></td>
              <td colSpan={3} className="right" style={{ paddingRight: 10 }}>
                <span className="sig-name">{f.namaBud}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={3}></td>
              <td colSpan={3} className="right" style={{ paddingRight: 10 }}>NIP. {f.nipBud}</td>
            </tr>
            <tr><td colSpan={6}></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
