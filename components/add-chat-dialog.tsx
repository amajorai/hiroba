"use client"

import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PLATFORMS from "@/lib/platforms"
import type { Platform, ChatPanel } from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (panel: ChatPanel) => void
  onUpdate: (panel: ChatPanel) => void
  editPanel: ChatPanel | null
}

const PLATFORM_KEYS = Object.keys(PLATFORMS) as Platform[]

function generateId(platform: Platform, channel: string) {
  return `${platform}-${channel}-${Math.random().toString(36).slice(2, 7)}`
}

export default function AddChatDialog({
  open,
  onClose,
  onAdd,
  onUpdate,
  editPanel,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("twitch")
  const [channel, setChannel] = useState("")
  const [label, setLabel] = useState("")

  useEffect(() => {
    if (editPanel) {
      setPlatform(editPanel.platform)
      setChannel(editPanel.channel)
      setLabel(editPanel.label)
    } else {
      setPlatform("twitch")
      setChannel("")
      setLabel("")
    }
  }, [editPanel, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!channel.trim()) return
    const resolvedLabel = label.trim() || channel.trim()
    if (editPanel) {
      onUpdate({ ...editPanel, platform, channel: channel.trim(), label: resolvedLabel })
    } else {
      onAdd({ id: generateId(platform, channel.trim()), platform, channel: channel.trim(), label: resolvedLabel })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editPanel ? "Edit Chat Panel" : "Add Chat Panel"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_KEYS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border py-2.5 px-2 text-xs font-medium transition-all"
                  style={{
                    borderColor: platform === p ? PLATFORMS[p].color : "var(--border)",
                    backgroundColor: platform === p ? `color-mix(in oklch, ${PLATFORMS[p].color} 12%, transparent)` : "var(--muted)",
                    color: platform === p ? PLATFORMS[p].color : "var(--muted-foreground)",
                  }}
                >
                  {(() => { const Icon = PLATFORMS[p].icon; return <Icon className="size-5" /> })()}
                  {PLATFORMS[p].name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">{PLATFORMS[platform].inputLabel}</Label>
            <Input
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder={PLATFORMS[platform].placeholder}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">
              Display name
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Stream"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={!channel.trim()}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              {editPanel ? "Save changes" : "Add panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
