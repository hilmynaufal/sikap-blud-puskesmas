export type NavLink = { title: string; url: string }
export type NavMenu = { id: string; title: string; url: string; iconPath?: string; children?: NavLink[] }

const anggaran: NavMenu = {
  id: "anggaran",
  title: "Anggaran Puskesmas",
  url: "#",
  children: [
    { title: "Dashboard Anggaran Puskesmas", url: "/anggaran/dashboard" },
    { title: "Input Anggaran Puskesmas", url: "/anggaran/input" },
  ],
}

const realisasi: NavMenu = {
  id: "realisasi",
  title: "Realisasi Puskesmas",
  url: "#",
  iconPath: "/images/icon-realisasi.svg",
  children: [
    { title: "Input Realisasi Puskesmas", url: "/realisasi/input" },
    { title: "Dashboard Realisasi Puskesmas", url: "/realisasi/dashboard" },
    { title: "Dashboard Total Realisasi Kumulatif", url: "/realisasi/kumulatif" },
    { title: "SP3B", url: "/laporan/sp3b" },
    { title: "SP2B", url: "/laporan/sp2b" },
  ],
}

const perTahun: NavMenu = {
  id: "per-tahun",
  title: "Realisasi Belanja Puskesmas Per-tahun",
  url: "/realisasi/per-puskesmas",
}

const master: NavMenu = {
  id: "master",
  title: "Master Data",
  url: "#",
  children: [
    { title: "Kode Rekening", url: "/master/rekening" },
    { title: "Puskesmas & Kepala", url: "/master/puskesmas" },
    { title: "SILPA", url: "/master/silpa" },
    { title: "Pengguna", url: "/master/pengguna" },
  ],
}

export function menuUntuk(role: "ADMIN" | "OPERATOR"): NavMenu[] {
  return role === "ADMIN" ? [anggaran, realisasi, perTahun, master] : [anggaran, realisasi]
}

/** Judul halaman (dipakai header breadcrumb). */
export function judulHalaman(pathname: string): string {
  for (const m of [anggaran, realisasi, perTahun, master]) {
    if (m.url === pathname) return m.title
    const c = m.children?.find((x) => x.url === pathname)
    if (c) return c.title
  }
  if (pathname === "/akun") return "Akun Saya"
  return "Dashboard"
}

export function halamanAwal(role: "ADMIN" | "OPERATOR"): string {
  return role === "ADMIN" ? "/realisasi/per-puskesmas" : "/realisasi/dashboard"
}
