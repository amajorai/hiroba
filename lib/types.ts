export type Platform = "youtube" | "twitch" | "kick" | "rumble" | "facebook"

export interface ChatPanel {
  id: string
  platform: Platform
  channel: string
  label: string
}
