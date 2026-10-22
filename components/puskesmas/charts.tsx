"use client"

import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend)
ChartJS.defaults.font.family = "Inter, sans-serif"

/** Bar horizontal "Top 5" seperti di dashboard lama. */
export function BarHorizontal({
  labels,
  data,
  label,
  warna,
  radius = 6,
  legend = false,
  tampilSumbuX = false,
  fontKecil = false,
}: {
  labels: string[]
  data: number[]
  label: string
  warna: string
  radius?: number
  legend?: boolean
  tampilSumbuX?: boolean
  fontKecil?: boolean
}) {
  return (
    <Bar
      data={{ labels, datasets: [{ label, data, backgroundColor: warna, borderRadius: radius }] }}
      options={{
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legend
            ? { display: true, position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } }
            : { display: false },
        },
        scales: {
          x: tampilSumbuX ? { ticks: { font: { size: 10 } } } : { display: false },
          y: { grid: { display: false }, ...(fontKecil ? { ticks: { font: { size: 10 } } } : {}) },
        },
      }}
    />
  )
}

const WARNA_DONAT = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#2DD4BF"]

export function Donat({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <Doughnut
      data={{ labels, datasets: [{ data, backgroundColor: WARNA_DONAT, borderWidth: 2 }] }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } },
      }}
    />
  )
}

export function potong(teks: string, n: number, elipsis = true) {
  return teks.substring(0, n) + (elipsis && teks.length > n ? "..." : "")
}
