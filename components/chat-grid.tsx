"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Responsive,
  WidthProvider,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
} from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import PLATFORMS from "@/lib/platforms"
import type { ChatPanel } from "@/lib/types"
import { loadPanels, savePanels, loadLayouts, saveLayouts } from "@/lib/storage"
import AddChatDialog from "./add-chat-dialog"

const ResponsiveGridLayout = WidthProvider(Responsive)

const DEFAULT_COLS = 12
const DEFAULT_H = 20

const DEFAULT_PANELS: ChatPanel[] = [
  { id: "yt-default", platform: "youtube", channel: "QsaTT5HcAyY", label: "YouTube" },
  { id: "tw-default", platform: "twitch", channel: "jiaweihq", label: "Twitch" },
  { id: "kick-default", platform: "kick", channel: "jiaweing", label: "Kick" },
]

function makeItem(id: string, x: number, y: number, w: number, h: number): LayoutItem {
  return { i: id, x, y, w, h, minW: 2, minH: 4 }
}

function createDefaultLayouts(panels: ChatPanel[]): ResponsiveLayouts {
  const colW = panels.length > 0 ? Math.floor(DEFAULT_COLS / panels.length) : DEFAULT_COLS
  const items = panels.map((p, i) => makeItem(p.id, (i * colW) % DEFAULT_COLS, 0, colW, DEFAULT_H))
  return { lg: items, md: items, sm: items }
}

function PlusIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ChatGrid() {
  const [panels, setPanels] = useState<ChatPanel[]>([])
  const [layouts, setLayouts] = useState<ResponsiveLayouts>({})
  const [rowHeight, setRowHeight] = useState(50)
  const [addOpen, setAddOpen] = useState(false)
  const [editPanel, setEditPanel] = useState<ChatPanel | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const savedPanels = loadPanels()
    const savedLayouts = loadLayouts()
    const initialPanels = savedPanels ?? DEFAULT_PANELS
    const initialLayouts = (savedLayouts as ResponsiveLayouts | null) ?? createDefaultLayouts(initialPanels)
    setPanels(initialPanels)
    setLayouts(initialLayouts)
  }, [])

  useEffect(() => {
    const calc = () => {
      const available = window.innerHeight - 48
      const marginTotal = 4 * (DEFAULT_H - 1)
      setRowHeight(Math.max(Math.floor((available - 8 - marginTotal) / DEFAULT_H), 18))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  const handleLayoutChange = useCallback((_current: Layout, allLayouts: ResponsiveLayouts) => {
    setLayouts(allLayouts)
    saveLayouts(allLayouts as Record<string, unknown[]>)
  }, [])

  const addPanel = useCallback(
    (panel: ChatPanel) => {
      const newPanels = [...panels, panel]
      const lgItems = (layouts.lg ?? []) as LayoutItem[]
      const maxY = lgItems.length > 0 ? Math.max(...lgItems.map((l) => l.y + l.h)) : 0
      const newItem = makeItem(panel.id, 0, maxY, 4, DEFAULT_H)
      const newLayouts: ResponsiveLayouts = {
        lg: [...lgItems, newItem],
        md: [...((layouts.md ?? []) as LayoutItem[]), newItem],
        sm: [...((layouts.sm ?? []) as LayoutItem[]), newItem],
      }
      setPanels(newPanels)
      setLayouts(newLayouts)
      savePanels(newPanels)
      saveLayouts(newLayouts as Record<string, unknown[]>)
    },
    [panels, layouts]
  )

  const removePanel = useCallback(
    (id: string) => {
      const newPanels = panels.filter((p) => p.id !== id)
      const newLayouts: ResponsiveLayouts = {
        lg: ((layouts.lg ?? []) as LayoutItem[]).filter((l) => l.i !== id),
        md: ((layouts.md ?? []) as LayoutItem[]).filter((l) => l.i !== id),
        sm: ((layouts.sm ?? []) as LayoutItem[]).filter((l) => l.i !== id),
      }
      setPanels(newPanels)
      setLayouts(newLayouts)
      savePanels(newPanels)
      saveLayouts(newLayouts as Record<string, unknown[]>)
    },
    [panels, layouts]
  )

  const updatePanel = useCallback(
    (updated: ChatPanel) => {
      const newPanels = panels.map((p) => (p.id === updated.id ? updated : p))
      setPanels(newPanels)
      savePanels(newPanels)
    },
    [panels]
  )

  const resetLayout = useCallback(() => {
    const fresh = createDefaultLayouts(panels)
    setLayouts(fresh)
    saveLayouts(fresh as Record<string, unknown[]>)
  }, [panels])

  const panelCount = panels.length

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      <div className="flex h-12 items-center justify-between px-4 border-b border-zinc-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-100 tracking-tight">MultiChat</span>
          {panelCount > 0 && (
            <span className="text-xs text-zinc-500">
              {panelCount} panel{panelCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {panelCount > 0 && (
            <button
              onClick={resetLayout}
              title="Reset layout"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <ResetIcon />
              Reset
            </button>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-md transition-colors border border-zinc-700"
          >
            <PlusIcon />
            Add Chat
          </button>
        </div>
      </div>

      {panelCount > 0 ? (
        <div className="flex-1 overflow-auto">
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: DEFAULT_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={rowHeight}
            draggableHandle=".drag-handle"
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
            onLayoutChange={handleLayoutChange}
            margin={[4, 4]}
            containerPadding={[4, 4]}
          >
            {panels.map((panel) => {
              const pc = PLATFORMS[panel.platform]
              return (
                <div
                  key={panel.id}
                  className="flex flex-col rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900"
                >
                  <div className="drag-handle flex h-8 items-center justify-between px-2 bg-zinc-800/80 cursor-grab active:cursor-grabbing select-none shrink-0 border-b border-zinc-700/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-zinc-500 shrink-0">
                        <GripIcon />
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pc.color }}
                      />
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {panel.label}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0 hidden sm:inline">
                        {pc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditPanel(panel)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                        title="Edit panel"
                      >
                        <GearIcon />
                      </button>
                      <button
                        onClick={() => removePanel(panel.id)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Remove panel"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <iframe
                      src={pc.buildUrl(panel.channel)}
                      className="w-full h-full"
                      style={{ border: "none" }}
                      allow="autoplay; clipboard-write"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      title={`${panel.label} chat`}
                    />
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-zinc-500 text-4xl select-none">💬</div>
            <p className="text-zinc-400 text-sm">No chat panels yet</p>
            <button
              onClick={() => setAddOpen(true)}
              className="text-xs text-zinc-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Add your first chat
            </button>
          </div>
        </div>
      )}

      <AddChatDialog
        open={addOpen || editPanel !== null}
        onClose={() => {
          setAddOpen(false)
          setEditPanel(null)
        }}
        onAdd={addPanel}
        onUpdate={updatePanel}
        editPanel={editPanel}
      />
    </div>
  )
}
