import "server-only"
import { prisma } from "@/lib/db"
import { bandingkanKode } from "@/lib/rekening"

export type RekeningRow = {
  id: number
  kode: string
  uraian: string
  isLeaf: boolean
  level: number
  parentId: number | null
}

export async function daftarPuskesmas() {
  return prisma.puskesmas.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } })
}

/** Tahun yang punya bagan akun, ditambah tahun berjalan, urut terbaru dulu. */
export async function daftarTahun(): Promise<number[]> {
  const rows = await prisma.kodeRekening.findMany({ distinct: ["tahun"], select: { tahun: true } })
  const set = new Set(rows.map((r) => r.tahun))
  set.add(new Date().getFullYear())
  return [...set].sort((a, b) => b - a)
}

export async function masterRekening(tahun: number): Promise<RekeningRow[]> {
  const rows = await prisma.kodeRekening.findMany({
    where: { tahun },
    select: { id: true, kode: true, uraian: true, isLeaf: true, level: true, parentId: true },
  })
  return rows.sort((a, b) => bandingkanKode(a.kode, b.kode))
}

/**
 * Menjumlahkan nilai ke baris itu sendiri dan semua induknya (lewat parentId),
 * sama dengan rollup per-prefix kode di dashboard lama.
 */
function rollup<T>(
  master: RekeningRow[],
  nilaiPerId: Map<number, T>,
  kosong: () => T,
  tambah: (target: T, sumber: T) => void,
): Map<number, T> {
  const hasil = new Map<number, T>()
  const byId = new Map(master.map((m) => [m.id, m]))
  for (const m of master) hasil.set(m.id, kosong())
  for (const [id, nilai] of nilaiPerId) {
    let cur = byId.get(id)
    while (cur) {
      tambah(hasil.get(cur.id)!, nilai)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
  }
  return hasil
}

// ── Input ──────────────────────────────────────────────────────────────

export async function nilaiRealisasi(puskesmasId: number, tahun: number, bulan: number) {
  const rows = await prisma.realisasi.findMany({
    where: { puskesmasId, tahun, bulan },
    select: { kodeRekeningId: true, nilai: true },
  })
  return Object.fromEntries(rows.map((r) => [r.kodeRekeningId, Number(r.nilai)])) as Record<number, number>
}

export async function nilaiAnggaran(puskesmasId: number, tahun: number) {
  const rows = await prisma.anggaran.findMany({
    where: { puskesmasId, tahun },
    select: { kodeRekeningId: true, nilaiMurni: true, nilaiPerubahan: true },
  })
  return Object.fromEntries(
    rows.map((r) => [r.kodeRekeningId, { murni: Number(r.nilaiMurni), perubahan: Number(r.nilaiPerubahan) }]),
  ) as Record<number, { murni: number; perubahan: number }>
}

// ── Dashboard realisasi (bulanan & kumulatif) ────────────────────────

export type BarisBulanan = RekeningRow & { bulanan: number[]; total: number }

export async function dashboardRealisasi(tahun: number, puskesmasId: number | null): Promise<BarisBulanan[]> {
  const master = await masterRekening(tahun)
  const grup = await prisma.realisasi.groupBy({
    by: ["kodeRekeningId", "bulan"],
    where: { tahun, ...(puskesmasId ? { puskesmasId } : {}) },
    _sum: { nilai: true },
  })
  const perId = new Map<number, number[]>()
  for (const g of grup) {
    const arr = perId.get(g.kodeRekeningId) ?? Array(12).fill(0)
    arr[g.bulan - 1] += Number(g._sum.nilai ?? 0)
    perId.set(g.kodeRekeningId, arr)
  }
  const agg = rollup(master, perId, () => Array(12).fill(0) as number[], (t, s) => s.forEach((v, i) => (t[i] += v)))
  return master.map((m) => {
    const bulanan = agg.get(m.id)!
    return { ...m, bulanan, total: bulanan.reduce((a, b) => a + b, 0) }
  })
}

// ── Dashboard anggaran (per tahun) ─────────────────────────────────────

export type BarisTahunan = { kode: string; uraian: string; isLeaf: boolean; level: number; tahunan: Record<number, number>; total: number }

/**
 * Bagan akun bisa beda per tahun, jadi baris disatukan berdasarkan kode.
 * Nilai yang dipakai: anggaran perubahan kalau ada, kalau tidak anggaran murni (sama seperti dulu).
 */
export async function dashboardAnggaran(tahunList: number[], puskesmasId: number | null): Promise<BarisTahunan[]> {
  const perKode = new Map<string, BarisTahunan>()
  for (const tahun of [...tahunList].sort((a, b) => b - a)) {
    const master = await masterRekening(tahun)
    // Per baris asli supaya aturan "perubahan, jika 0 pakai murni" berlaku per puskesmas.
    const detail = await prisma.anggaran.findMany({
      where: { tahun, ...(puskesmasId ? { puskesmasId } : {}) },
      select: { kodeRekeningId: true, nilaiMurni: true, nilaiPerubahan: true },
    })
    const perId = new Map<number, { v: number }>()
    for (const d of detail) {
      const p = Number(d.nilaiPerubahan)
      const cur = perId.get(d.kodeRekeningId) ?? { v: 0 }
      cur.v += p !== 0 ? p : Number(d.nilaiMurni)
      perId.set(d.kodeRekeningId, cur)
    }
    const agg = rollup(master, perId, () => ({ v: 0 }), (t, s) => (t.v += s.v))
    for (const m of master) {
      const baris = perKode.get(m.kode) ?? { kode: m.kode, uraian: m.uraian, isLeaf: m.isLeaf, level: m.level, tahunan: {}, total: 0 }
      const v = agg.get(m.id)!.v
      baris.tahunan[tahun] = v
      baris.total += v
      perKode.set(m.kode, baris)
    }
  }
  return [...perKode.values()].sort((a, b) => bandingkanKode(a.kode, b.kode))
}

// ── Matriks realisasi per puskesmas (admin) ──────────────────────────

export type BarisPerPuskesmas = RekeningRow & { perPuskesmas: Record<number, number>; total: number }

export async function realisasiPerPuskesmas(tahun: number, bulan: number | null): Promise<BarisPerPuskesmas[]> {
  const master = await masterRekening(tahun)
  const grup = await prisma.realisasi.groupBy({
    by: ["kodeRekeningId", "puskesmasId"],
    where: { tahun, ...(bulan ? { bulan } : {}) },
    _sum: { nilai: true },
  })
  const perId = new Map<number, Record<number, number>>()
  for (const g of grup) {
    const obj = perId.get(g.kodeRekeningId) ?? {}
    obj[g.puskesmasId] = (obj[g.puskesmasId] ?? 0) + Number(g._sum.nilai ?? 0)
    perId.set(g.kodeRekeningId, obj)
  }
  const agg = rollup(
    master,
    perId,
    () => ({}) as Record<number, number>,
    (t, s) => {
      for (const [k, v] of Object.entries(s)) t[Number(k)] = (t[Number(k)] ?? 0) + v
    },
  )
  return master.map((m) => {
    const perPuskesmas = agg.get(m.id)!
    return { ...m, perPuskesmas, total: Object.values(perPuskesmas).reduce((a, b) => a + b, 0) }
  })
}
