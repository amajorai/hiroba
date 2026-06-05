import type { ComponentType } from "react"
import type { Platform } from "./types"
import { YouTubeIcon } from "@/components/icons/youtube"
import { TwitchIcon } from "@/components/icons/twitch"
import { KickIcon } from "@/components/icons/kick"
import { FacebookIcon } from "@/components/icons/facebook"
import { RumbleIcon } from "@/components/icons/rumble"

export interface PlatformConfig {
  id: Platform
  name: string
  color: string
  icon: ComponentType<{ className?: string }>
  placeholder: string
  inputLabel: string
  buildUrl: (channel: string) => string
}

const PLATFORMS: Record<Platform, PlatformConfig> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    icon: YouTubeIcon,
    placeholder: "Video ID (e.g. QsaTT5HcAyY)",
    inputLabel: "Video ID",
    buildUrl: (videoId) => {
      const domain =
        typeof window !== "undefined" ? window.location.hostname : "localhost"
      return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${domain}`
    },
  },
  twitch: {
    id: "twitch",
    name: "Twitch",
    color: "#9146FF",
    icon: TwitchIcon,
    placeholder: "Channel name (e.g. jiaweihq)",
    inputLabel: "Channel Name",
    buildUrl: (channel) => {
      const parent =
        typeof window !== "undefined" ? window.location.hostname : "localhost"
      return `https://www.twitch.tv/embed/${channel}/chat?parent=${parent}&darkpopout`
    },
  },
  kick: {
    id: "kick",
    name: "Kick",
    color: "#53FC18",
    icon: KickIcon,
    placeholder: "Channel name (e.g. jiaweing)",
    inputLabel: "Channel Name",
    buildUrl: (channel) => `https://kick.com/popout/${channel}/chat`,
  },
  rumble: {
    id: "rumble",
    name: "Rumble",
    color: "#85C742",
    icon: RumbleIcon,
    placeholder: "Stream ID from chat embed URL",
    inputLabel: "Stream ID",
    buildUrl: (id) => `https://rumble.com/chat/popup/${id}`,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    icon: FacebookIcon,
    placeholder: "Video ID",
    inputLabel: "Video ID",
    buildUrl: (videoId) =>
      `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${videoId}&show_text=false`,
  },
}

export default PLATFORMS
