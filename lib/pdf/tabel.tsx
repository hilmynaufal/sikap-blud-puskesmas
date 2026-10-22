import { Font, Text, View, type Styles } from "@react-pdf/renderer"

// Dokumen resmi: jangan memenggal kata (mis. "Pendap-atan").
Font.registerHyphenationCallback((word) => [word])

type Style = Styles[string]

/** px CSS -> pt PDF */
export const px = (n: number) => n * 0.75

export type Sel = {
  cs?: number
  t?: string
  bold?: boolean
  align?: "left" | "center" | "right"
  /** "cb" = kotak penuh, "cbL"/"cbR" = kotak tanpa sisi kiri/kanan (seperti .cb-no-l / .cb-no-r) */
  kotak?: "cb" | "cbL" | "cbR"
  pl?: number
  pr?: number
  size?: number
  wrap?: boolean
  underline?: boolean
}

export type Baris = { h?: number; garisBawah?: boolean; garisAtas?: boolean; sel: Sel[] }

/**
 * Tabel ber-colgroup persentase seperti markup HTML generator lama.
 * Setiap sel mengambil `cs` kolom berurutan (colspan).
 */
export function Tabel({ kolom, baris, padding, fontSize }: { kolom: number[]; baris: Baris[]; padding: [number, number]; fontSize: number }) {
  return (
    <View>
      {baris.map((b, bi) => {
        let idx = 0
        return (
          <View
            key={bi}
            wrap={false}
            style={{
              flexDirection: "row",
              minHeight: b.h ? px(b.h) : undefined,
              borderBottomWidth: b.garisBawah ? 1 : 0,
              borderTopWidth: b.garisAtas ? 1 : 0,
              borderColor: "#000",
            }}
          >
            {b.sel.map((s, si) => {
              const cs = s.cs ?? 1
              const w = kolom.slice(idx, idx + cs).reduce((a, x) => a + x, 0)
              idx += cs
              const kotak: Style = s.kotak
                ? {
                    borderTopWidth: 0.5,
                    borderBottomWidth: 0.5,
                    borderLeftWidth: s.kotak === "cbL" ? 0 : 0.5,
                    borderRightWidth: s.kotak === "cbR" ? 0 : 0.5,
                    borderColor: "#000",
                  }
                : {}
              return (
                <View
                  key={si}
                  style={{
                    width: `${w}%`,
                    justifyContent: "center",
                    paddingVertical: padding[0],
                    paddingLeft: s.pl ?? padding[1],
                    paddingRight: s.pr ?? padding[1],
                    ...kotak,
                  }}
                >
                  {s.t ? (
                    <Text
                      style={{
                        fontSize: s.size ?? fontSize,
                        fontFamily: s.bold ? "Helvetica-Bold" : "Helvetica",
                        textAlign: s.align ?? "left",
                        textDecoration: s.underline ? "underline" : "none",
                      }}
                      wrap={s.wrap ?? false}
                    >
                      {s.t}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}
