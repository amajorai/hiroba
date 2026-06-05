"use client"

import { useState, useEffect } from "react"
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

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!channel.trim()) return
    const resolvedLabel = label.trim() || channel.trim()
    if (editPanel) {
      onUpdate({
        ...editPanel,
        platform,
        channel: channel.trim(),
        label: resolvedLabel,
      })
    } else {
      onAdd({
        id: generateId(platform, channel.trim()),
        platform,
        channel: channel.trim(),
        label: resolvedLabel,
      })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6">
        <h2 className="text-sm font-semibold text-zinc-100 mb-4">
          {editPanel ? "Edit Chat Panel" : "Add Chat Panel"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_KEYS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all"
                  style={{
                    borderColor:
                      platform === p
                        ? PLATFORMS[p].color
                        : "rgb(63 63 70)",
                    backgroundColor:
                      platform === p
                        ? `${PLATFORMS[p].color}15`
                        : "transparent",
                    color:
                      platform === p ? PLATFORMS[p].color : "rgb(161 161 170)",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PLATFORMS[p].color }}
                  />
                  {PLATFORMS[p].name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="channel"
              className="text-xs text-zinc-400 mb-1.5 block"
            >
              {PLATFORMS[platform].inputLabel}
            </label>
            <input
              id="channel"
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder={PLATFORMS[platform].placeholder}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="label"
              className="text-xs text-zinc-400 mb-1.5 block"
            >
              Display name
              <span className="text-zinc-600 ml-1">(optional)</span>
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Stream"
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channel.trim()}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: channel.trim()
                  ? PLATFORMS[platform].color
                  : undefined,
                color: channel.trim() ? "#000" : undefined,
                background: !channel.trim() ? "rgb(39 39 42)" : undefined,
              }}
            >
              {editPanel ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
