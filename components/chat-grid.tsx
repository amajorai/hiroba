"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Responsive,
  WidthProvider,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
  type ResizeHandleAxis,
} from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Settings01Icon,
  Cancel01Icon,
  GripHorizontalIcon,
  Refresh01Icon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import PLATFORMS from "@/lib/platforms"
import type { ChatPanel } from "@/lib/types"
import {
  loadPanels,
  savePanels,
  loadLayouts,
  saveLayouts,
  loadUserPresets,
  saveUserPresets,
  type UserPreset,
} from "@/lib/storage"
import { applyPreset, type LayoutPreset } from "@/lib/layouts"
import AddChatDialog from "./add-chat-dialog"
import LayoutPicker from "./layout-picker"

const ResponsiveGridLayout = WidthProvider(Responsive)

const COLS = 12
const ROWS = 20

function makeItem(id: string, x: number, y: number, w: number, h: number): LayoutItem {
  return { i: id, x, y, w, h, minW: 2, minH: 4 }
}

// Equal-column layout — always fills full viewport, no overflow
function equalLayout(panels: ChatPanel[]): ResponsiveLayouts {
  const n = panels.length
  if (n === 0) return {}
  const w = Math.floor(COLS / n)
  const items = panels.map((p, i) => makeItem(p.id, i * w, 0, w, ROWS))
  return { lg: items, md: items, sm: items }
}

const DEFAULT_PANELS: ChatPanel[] = [
  { id: "yt-default", platform: "youtube", channel: "QsaTT5HcAyY", label: "YouTube" },
  { id: "tw-default", platform: "twitch", channel: "jiaweihq", label: "Twitch" },
  { id: "kick-default", platform: "kick", channel: "jiaweing", label: "Kick" },
]

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
  const swapping = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const savedPanels = loadPanels()
    const savedLayouts = loadLayouts()
    const initialPanels = savedPanels ?? DEFAULT_PANELS
    const initialLayouts =
      (savedLayouts as ResponsiveLayouts | null) ?? equalLayout(initialPanels)
    setPanels(initialPanels)
    setLayouts(initialLayouts)
    setUserPresets(loadUserPresets())
  }, [])

  useEffect(() => {
    const calc = () => {
      // rowHeight × ROWS = viewport height (minus margin/padding)
      const marginTotal = 4 * (ROWS - 1) + 8
      setRowHeight(Math.max(Math.floor((window.innerHeight - marginTotal) / ROWS), 16))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  const saveLayout = useCallback((next: ResponsiveLayouts) => {
    setLayouts(next)
    saveLayouts(next as Record<string, unknown[]>)
  }, [])

  const handleLayoutChange = useCallback(
    (_current: Layout, allLayouts: ResponsiveLayouts) => {
      if (swapping.current) return
      saveLayout(allLayouts)
    },
    [saveLayout]
  )

  // Drag swap logic — detect panel under cursor center and swap on drop
  const handleDragStart = useCallback(
    (_layout: Layout, _old: LayoutItem | null, item: LayoutItem | null) => {
      setDraggingId(item?.i ?? null)
    },
    []
  )

  const findSwapTarget = useCallback(
    (layout: Layout, dragged: LayoutItem): LayoutItem | null => {
      const cx = dragged.x + dragged.w / 2
      const cy = dragged.y + dragged.h / 2
      return (
        (layout as LayoutItem[]).find(
          (l) =>
            l.i !== dragged.i &&
            cx >= l.x &&
            cx < l.x + l.w &&
            cy >= l.y &&
            cy < l.y + l.h
        ) ?? null
      )
    },
    []
  )

  const handleDrag = useCallback(
    (_layout: Layout, _old: LayoutItem | null, item: LayoutItem | null) => {
      if (!item) { setSwapTargetId(null); return }
      // Use the current layouts state (not the mid-drag layout arg which can be stale)
      setLayouts((prev) => {
        const lg = (prev.lg ?? []) as LayoutItem[]
        const dragged = lg.find((l) => l.i === item.i)
        if (!dragged) { setSwapTargetId(null); return prev }
        const target = findSwapTarget(lg, { ...dragged, x: item.x, y: item.y })
        setSwapTargetId(target?.i ?? null)
        return prev
      })
    },
    [findSwapTarget]
  )

  const handleDragStop = useCallback(
    (layout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null) => {
      setDraggingId(null)
      setSwapTargetId(null)
      if (!oldItem || !newItem) return

      const dragged = (layout as LayoutItem[]).find((l) => l.i === newItem.i)
      if (!dragged) return
      const target = findSwapTarget(layout, dragged)
      if (!target) return

      const swapped = (layout as LayoutItem[]).map((item) => {
        if (item.i === dragged.i)
          return { ...item, x: target.x, y: target.y, w: target.w, h: target.h }
        if (item.i === target.i)
          return { ...item, x: oldItem.x, y: oldItem.y, w: oldItem.w, h: oldItem.h }
        return item
      })
      const next: ResponsiveLayouts = { lg: swapped, md: swapped, sm: swapped }
      swapping.current = true
      saveLayout(next)
      requestAnimationFrame(() => { swapping.current = false })
    },
    [findSwapTarget, saveLayout]
  )

  const addPanel = useCallback(
    (panel: ChatPanel) => {
      const newPanels = [...panels, panel]
      // Always redistribute to equal columns so new panel fits in viewport
      const newLayouts = equalLayout(newPanels)
      setPanels(newPanels)
      saveLayout(newLayouts)
      savePanels(newPanels)
    },
    [panels, saveLayout]
  )

  const removePanel = useCallback(
    (id: string) => {
      const newPanels = panels.filter((p) => p.id !== id)
      const newLayouts = equalLayout(newPanels)
      setPanels(newPanels)
      saveLayout(newLayouts)
      savePanels(newPanels)
    },
    [panels, saveLayout]
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
    saveLayout(equalLayout(panels))
  }, [panels, saveLayout])

  const applyLayoutPreset = useCallback(
    (preset: LayoutPreset) => {
      saveLayout(applyPreset(preset, panels))
    },
    [panels, saveLayout]
  )

  const saveUserPreset = useCallback(
    (name: string) => {
      const preset: UserPreset = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        layouts,
      }
      const next = [...userPresets, preset]
      setUserPresets(next)
      saveUserPresets(next)
    },
    [layouts, userPresets]
  )

  const deleteUserPreset = useCallback(
    (id: string) => {
      const next = userPresets.filter((p) => p.id !== id)
      setUserPresets(next)
      saveUserPresets(next)
    },
    [userPresets]
  )

  const applyUserPreset = useCallback(
    (preset: UserPreset) => {
      saveLayout(preset.layouts)
    },
    [saveLayout]
  )

  const panelCount = panels.length

  // 3-dot corner handles, plain div for edge handles
  function renderResizeHandle(axis: ResizeHandleAxis, ref: React.Ref<HTMLElement>) {
    const corners: Partial<Record<ResizeHandleAxis, number>> = { se: 0, sw: 90, nw: 180, ne: 270 }
    const rotation = corners[axis]
    if (rotation === undefined) {
      // Edge handle — no visual content, CSS handles the pill indicator
      return <div ref={ref as React.Ref<HTMLDivElement>} className={`react-resizable-handle react-resizable-handle-${axis}`} />
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={`react-resizable-handle react-resizable-handle-${axis} flex items-center justify-center`}
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10"
          style={{ transform: `rotate(${rotation}deg)` }}
          className="fill-foreground/25 transition-colors"
        >
          {/* 3 dots in SE-corner L-shape */}
          <circle cx="7.5" cy="7.5" r="1.5" />
          <circle cx="3.5" cy="7.5" r="1.5" />
          <circle cx="7.5" cy="3.5" r="1.5" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {panelCount > 0 ? (
        <div className="h-full overflow-hidden">
          <ResponsiveGridLayout
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
            maxRows={ROWS}
            rowHeight={rowHeight}
            draggableHandle=".drag-handle"
            resizeHandles={["se", "sw", "ne", "nw", "e", "w", "n", "s"]}
            resizeHandle={renderResizeHandle}
            compactType={null}
            allowOverlap={true}
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
                    "flex flex-col rounded-2xl overflow-hidden border bg-card transition-all duration-100",
                    swapTargetId === panel.id &&
                      "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[0.99]",
                    draggingId === panel.id && "opacity-50"
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
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditPanel(panel)}
                            />
                          }
                        >
                          <HugeiconsIcon icon={Settings01Icon} size={12} strokeWidth={2} />
                        </TooltipTrigger>
                        <TooltipContent>Edit panel</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removePanel(panel.id)}
                            />
                          }
                        >
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
        /* Empty state — no toolbar, just the placeholder */
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="rounded-2xl bg-muted p-5 text-muted-foreground">
            <HugeiconsIcon icon={BubbleChatIcon} size={36} strokeWidth={1.5} />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">No chat panels</p>
            <p className="text-xs text-muted-foreground">
              Add a streaming platform to get started
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add your first chat
          </Button>
        </div>
      )}

      {/* Floating toolbar — only when panels exist, appears on hover near bottom */}
      {panelCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex h-24 items-end justify-center pb-5 group/dock">
          {/* Invisible hover-capture zone */}
          <div className="pointer-events-auto absolute inset-0" />
          {/* Toolbar pill */}
          <div className="pointer-events-auto relative flex items-center gap-1 rounded-2xl border bg-popover/90 px-2 py-1.5 shadow-xl ring-1 ring-foreground/5 backdrop-blur-md dark:ring-foreground/10 opacity-0 translate-y-3 transition-all duration-150 ease-out group-hover/dock:opacity-100 group-hover/dock:translate-y-0">
            <LayoutPicker
              currentLayouts={layouts}
              savedPresets={userPresets}
              onSelect={applyLayoutPreset}
              onApplySaved={applyUserPreset}
              onSave={saveUserPreset}
              onDelete={deleteUserPreset}
            />
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" onClick={resetLayout} />}
              >
                <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent side="top">Reset layout</TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Add Chat
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
