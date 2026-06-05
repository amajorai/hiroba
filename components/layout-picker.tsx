"use client"

import { useState } from "react"
import type { ResponsiveLayouts, LayoutItem } from "react-grid-layout/legacy"
import { DashboardSquare02Icon, FloppyDiskIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PRESETS, type LayoutPreset } from "@/lib/layouts"
import type { UserPreset } from "@/lib/storage"
import { cn } from "@/lib/utils"

// --- Built-in preset thumbnails ---

const BUILT_IN_THUMBNAILS: Record<LayoutPreset, React.ReactNode> = {
  columns: (
    <svg viewBox="0 0 44 30" className="size-full">
      <rect x="1" y="1" width="13" height="28" rx="2" />
      <rect x="16" y="1" width="12" height="28" rx="2" />
      <rect x="30" y="1" width="13" height="28" rx="2" />
    </svg>
  ),
  "focus-left": (
    <svg viewBox="0 0 44 30" className="size-full">
      <rect x="1" y="1" width="25" height="28" rx="2" />
      <rect x="28" y="1" width="15" height="13" rx="2" />
      <rect x="28" y="16" width="15" height="13" rx="2" />
    </svg>
  ),
  "focus-right": (
    <svg viewBox="0 0 44 30" className="size-full">
      <rect x="1" y="1" width="15" height="13" rx="2" />
      <rect x="1" y="16" width="15" height="13" rx="2" />
      <rect x="18" y="1" width="25" height="28" rx="2" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 44 30" className="size-full">
      <rect x="1" y="1" width="20" height="13" rx="2" />
      <rect x="23" y="1" width="20" height="13" rx="2" />
      <rect x="1" y="16" width="20" height="13" rx="2" />
      <rect x="23" y="16" width="20" height="13" rx="2" />
    </svg>
  ),
  rows: (
    <svg viewBox="0 0 44 30" className="size-full">
      <rect x="1" y="1" width="42" height="8" rx="2" />
      <rect x="1" y="11" width="42" height="8" rx="2" />
      <rect x="1" y="21" width="42" height="8" rx="2" />
    </svg>
  ),
}

// Generate a live thumbnail from actual layout positions
function LayoutThumbnail({ layouts }: { layouts: ResponsiveLayouts }) {
  const items = (layouts.lg ?? []) as LayoutItem[]
  if (items.length === 0) return <svg viewBox="0 0 44 30" className="size-full" />

  const COLS = 12
  const VW = 42
  const VH = 28
  const maxRow = Math.max(...items.map((i) => i.y + i.h))
  const scaleX = VW / COLS
  const scaleY = VH / Math.max(maxRow, 1)

  return (
    <svg viewBox="0 0 44 30" className="size-full">
      {items.map((item) => (
        <rect
          key={item.i}
          x={1 + item.x * scaleX}
          y={1 + item.y * scaleY}
          width={Math.max(item.w * scaleX - 1, 1)}
          height={Math.max(item.h * scaleY - 1, 1)}
          rx="2"
        />
      ))}
    </svg>
  )
}

interface Props {
  currentLayouts: ResponsiveLayouts
  savedPresets: UserPreset[]
  onSelect: (preset: LayoutPreset) => void
  onApplySaved: (preset: UserPreset) => void
  onSave: (name: string) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

export default function LayoutPicker({
  currentLayouts,
  savedPresets,
  onSelect,
  onApplySaved,
  onSave,
  onDelete,
  disabled,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName("")
    setSaving(false)
  }

  return (
    <Popover onOpenChange={(open) => { if (!open) { setSaving(false); setName("") } }}>
      <PopoverTrigger render={<Button variant="ghost" size="sm" disabled={disabled} />}>
        <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2} />
        Layout
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="end" side="top" sideOffset={8}>
        {/* Built-in presets */}
        <p className="mb-2 text-xs font-medium text-muted-foreground">Built-in</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted p-2 transition-all hover:border-foreground/30 hover:bg-accent"
            >
              <span className="h-7 w-full fill-foreground/50 transition-colors group-hover:fill-foreground/80">
                {BUILT_IN_THUMBNAILS[preset.id]}
              </span>
              <span className="text-[10px] leading-none text-muted-foreground transition-colors group-hover:text-foreground">
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        {/* Saved presets */}
        {savedPresets.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-medium text-muted-foreground">Saved</p>
            <div className="grid grid-cols-3 gap-1.5">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="group relative">
                  <button
                    onClick={() => onApplySaved(preset)}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-muted p-2 transition-all hover:border-foreground/30 hover:bg-accent"
                  >
                    <span className="h-7 w-full fill-foreground/50 transition-colors group-hover:fill-foreground/80">
                      <LayoutThumbnail layouts={preset.layouts} />
                    </span>
                    <span className="w-full truncate text-center text-[10px] leading-none text-muted-foreground transition-colors group-hover:text-foreground">
                      {preset.name}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(preset.id) }}
                    className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-destructive/20 hover:text-destructive group-hover:flex"
                    title="Delete preset"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={9} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Save current layout */}
        <Separator className="my-3" />
        {saving ? (
          <div className="flex gap-1.5">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") { setSaving(false); setName("") }
              }}
              placeholder="Name this layout…"
              className="h-8 text-xs"
            />
            <Button size="icon-sm" onClick={handleSave} disabled={!name.trim()}>
              <HugeiconsIcon icon={FloppyDiskIcon} size={13} strokeWidth={2} />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setSaving(false); setName("") }}>
              <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setSaving(true)}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
            Save current layout
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
