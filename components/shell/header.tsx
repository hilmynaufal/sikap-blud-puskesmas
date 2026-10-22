"use client"

import React, { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { User, Menu, KeyRound, LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"
import { judulHalaman } from "@/lib/nav"

interface HeaderProps {
  setIsSidebarOpen: (val: boolean) => void
  isSidebarOpen: boolean
  user: { nama: string; email: string }
}

export const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen, isSidebarOpen, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const pageTitle = judulHalaman(pathname)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900 cursor-pointer transition-colors font-semibold">
            App
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 p-1 pl-2 pr-3 rounded-full transition-all ${
              isDropdownOpen ? "bg-slate-100" : "hover:bg-slate-100"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white overflow-hidden">
              {user.nama ? user.nama.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <span className="text-sm font-medium hidden lg:inline select-none text-slate-700">{user.nama}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-sm font-semibold text-slate-900">{user.nama}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <div className="px-1">
                <Link
                  href="/akun"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-left group"
                >
                  <KeyRound size={16} className="text-slate-400 group-hover:text-slate-900" />
                  <span>Ganti Password</span>
                </Link>
              </div>

              <div className="h-px bg-slate-100 my-1 mx-1"></div>

              <div className="px-1">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-left group"
                  >
                    <LogOut size={16} className="text-rose-400 group-hover:text-rose-600" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
