import * as XLSX from "xlsx"

/**
 * Export tabel ke .xlsx dengan format angka ribuan mulai kolom ke-3 (sama dengan exportToExcel lama).
 * Sel berpecahan memakai 2 desimal (#,##0.00); bilangan bulat tetap #,##0.
 */
export function exportExcel({
  headers,
  rows,
  lebar,
  namaFile,
  namaSheet,
}: {
  headers: string[]
  rows: (string | number)[][]
  lebar: number[]
  namaFile: string
  namaSheet: string
}) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws["!cols"] = lebar.map((wch) => ({ wch }))

  const range = XLSX.utils.decode_range(ws["!ref"]!)
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 2; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell) {
        cell.t = "n"
        cell.z = Number.isInteger(Math.round(Number(cell.v) * 100) / 100) ? "#,##0" : "#,##0.00"
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, namaSheet)
  XLSX.writeFile(wb, namaFile)
}
