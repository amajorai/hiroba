"use client"

import { DashboardSquare02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PRESETS, type LayoutPreset } from "@/lib/layouts"
import { cn } from "@/lib/utils"

const THUMBNAILS: Record<LayoutPreset, React.ReactNode> = {
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

interface Props {
  onSelect: (preset: LayoutPreset) => void
  disabled?: boolean
}

export default function LayoutPicker({ onSelect, disabled }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" disabled={disabled} />
        }
      >
        <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2} />
        Layout
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">Preset layouts</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted p-2 transition-all hover:border-foreground/30 hover:bg-accent"
              )}
            >
              <span className="h-7 w-full fill-foreground/50 group-hover:fill-foreground/80 transition-colors">
                {THUMBNAILS[preset.id]}
              </span>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-none">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
