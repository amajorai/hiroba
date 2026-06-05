import type { LayoutItem, ResponsiveLayouts } from "react-grid-layout/legacy"
import type { ChatPanel } from "./types"

export type LayoutPreset = "columns" | "focus-left" | "focus-right" | "grid" | "rows"

export interface PresetConfig {
  id: LayoutPreset
  label: string
}

export const PRESETS: PresetConfig[] = [
  { id: "columns", label: "Columns" },
  { id: "focus-left", label: "Focus left" },
  { id: "focus-right", label: "Focus right" },
  { id: "grid", label: "Grid" },
  { id: "rows", label: "Rows" },
]

const H = 20
const COLS = 12

function wrap(items: LayoutItem[]): ResponsiveLayouts {
  return { lg: items, md: items, sm: items }
}

export function applyPreset(preset: LayoutPreset, panels: ChatPanel[]): ResponsiveLayouts {
  const n = panels.length
  if (n === 0) return {}
  const ids = panels.map((p) => p.id)

  switch (preset) {
    case "columns": {
      const w = Math.floor(COLS / n)
      return wrap(ids.map((id, i) => ({ i: id, x: i * w, y: 0, w, h: H, minW: 2, minH: 4 })))
    }

    case "focus-left": {
      if (n === 1) return applyPreset("columns", panels)
      const mainW = n === 2 ? 8 : 7
      const sideW = COLS - mainW
      const sideH = Math.floor(H / (n - 1))
      return wrap([
        { i: ids[0], x: 0, y: 0, w: mainW, h: H, minW: 2, minH: 4 },
        ...ids.slice(1).map((id, i) => ({
          i: id, x: mainW, y: i * sideH, w: sideW, h: sideH, minW: 2, minH: 4,
        })),
      ])
    }

    case "focus-right": {
      if (n === 1) return applyPreset("columns", panels)
      const mainW = n === 2 ? 8 : 7
      const sideW = COLS - mainW
      const sideH = Math.floor(H / (n - 1))
      return wrap([
        ...ids.slice(0, -1).map((id, i) => ({
          i: id, x: 0, y: i * sideH, w: sideW, h: sideH, minW: 2, minH: 4,
        })),
        { i: ids[n - 1], x: sideW, y: 0, w: mainW, h: H, minW: 2, minH: 4 },
      ])
    }

    case "grid": {
      const cols = 2
      const w = Math.floor(COLS / cols)
      const rows = Math.ceil(n / cols)
      const h = Math.max(Math.floor(H / rows), 4)
      return wrap(
        ids.map((id, i) => ({
          i: id,
          x: (i % cols) * w,
          y: Math.floor(i / cols) * h,
          w, h,
          minW: 2, minH: 4,
        }))
      )
    }

    case "rows": {
      const h = Math.max(Math.floor(H / n), 4)
      return wrap(ids.map((id, i) => ({ i: id, x: 0, y: i * h, w: COLS, h, minW: 2, minH: 4 })))
    }
  }
}
