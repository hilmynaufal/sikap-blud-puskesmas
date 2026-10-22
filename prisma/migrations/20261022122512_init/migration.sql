-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "puskesmas_id" INTEGER,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puskesmas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nama_kepala" TEXT,
    "nip_kepala" TEXT,
    "jabatan_kepala" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puskesmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kode_rekening" (
    "id" SERIAL NOT NULL,
    "tahun" INTEGER NOT NULL,
    "kode" TEXT NOT NULL,
    "uraian" TEXT NOT NULL,
    "is_leaf" BOOLEAN NOT NULL,
    "level" INTEGER NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "kode_rekening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggaran" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" INTEGER NOT NULL,
    "kode_rekening_id" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "nilai_murni" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nilai_perubahan" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realisasi" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" INTEGER NOT NULL,
    "kode_rekening_id" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "nilai" DECIMAL(18,2) NOT NULL,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silpa" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "nilai" DECIMAL(18,2) NOT NULL,
    "penyetoran_rkud" DECIMAL(18,2),
    "pendapatan" DECIMAL(18,2),
    "belanja" DECIMAL(18,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "silpa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "puskesmas_nama_key" ON "puskesmas"("nama");

-- CreateIndex
CREATE INDEX "kode_rekening_tahun_idx" ON "kode_rekening"("tahun");

-- CreateIndex
CREATE UNIQUE INDEX "kode_rekening_tahun_kode_key" ON "kode_rekening"("tahun", "kode");

-- CreateIndex
CREATE INDEX "anggaran_tahun_puskesmas_id_idx" ON "anggaran"("tahun", "puskesmas_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggaran_puskesmas_id_kode_rekening_id_key" ON "anggaran"("puskesmas_id", "kode_rekening_id");

-- CreateIndex
CREATE INDEX "realisasi_tahun_puskesmas_id_bulan_idx" ON "realisasi"("tahun", "puskesmas_id", "bulan");

-- CreateIndex
CREATE UNIQUE INDEX "realisasi_puskesmas_id_kode_rekening_id_bulan_key" ON "realisasi"("puskesmas_id", "kode_rekening_id", "bulan");

-- CreateIndex
CREATE UNIQUE INDEX "silpa_puskesmas_id_tahun_key" ON "silpa"("puskesmas_id", "tahun");

-- CreateIndex
CREATE INDEX "audit_log_entitas_created_at_idx" ON "audit_log"("entitas", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kode_rekening" ADD CONSTRAINT "kode_rekening_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "kode_rekening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran" ADD CONSTRAINT "anggaran_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran" ADD CONSTRAINT "anggaran_kode_rekening_id_fkey" FOREIGN KEY ("kode_rekening_id") REFERENCES "kode_rekening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realisasi" ADD CONSTRAINT "realisasi_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realisasi" ADD CONSTRAINT "realisasi_kode_rekening_id_fkey" FOREIGN KEY ("kode_rekening_id") REFERENCES "kode_rekening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silpa" ADD CONSTRAINT "silpa_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
