"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, LogOut, Layout, Activity, LayoutDashboard } from "lucide-react"
import { logout } from "@/app/login/actions"
import type { NavMenu } from "@/lib/nav"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  menus: NavMenu[]
  role: "ADMIN" | "OPERATOR"
  subjudul: string
}

function MenuIcon({ iconPath }: { iconPath?: string }) {
  if (!iconPath) return <Layout className="h-4 w-4" />
  return (
    <div className="relative h-4 w-4" style={{ width: 16, height: 16 }}>
      <Image src={iconPath} alt="Menu icon" fill className="object-contain" sizes="16px" />
    </div>
  )
}

interface NavItemProps {
  icon?: React.ReactNode
  iconPath?: string
  label: string
  url: string
  isActive?: boolean
  collapsed: boolean
  childrenItems?: { title: string; url: string }[]
}

const NavItem: React.FC<NavItemProps> = ({ icon, iconPath, label, url, isActive, collapsed, childrenItems }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = !!childrenItems && childrenItems.length > 0

  // Auto-expand if a child is active
  const pathname = usePathname()
  useEffect(() => {
    if (hasChildren && childrenItems!.some((child) => pathname === child.url)) {
      setIsExpanded(true)
    }
  }, [pathname, hasChildren, childrenItems])

  const toggleExpand = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  const Content = (
    <div
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
        isActive && !hasChildren
          ? "bg-slate-50 text-slate-900 font-semibold shadow-sm"
          : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className={`${isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"}`}>
          {icon ? icon : <MenuIcon iconPath={iconPath} />}
        </span>
        {!collapsed && <span className="text-[13px] truncate font-semibold">{label}</span>}
      </div>

      {!collapsed && hasChildren && (
        <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
      )}

      {!collapsed && !hasChildren && (
        <ChevronRight
          size={14}
          className={`transition-transform duration-200 ${
            isActive
              ? "translate-x-0 opacity-100"
              : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
          }`}
        />
      )}

      {collapsed && (
        <div className="absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
          {label}
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full">
      {hasChildren ? (
        <button onClick={toggleExpand} className="w-full text-left">
          {Content}
        </button>
      ) : (
        <Link href={url} className="w-full block">
          {Content}
        </Link>
      )}

      {/* Submenus */}
      {!collapsed && hasChildren && isExpanded && (
        <div className="pl-9 pr-2 space-y-1 mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
          {childrenItems!.map((child) => {
            const isChildActive = pathname === child.url
            return (
              <Link
                key={child.url}
                href={child.url}
                className={`block text-[12px] py-1.5 px-2 rounded-lg transition-colors ${
                  isChildActive
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold">{child.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, menus, role, subjudul }) => {
  const pathname = usePathname()
  // Warna & ikon diambil dari zone lama: "puskesmas" dan "admin_puskesmas".
  const brandColor = role === "ADMIN" ? "#3b82f6" : "#009966"
  const brandName = role === "ADMIN" ? "Admin Puskesmas" : "Puskesmas"
  const BrandIcon = role === "ADMIN" ? LayoutDashboard : Activity

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
        isOpen ? "w-64" : "w-20"
      } hidden md:flex z-30`}
    >
      {/* Brand */}
      <div className="p-4 shrink-0 relative">
        <div className="w-full flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-white">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: brandColor }}
          >
            <BrandIcon size={18} />
          </div>
          {isOpen && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{brandName}</p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{subjudul}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mb-2">
        <div className="h-px bg-slate-100 w-full"></div>
      </div>

      {isOpen && (
        <div className="px-6 py-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Platform</span>
        </div>
      )}

      {/* Menus */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {menus.map((menu) => (
          <NavItem
            key={menu.id}
            iconPath={menu.iconPath}
            label={menu.title}
            url={menu.url}
            isActive={pathname === menu.url}
            collapsed={!isOpen}
            childrenItems={menu.children}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-1 shrink-0 bg-white">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-slate-400 group-hover:text-slate-900">
                <LogOut size={20} />
              </span>
              {isOpen && <span className="text-[13px] truncate font-semibold">Logout</span>}
            </div>
            {!isOpen && (
              <div className="absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                Logout
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1.5 text-slate-400 hover:text-slate-900 shadow-md z-40 transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  )
}
