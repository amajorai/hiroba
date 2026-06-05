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
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import PLATFORMS from "@/lib/platforms"
import type { ChatPanel } from "@/lib/types"
import { loadPanels, savePanels, loadLayouts, saveLayouts, loadUserPresets, saveUserPresets, type UserPreset } from "@/lib/storage"
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
  const [userPresets, setUserPresets] = useState<UserPreset[]>([])
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
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
    setUserPresets(loadUserPresets())
  }, [])

  useEffect(() => {
    const calc = () => {
      const available = window.innerHeight
      const marginTotal = 4 * (DEFAULT_H - 1)
      setRowHeight(Math.max(Math.floor((available - 8 - marginTotal) / DEFAULT_H), 18))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  const swapping = useRef(false)

  const handleLayoutChange = useCallback((_current: Layout, allLayouts: ResponsiveLayouts) => {
    if (swapping.current) return
    setLayouts(allLayouts)
    saveLayouts(allLayouts as Record<string, unknown[]>)
  }, [])

  const handleDragStart = useCallback((_layout: Layout, _old: LayoutItem | null, item: LayoutItem | null) => {
    setDraggingId(item?.i ?? null)
  }, [])

  const handleDrag = useCallback((layout: Layout, _old: LayoutItem | null, item: LayoutItem | null) => {
    if (!item) return
    const dragged = (layout as LayoutItem[]).find(l => l.i === item.i)
    if (!dragged) return
    let target: LayoutItem | null = null
    let best = 0
    for (const l of layout as LayoutItem[]) {
      if (l.i === dragged.i) continue
      const xO = Math.max(0, Math.min(dragged.x + dragged.w, l.x + l.w) - Math.max(dragged.x, l.x))
      const yO = Math.max(0, Math.min(dragged.y + dragged.h, l.y + l.h) - Math.max(dragged.y, l.y))
      const a = xO * yO
      if (a > best) { best = a; target = l }
    }
    const minArea = target ? Math.min(dragged.w * dragged.h, target.w * target.h) : 0
    setSwapTargetId(target && best >= minArea * 0.3 ? target.i : null)
  }, [])

  const handleDragStop = useCallback((
    layout: Layout,
    oldItem: LayoutItem | null,
    newItem: LayoutItem | null,
  ) => {
    if (!oldItem || !newItem) return
    const dragged = (layout as LayoutItem[]).find(l => l.i === newItem.i)
    if (!dragged) return

    // Find the item most overlapped by the dragged panel
    let target: LayoutItem | null = null
    let bestOverlap = 0
    for (const item of layout as LayoutItem[]) {
      if (item.i === dragged.i) continue
      const xOver = Math.max(0, Math.min(dragged.x + dragged.w, item.x + item.w) - Math.max(dragged.x, item.x))
      const yOver = Math.max(0, Math.min(dragged.y + dragged.h, item.y + item.h) - Math.max(dragged.y, item.y))
      const area = xOver * yOver
      if (area > bestOverlap) { bestOverlap = area; target = item }
    }

    if (!target) return
    const minArea = Math.min(dragged.w * dragged.h, target.w * target.h)
    if (bestOverlap < minArea * 0.3) return // less than 30% overlap — don't swap

    // Swap: dragged takes target's slot, target takes dragged's original slot
    const swapped = (layout as LayoutItem[]).map(item => {
      if (item.i === dragged.i) return { ...item, x: target!.x, y: target!.y, w: target!.w, h: target!.h }
      if (item.i === target!.i) return { ...item, x: oldItem.x, y: oldItem.y, w: oldItem.w, h: oldItem.h }
      return item
    })
    const next: ResponsiveLayouts = { lg: swapped, md: swapped, sm: swapped }
    swapping.current = true
    setLayouts(next)
    saveLayouts(next as Record<string, unknown[]>)
    setTimeout(() => { swapping.current = false }, 50)
    setDraggingId(null)
    setSwapTargetId(null)
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

  const saveUserPreset = useCallback((name: string) => {
    const preset: UserPreset = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      layouts,
    }
    const next = [...userPresets, preset]
    setUserPresets(next)
    saveUserPresets(next)
  }, [layouts, userPresets])

  const deleteUserPreset = useCallback((id: string) => {
    const next = userPresets.filter((p) => p.id !== id)
    setUserPresets(next)
    saveUserPresets(next)
  }, [userPresets])

  const applyUserPreset = useCallback((preset: UserPreset) => {
    setLayouts(preset.layouts)
    saveLayouts(preset.layouts as Record<string, unknown[]>)
  }, [])

  const panelCount = panels.length

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {panelCount > 0 ? (
        <div className="h-full overflow-auto">
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: DEFAULT_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={rowHeight}
            draggableHandle=".drag-handle"
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
            compactType={null}
            onLayoutChange={handleLayoutChange}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragStop={handleDragStop}
            margin={[4, 4]}
            containerPadding={[4, 4]}
          >
            {panels.map((panel) => {
              const pc = PLATFORMS[panel.platform]
              return (
                <div
                  key={panel.id}
                  className={cn(
                    "flex flex-col rounded-2xl overflow-hidden border bg-card transition-shadow",
                    swapTargetId === panel.id && "ring-2 ring-primary shadow-lg shadow-primary/20",
                    draggingId === panel.id && "opacity-60",
                  )}
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
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">No chat panels yet</p>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Add your first chat
            </Button>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border bg-popover/90 px-2 py-1.5 shadow-xl ring-1 ring-foreground/5 backdrop-blur-md dark:ring-foreground/10">
          {panelCount > 0 && (
            <>
              <LayoutPicker
                currentLayouts={layouts}
                savedPresets={userPresets}
                onSelect={applyLayoutPreset}
                onApplySaved={applyUserPreset}
                onSave={saveUserPreset}
                onDelete={deleteUserPreset}
              />
              <Separator orientation="vertical" className="h-4 mx-0.5" />
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={resetLayout} />}>
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent side="top">Reset layout</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-4 mx-0.5" />
            </>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add Chat
          </Button>
        </div>
      </div>

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
