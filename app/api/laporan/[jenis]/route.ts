import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/db"
import { AksesDitolak, getCurrentUser, puskesmasWajib } from "@/lib/auth"
import { DAFTAR_BULAN } from "@/lib/bulan"
import { hitungKeuangan, infoPuskesmas } from "@/lib/laporan"
import { sp2bFormSchema, sp3bFormSchema } from "@/lib/laporan-form"
import { PdfSp2b, PdfSp3b } from "@/lib/pdf/dokumen-pdf"

export const runtime = "nodejs"

let logoCache: Buffer | null = null
async function logo() {
  logoCache ??= await readFile(path.join(process.cwd(), "public", "images", "logo.png"))
  return logoCache
}

/**
 * POST /api/laporan/sp3b | /api/laporan/sp2b
 * Body: isian kepala surat. Angka keuangan dihitung ulang di sini dari database,
 * jadi PDF tidak bisa dimanipulasi dari klien.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ status: "error", message: "Tidak terautentikasi" }, { status: 401 })

  try {
    const body = await req.json()
    if (jenis !== "sp3b" && jenis !== "sp2b") {
      return NextResponse.json({ status: "error", message: "Jenis laporan tidak dikenal" }, { status: 404 })
    }
    const sp3b = jenis === "sp3b" ? sp3bFormSchema.parse(body) : null
    const sp2b = jenis === "sp2b" ? sp2bFormSchema.parse(body) : null
    const form = (sp3b ?? sp2b)!
    const puskesmasId = puskesmasWajib(user, form.puskesmasId)
    const pusk = await infoPuskesmas(puskesmasId)
    if (!pusk) return NextResponse.json({ status: "error", message: "Puskesmas tidak ditemukan" }, { status: 404 })

    const k = await hitungKeuangan(puskesmasId, form.tahun, form.bulan)
    const img = await logo()
    const doc = sp3b
      ? PdfSp3b({ f: { ...sp3b, puskesmasId }, k, logo: img })
      : PdfSp2b({ f: { ...sp2b!, puskesmasId }, k, logo: img })
    const pdf = await renderToBuffer(doc)

    await prisma.auditLog.create({
      data: { userId: user.id, aksi: "cetak", entitas: jenis, detail: { puskesmasId, tahun: form.tahun, bulan: form.bulan } },
    })

    const nama = `${jenis.toUpperCase()}_${pusk.nama.replace(/^puskesmas\s+/i, "")}_${DAFTAR_BULAN[form.bulan - 1]}_${form.tahun}.pdf`.replace(/\s+/g, "_")
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nama}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    if (err instanceof AksesDitolak) return NextResponse.json({ status: "error", message: err.message }, { status: 403 })
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ status: "error", message: "Isian laporan tidak valid" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ status: "error", message: "Gagal membuat PDF" }, { status: 500 })
  }
}
