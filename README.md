# SIKAP BLUD Puskesmas

Aplikasi pengelolaan anggaran & realisasi BLUD Puskesmas Kabupaten Bandung.
Pengganti modul puskesmas di aplikasi low-code `sikap_blud` (menu_builder + layout HTML),
dengan tampilan yang sama tetapi logika, otorisasi, dan perhitungan di server.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · Prisma 6 + PostgreSQL · Tailwind 4 ·
Chart.js · @react-pdf/renderer (PDF SP2B/SP3B) · SheetJS (export Excel)

## Menjalankan lokal

```bash
cp .env.example .env        # isi DATABASE_URL, LEGACY_DATABASE_URL, SESSION_SECRET
npm install
npx prisma migrate deploy   # buat skema di DB baru
npm run dev
```

## Peran & akses

| Peran | Akses |
|---|---|
| `OPERATOR` | Satu puskesmas (dikunci di server). Input anggaran & realisasi, dashboard, SP2B/SP3B. |
| `ADMIN` | Semua puskesmas: dashboard rekap, matriks per puskesmas, input atas nama puskesmas, master data. |

Sesi berupa JWT HS256 di cookie httpOnly (`sikap_session`, 10 jam). Password di-hash bcrypt.
`proxy.ts` hanya menolak request tanpa sesi; setiap halaman/action tetap memverifikasi user ke DB.

## Struktur

```
app/(app)/anggaran/{dashboard,input}       menu 25, 26 lama
app/(app)/realisasi/{input,dashboard,kumulatif,per-puskesmas}  menu 23, 21, 30, 28
app/(app)/laporan/{sp2b,sp3b}              sp2b-/sp3b-generator.html lama
app/(app)/master/*                         pengganti menu "Kelola ..." berbasis tabel
app/api/laporan/[jenis]                    PDF (angka dihitung ulang di server)
lib/data.ts                                query + rollup hierarki rekening
lib/laporan.ts                             perhitungan SP2B/SP3B
lib/actions/                               server actions (input, master)
scripts/migrate-legacy.ts                  migrasi data dari DB sikap_blud
```

## Model data

- `puskesmas` (+ kepala, NIP, jabatan untuk TTD SP3B)
- `kode_rekening` — **per tahun anggaran** (`unique(tahun, kode)`), induk eksplisit via `parent_id`
- `anggaran` — murni & perubahan per puskesmas × rekening
- `realisasi` — nilai **per bulan** (bukan kumulatif), `bulan` 1–12
- `silpa` — SILPA akhir tahun, jadi saldo awal SP2B/SP3B tahun berikutnya
- `users`, `audit_log`

Nilai uang `numeric(18,2)`. Tahun baru: menu Master → Kode Rekening → "Salin ke Tahun Lain".

## Migrasi dari aplikasi lama

`scripts/migrate-legacy.ts` membaca DB lama (sesi read-only) dan menulis ke DB baru:

| Sumber (lama) | Tujuan |
|---|---|
| `master_nama_puskesmas` + `master_kepala_puskesmas_v3` | `puskesmas` |
| `master_kode_rekening_anggaran_puskesmas_fix` | `kode_rekening` (disalin untuk tiap tahun yang punya data) |
| `anggaran_puskesmas_fix` | `anggaran` |
| `realisasi_anggaran_fix` | `realisasi` |
| `data_silpa_puskesmas` (`silpa_2024`, `silpa_2025`, …) | `silpa` |
| `user` + `user_zone` + `user_metadata` (zone `puskesmas` / `admin_puskesmas`) | `users` (password lama di-hash) |

```bash
npm run migrate:legacy             # gagal bila DB tujuan sudah berisi data
npm run migrate:legacy -- --reset  # kosongkan DB tujuan lalu impor ulang
```

Script mencocokkan nama puskesmas yang berbeda ejaan (mis. "Banjaran Nambo DTP" → Nambo,
"SANKANHURIP" → Sangkanhurip), membuang kode rekening ganda, melewati baris
"Puskesmas Belum Ditentukan", lalu memverifikasi total anggaran/realisasi lama = baru.
Laporan migrasi disimpan di `audit_log`.

Tabel lama yang tidak dimigrasikan karena sudah tidak dipakai: `anggaran_murni_puskesmas(_v2)`,
`anggaran_perubahan_murni(_puskesmas)`, `realisasi_anggaran_puskesmas`,
`master_kode_rekening_puskesmas`, `master_kepala_puskesmas(_v2)`.

## Akun QA (lokal saja)

```bash
npx tsx --env-file=.env scripts/seed-qa.ts   # qa-admin@test.local, qa-operator@test.local; password = QA_PASSWORD
```

## Deploy

Konfigurasi Docker Compose untuk server ada di `deploy/` (aplikasi baru di domain utama,
aplikasi lama tetap jalan untuk modul lain). Image produksi hanya menjalankan `node server.js`;
migrasi skema dan data dijalankan lewat service `puskesmas_tools`:

```bash
docker compose build puskesmas puskesmas_tools
docker compose run --rm puskesmas_tools npx prisma migrate deploy
docker compose up -d --no-deps puskesmas
```

Env wajib container aplikasi: `DATABASE_URL`, `SESSION_SECRET`.
