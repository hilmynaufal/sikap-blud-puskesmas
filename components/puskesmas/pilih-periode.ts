"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Filter halaman disimpan di query string; server merender ulang data.
 * `pending` dipakai untuk overlay "Sinkronisasi..." seperti di layout lama.
 */
export function useFilterQuery() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const set = (ubah: Record<string, string | number | null>) => {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(ubah)) {
      if (v === null || v === "") sp.delete(k)
      else sp.set(k, String(v))
    }
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
  }

  const refresh = () => startTransition(() => router.refresh())

  return { set, refresh, pending }
}
