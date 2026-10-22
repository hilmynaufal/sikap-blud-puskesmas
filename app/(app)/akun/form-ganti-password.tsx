"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gantiPassword, type Hasil } from "@/lib/actions/master"

export function FormGantiPassword() {
  const [f, setF] = useState({ lama: "", baru: "", ulang: "" })
  const [hasil, setHasil] = useState<Hasil | null>(null)
  const [proses, setProses] = useState(false)

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault()
    setProses(true)
    const r = await gantiPassword(f)
    setProses(false)
    setHasil(r)
    if (r.ok) setF({ lama: "", baru: "", ulang: "" })
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
        <CardDescription>Password yang dimigrasikan dari aplikasi lama sebaiknya segera diganti.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={kirim} className="space-y-4">
          {(
            [
              ["lama", "Password Lama", "current-password"],
              ["baru", "Password Baru (min. 8 karakter)", "new-password"],
              ["ulang", "Ulangi Password Baru", "new-password"],
            ] as const
          ).map(([k, label, ac]) => (
            <div key={k} className="space-y-2">
              <Label htmlFor={k}>{label}</Label>
              <Input id={k} type="password" autoComplete={ac} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required />
            </div>
          ))}
          {hasil && (
            <Alert variant={hasil.ok ? "default" : "destructive"}>
              <AlertDescription>{hasil.ok ? hasil.pesan : hasil.pesan}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={proses}>
            {proses ? "Memproses..." : "Simpan Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
