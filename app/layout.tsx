import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SIKAP BLUD Puskesmas",
  description: "Sistem pengelolaan anggaran dan realisasi BLUD Puskesmas Kabupaten Bandung",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>{children}</body>
    </html>
  )
}
