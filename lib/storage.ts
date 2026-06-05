import type { ChatPanel } from "./types"

const PANELS_KEY = "multichat-panels"
const LAYOUTS_KEY = "multichat-layouts"

export function savePanels(panels: ChatPanel[]) {
  localStorage.setItem(PANELS_KEY, JSON.stringify(panels))
}

export function loadPanels(): ChatPanel[] | null {
  const data = localStorage.getItem(PANELS_KEY)
  if (!data) return null
  try {
    return JSON.parse(data) as ChatPanel[]
  } catch {
    return null
  }
}

export function saveLayouts(layouts: Record<string, unknown[]>) {
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts))
}

export function loadLayouts(): Record<string, unknown[]> | null {
  const data = localStorage.getItem(LAYOUTS_KEY)
  if (!data) return null
  try {
    return JSON.parse(data) as Record<string, unknown[]>
  } catch {
    return null
  }
}
