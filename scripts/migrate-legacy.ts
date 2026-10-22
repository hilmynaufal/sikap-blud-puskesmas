/**
 * Migrasi satu kali dari database sikap_blud (low-code) ke skema aplikasi baru.
 *
 *   npm run migrate:legacy            -> gagal kalau DB tujuan sudah berisi data
 *   npm run migrate:legacy -- --reset -> kosongkan tabel tujuan lalu impor ulang
 *
 * Database lama hanya dibaca (sesi diset read-only).
 */
import { Client } from "pg"
import bcrypt from "bcryptjs"
import { Prisma, PrismaClient, Role } from "@prisma/client"
import { bulanKeAngka } from "../lib/bulan"
import { cariKodeInduk, levelKode } from "../lib/rekening"

const TABEL = {
  puskesmas: "master_nama_puskesmas",
  kepala: "master_kepala_puskesmas_v3",
  rekening: "master_kode_rekening_anggaran_puskesmas_fix",
  anggaran: "anggaran_puskesmas_fix",
  realisasi: "realisasi_anggaran_fix",
  silpa: "data_silpa_puskesmas",
}

/** Nama di tabel kepala/SILPA yang tidak bisa dicocokkan dengan normalisasi biasa. */
const ALIAS_PUSKESMAS: Record<string, string> = {
  BANJARANNAMBO: "NAMBO",
  RANCAMANYAR: "RANCAMALAKAENDAH",
  SANKANHURIP: "SANGKANHURIP",
}

function kunciNama(nama: string): string {
  const k = nama
    .trim()
    .replace(/^puskesmas\s+/i, "")
    .replace(/\s+DTP$/i, "")
    .replace(/\s+/g, "")
    .toUpperCase()
  return ALIAS_PUSKESMAS[k] ?? k
}

function keDecimal(v: unknown): Prisma.Decimal | null {
  if (v === null || v === undefined || String(v).trim() === "") return null
  const n = Number(String(v).trim())
  if (!Number.isFinite(n)) return null
  return new Prisma.Decimal(n.toFixed(2))
}

const laporan: string[] = []
function catat(pesan: string) {
  laporan.push(pesan)
  console.log(pesan)
}

async function chunked<T>(rows: T[], size: number, fn: (part: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size))
}

async function main() {
  const reset = process.argv.includes("--reset")
  const legacyUrl = process.env.LEGACY_DATABASE_URL
  if (!legacyUrl) throw new Error("LEGACY_DATABASE_URL belum diset")

  const legacy = new Client({ connectionString: legacyUrl.replace(/\?schema=\w+$/, "") })
  await legacy.connect()
  await legacy.query("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY")
  const q = async <T = Record<string, unknown>>(sql: string) => (await legacy.query(sql)).rows as T[]

  const prisma = new PrismaClient()

  try {
    const sudahAda = await prisma.puskesmas.count()
    if (sudahAda > 0 && !reset) {
      throw new Error("Database tujuan sudah berisi data. Jalankan dengan --reset untuk impor ulang.")
    }
    if (reset) {
      await prisma.$executeRawUnsafe(
        `TRUNCATE audit_log, realisasi, anggaran, silpa, users, kode_rekening, puskesmas RESTART IDENTITY CASCADE`,
      )
      catat("Tabel tujuan dikosongkan (--reset).")
    }

    // ── 1. Puskesmas + kepala ─────────────────────────────────────────
    const puskLama = await q<{ nama_puskesmas: string }>(
      `SELECT DISTINCT trim(nama_puskesmas) AS nama_puskesmas FROM ${TABEL.puskesmas} ORDER BY 1`,
    )
    const kepalaLama = await q<{ nama_puskesmas: string; nama_jabatan: string; nama_kepala_puskesmas: string; nip: string }>(
      `SELECT * FROM ${TABEL.kepala}`,
    )
    const kepalaByKey = new Map(kepalaLama.map((k) => [kunciNama(k.nama_puskesmas), k]))

    const puskIdByKey = new Map<string, number>()
    const puskIdByNama = new Map<string, number>()
    for (const p of puskLama) {
      const kepala = kepalaByKey.get(kunciNama(p.nama_puskesmas))
      if (!kepala) catat(`  ! Kepala tidak ditemukan untuk ${p.nama_puskesmas}`)
      const row = await prisma.puskesmas.create({
        data: {
          nama: p.nama_puskesmas,
          namaKepala: kepala?.nama_kepala_puskesmas?.trim() || null,
          nipKepala: kepala?.nip?.replace(/^NIP\.\s*/i, "").trim() || null,
          jabatanKepala: kepala?.nama_jabatan?.trim() || null,
        },
      })
      puskIdByKey.set(kunciNama(p.nama_puskesmas), row.id)
      puskIdByNama.set(p.nama_puskesmas, row.id)
    }
    catat(`Puskesmas: ${puskLama.length} (kepala terpasang: ${[...puskIdByKey.keys()].filter((k) => kepalaByKey.has(k)).length})`)

    const cariPusk = (nama: string) => puskIdByNama.get(nama.trim()) ?? puskIdByKey.get(kunciNama(nama))

    // ── 2. Kode rekening (disalin untuk setiap tahun yang punya data) ───────
    const rekLama = await q<{ id: number; kode_rekening: string; uraian: string; is_leaf: string }>(
      `SELECT id, trim(kode_rekening) AS kode_rekening, trim(uraian) AS uraian, is_leaf FROM ${TABEL.rekening} ORDER BY id`,
    )
    const rekUnik = new Map<string, (typeof rekLama)[number]>()
    for (const r of rekLama) {
      if (!r.kode_rekening) continue
      if (rekUnik.has(r.kode_rekening)) {
        catat(`  ! Kode ganda ${r.kode_rekening}: dipakai "${rekUnik.get(r.kode_rekening)!.uraian}", diabaikan "${r.uraian}" (id ${r.id})`)
        continue
      }
      rekUnik.set(r.kode_rekening, r)
    }

    const tahunData = await q<{ tahun: string }>(
      `SELECT DISTINCT trim(tahun::text) AS tahun FROM ${TABEL.anggaran}
       UNION SELECT DISTINCT trim(split_part(tahun::text, '.', 1)) FROM ${TABEL.realisasi}`,
    )
    const daftarTahun = [...new Set(tahunData.map((t) => parseInt(t.tahun, 10)).filter(Number.isFinite))].sort()
    if (daftarTahun.length === 0) daftarTahun.push(new Date().getFullYear())

    const semuaKode = new Set(rekUnik.keys())
    const rekIdByTahunKode = new Map<string, number>()
    for (const tahun of daftarTahun) {
      // Induk dulu (urut level) supaya parentId bisa langsung diisi.
      const urut = [...rekUnik.values()].sort((a, b) => levelKode(a.kode_rekening) - levelKode(b.kode_rekening))
      for (const r of urut) {
        const induk = cariKodeInduk(r.kode_rekening, semuaKode)
        const row = await prisma.kodeRekening.create({
          data: {
            tahun,
            kode: r.kode_rekening,
            uraian: r.uraian,
            isLeaf: String(r.is_leaf) === "1",
            level: levelKode(r.kode_rekening),
            parentId: induk ? rekIdByTahunKode.get(`${tahun}|${induk}`) ?? null : null,
          },
        })
        rekIdByTahunKode.set(`${tahun}|${r.kode_rekening}`, row.id)
      }
    }
    catat(`Kode rekening: ${rekUnik.size} kode x tahun [${daftarTahun.join(", ")}]`)

    // ── 3. Pengguna (hanya zone puskesmas & admin_puskesmas) ─────────────
    const userLama = await q<{
      id: number; nama: string; email: string; password: string; status: string; zones: string[] | null; pusk: string | null
    }>(`
      SELECT u.id, u.nama, lower(trim(u.email)) AS email, u.password, u.status,
             array_agg(DISTINCT z.kode) FILTER (WHERE z.kode IS NOT NULL) AS zones,
             max(m."metaValue") FILTER (WHERE m."metaKey" = 'puskesmas') AS pusk
      FROM "user" u
      LEFT JOIN user_zone uz ON uz."userId" = u.id
      LEFT JOIN zone z ON z.id = uz."zoneId"
      LEFT JOIN user_metadata m ON m."userId" = u.id
      GROUP BY u.id ORDER BY u.id`)

    let jumlahAdmin = 0
    let jumlahOperator = 0
    for (const u of userLama) {
      const zones = u.zones ?? []
      let role: Role | null = null
      let puskesmasId: number | null = null
      if (zones.includes("admin_puskesmas")) {
        role = Role.ADMIN
      } else if (zones.includes("puskesmas")) {
        puskesmasId = u.pusk ? cariPusk(u.pusk) ?? null : null
        if (!puskesmasId) {
          catat(`  ! Pengguna ${u.email} dilewati: puskesmas "${u.pusk ?? "-"}" tidak dikenal`)
          continue
        }
        role = Role.OPERATOR
      }
      if (!role) continue
      await prisma.user.create({
        data: {
          email: u.email,
          nama: u.nama,
          // Password lama tersimpan plaintext; di-hash supaya pengguna tetap bisa login.
          passwordHash: await bcrypt.hash(u.password, 10),
          role,
          puskesmasId,
          aktif: u.status === "active",
        },
      })
      if (role === Role.ADMIN) jumlahAdmin++
      else jumlahOperator++
    }
    catat(`Pengguna: ${jumlahAdmin} admin, ${jumlahOperator} operator`)

    // ── 4. Anggaran ─────────────────────────────────────────────────
    const anggLama = await q<{
      kode_rekening: string; nama_puskesmas: string; tahun: string; nilai_anggaran_murni: string; nilai_anggaran_perubahan: string
    }>(`SELECT * FROM ${TABEL.anggaran}`)
    const anggBaru: Prisma.AnggaranCreateManyInput[] = []
    const lewatAnggaran: Record<string, number> = {}
    for (const a of anggLama) {
      const tahun = parseInt(String(a.tahun), 10)
      const puskesmasId = cariPusk(a.nama_puskesmas)
      const kodeRekeningId = rekIdByTahunKode.get(`${tahun}|${a.kode_rekening.trim()}`)
      if (!puskesmasId || !kodeRekeningId) {
        const alasan = !puskesmasId ? `puskesmas "${a.nama_puskesmas}"` : `kode ${a.kode_rekening}`
        lewatAnggaran[alasan] = (lewatAnggaran[alasan] ?? 0) + 1
        continue
      }
      anggBaru.push({
        puskesmasId,
        kodeRekeningId,
        tahun,
        nilaiMurni: keDecimal(a.nilai_anggaran_murni) ?? 0,
        nilaiPerubahan: keDecimal(a.nilai_anggaran_perubahan) ?? 0,
      })
    }
    await chunked(anggBaru, 1000, (part) => prisma.anggaran.createMany({ data: part }))
    catat(`Anggaran: ${anggBaru.length}/${anggLama.length} baris`)
    for (const [alasan, n] of Object.entries(lewatAnggaran)) catat(`  ! Anggaran dilewati (${alasan}): ${n}`)

    // ── 5. Realisasi ────────────────────────────────────────────────
    const realLama = await q<{ kode_rekening: string; nama_puskesmas: string; tahun: string; bulan: string; nilai_realisasi: string }>(
      `SELECT * FROM ${TABEL.realisasi}`,
    )
    const realBaru: Prisma.RealisasiCreateManyInput[] = []
    const lewatRealisasi: Record<string, number> = {}
    for (const r of realLama) {
      const tahun = parseInt(String(r.tahun), 10)
      const bulan = bulanKeAngka(r.bulan)
      const puskesmasId = cariPusk(r.nama_puskesmas)
      const kodeRekeningId = rekIdByTahunKode.get(`${tahun}|${r.kode_rekening.trim()}`)
      const nilai = keDecimal(r.nilai_realisasi)
      let alasan: string | null = null
      if (!puskesmasId) alasan = `puskesmas "${r.nama_puskesmas}"`
      else if (!kodeRekeningId) alasan = `kode ${r.kode_rekening}`
      else if (!bulan) alasan = `bulan "${r.bulan}"`
      else if (!nilai || nilai.isZero()) alasan = "nilai kosong/nol"
      if (alasan) {
        lewatRealisasi[alasan] = (lewatRealisasi[alasan] ?? 0) + 1
        continue
      }
      realBaru.push({ puskesmasId: puskesmasId!, kodeRekeningId: kodeRekeningId!, tahun, bulan: bulan!, nilai: nilai! })
    }
    await chunked(realBaru, 2000, (part) => prisma.realisasi.createMany({ data: part }))
    catat(`Realisasi: ${realBaru.length}/${realLama.length} baris`)
    for (const [alasan, n] of Object.entries(lewatRealisasi)) catat(`  ! Realisasi dilewati (${alasan}): ${n}`)

    // ── 6. SILPA ────────────────────────────────────────────────────
    // Kolom tahunan di tabel lama: silpa_2024, silpa_2025 (+ rincian 2025).
    const silpaLama = await q<Record<string, string | null>>(`SELECT * FROM ${TABEL.silpa}`)
    const tahunSilpaTerakhir = Math.max(
      ...Object.keys(silpaLama[0] ?? {}).map((k) => parseInt(k.match(/^silpa_(\d{4})$/)?.[1] ?? "0", 10)),
    )
    let jumlahSilpa = 0
    for (const s of silpaLama) {
      const puskesmasId = s.puskesmas_ ? cariPusk(s.puskesmas_) : undefined
      if (!puskesmasId) {
        catat(`  ! SILPA dilewati: puskesmas "${s.puskesmas_}" tidak dikenal`)
        continue
      }
      for (const kolom of Object.keys(s)) {
        const m = kolom.match(/^silpa_(\d{4})$/)
        if (!m) continue
        const tahun = parseInt(m[1], 10)
        const nilai = keDecimal(s[kolom])
        if (nilai === null) continue
        await prisma.silpa.create({
          data: {
            puskesmasId,
            tahun,
            nilai,
            // Kolom penyetoran tidak bertahun; di sumber hanya relevan untuk tahun terakhir.
            penyetoranRkud: tahun === tahunSilpaTerakhir ? keDecimal(s.penyetoran_silpa_ke_rkud_ ?? null) : null,
            pendapatan: keDecimal(s[`pendapatan_sd_desember_${tahun}`] ?? null),
            belanja: keDecimal(s[`belanja_sd_desember_${tahun}`] ?? null),
          },
        })
        jumlahSilpa++
      }
    }
    catat(`SILPA: ${jumlahSilpa} baris (puskesmas x tahun)`)

    // ── 7. Verifikasi total ──────────────────────────────────────────
    const [totRealLama] = await q<{ total: string }>(`
      SELECT coalesce(sum(nilai_realisasi::numeric),0)::text AS total FROM ${TABEL.realisasi} r
      WHERE EXISTS (SELECT 1 FROM ${TABEL.puskesmas} p WHERE trim(p.nama_puskesmas) = trim(r.nama_puskesmas))`)
    const totRealBaru = await prisma.realisasi.aggregate({ _sum: { nilai: true } })
    const [totAnggLama] = await q<{ murni: string; perubahan: string }>(`
      SELECT coalesce(sum(nilai_anggaran_murni::numeric),0)::text AS murni,
             coalesce(sum(nilai_anggaran_perubahan::numeric),0)::text AS perubahan FROM ${TABEL.anggaran}`)
    const totAnggBaru = await prisma.anggaran.aggregate({ _sum: { nilaiMurni: true, nilaiPerubahan: true } })

    const cek = (label: string, lama: string, baru: Prisma.Decimal | null) => {
      const ok = new Prisma.Decimal(lama).equals(baru ?? 0)
      catat(`${ok ? "OK " : "BEDA"} ${label}: lama ${lama} | baru ${baru?.toString() ?? "0"}`)
      return ok
    }
    const semuaOk = [
      cek("Total realisasi (puskesmas terdaftar)", totRealLama.total, totRealBaru._sum.nilai),
      cek("Total anggaran murni", totAnggLama.murni, totAnggBaru._sum.nilaiMurni),
      cek("Total anggaran perubahan", totAnggLama.perubahan, totAnggBaru._sum.nilaiPerubahan),
    ].every(Boolean)

    await prisma.auditLog.create({
      data: { aksi: "migrasi_legacy", entitas: "sistem", detail: { laporan } },
    })
    if (!semuaOk) process.exitCode = 1
  } finally {
    await legacy.end()
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
