"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import type { NavMenu } from "@/lib/nav"

interface AppShellProps {
  children: React.ReactNode
  menus: NavMenu[]
  user: { nama: string; email: string; role: "ADMIN" | "OPERATOR"; puskesmasNama: string | null }
}

export function AppShell({ children, menus, user }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const subjudul = user.role === "ADMIN" ? "Rekap seluruh puskesmas" : user.puskesmasNama ?? ""

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} menus={menus} role={user.role} subjudul={subjudul} />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
        <Header setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">{children}</main>
      </div>
    </div>
  )
}
