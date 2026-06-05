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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Settings01Icon,
  Cancel01Icon,
  GripHorizontalIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import PLATFORMS from "@/lib/platforms"
import type { ChatPanel } from "@/lib/types"
import { loadPanels, savePanels, loadLayouts, saveLayouts } from "@/lib/storage"
import { applyPreset, type LayoutPreset } from "@/lib/layouts"
import AddChatDialog from "./add-chat-dialog"
import LayoutPicker from "./layout-picker"

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
      const available = window.innerHeight - 49
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

  const applyLayoutPreset = useCallback((preset: LayoutPreset) => {
    const fresh = applyPreset(preset, panels)
    setLayouts(fresh)
    saveLayouts(fresh as Record<string, unknown[]>)
  }, [panels])

  const panelCount = panels.length

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <span className="font-heading text-sm font-semibold">Hiroba</span>
        <Separator orientation="vertical" className="h-4!" />
        <span className="text-xs text-muted-foreground">
          {panelCount} panel{panelCount !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {panelCount > 0 && (
            <>
              <LayoutPicker onSelect={applyLayoutPreset} />
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={resetLayout} />}>
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent>Reset layout</TooltipContent>
              </Tooltip>
            </>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add Chat
          </Button>
        </div>
      </header>

      {panelCount > 0 ? (
        <div className="flex-1 overflow-auto">
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: DEFAULT_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={rowHeight}
            draggableHandle=".drag-handle"
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
            compactType={null}
            onLayoutChange={handleLayoutChange}
            margin={[4, 4]}
            containerPadding={[4, 4]}
          >
            {panels.map((panel) => {
              const pc = PLATFORMS[panel.platform]
              return (
                <div
                  key={panel.id}
                  className="flex flex-col rounded-2xl overflow-hidden border bg-card"
                >
                  <div className="drag-handle flex h-9 shrink-0 cursor-grab items-center gap-2 border-b bg-card px-2 active:cursor-grabbing select-none">
                    <span className="text-muted-foreground/40 shrink-0">
                      <HugeiconsIcon icon={GripHorizontalIcon} size={14} strokeWidth={1.5} />
                    </span>
                    <pc.icon className="size-3.5 shrink-0" />
                    <span className="truncate text-xs font-medium">{panel.label}</span>
                    <div className="ml-auto flex items-center">
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon-xs" onClick={() => setEditPanel(panel)} />}>
                          <HugeiconsIcon icon={Settings01Icon} size={12} strokeWidth={2} />
                        </TooltipTrigger>
                        <TooltipContent>Edit panel</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon-xs" onClick={() => removePanel(panel.id)} />}>
                          <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                        </TooltipTrigger>
                        <TooltipContent>Remove panel</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <iframe
                      src={pc.buildUrl(panel.channel)}
                      className="size-full"
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
            <p className="text-muted-foreground text-sm">No chat panels yet</p>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Add your first chat
            </Button>
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
