/**
 * Membuat akun QA untuk uji lokal (tidak untuk produksi):
 *   qa-admin@test.local     -> ADMIN
 *   qa-operator@test.local  -> OPERATOR Puskesmas Arjasari
 * Password diambil dari QA_PASSWORD di .env.
 *
 *   npx tsx --env-file=.env scripts/seed-qa.ts
 */
import bcrypt from "bcryptjs"
import { PrismaClient, Role } from "@prisma/client"

async function main() {
  const password = process.env.QA_PASSWORD
  if (!password || password.length < 8) throw new Error("QA_PASSWORD belum diset di .env")
  if (process.env.NODE_ENV === "production") throw new Error("Jangan jalankan seed QA di produksi")

  const prisma = new PrismaClient()
  const hash = await bcrypt.hash(password, 10)
  const arjasari = await prisma.puskesmas.findFirstOrThrow({ where: { nama: "Puskesmas Arjasari" } })

  for (const u of [
    { email: "qa-admin@test.local", nama: "QA Admin Kabupaten", role: Role.ADMIN, puskesmasId: null },
    { email: "qa-operator@test.local", nama: "QA Operator Arjasari", role: Role.OPERATOR, puskesmasId: arjasari.id },
  ]) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { ...u, passwordHash: hash },
      update: { ...u, passwordHash: hash, aktif: true },
    })
    console.log(`Akun QA siap: ${u.email}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
