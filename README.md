# 💬 Hiroba 広場

> A public plaza where everyone gathers — all your stream chats in one place.

Hiroba (広場, Japanese for "public square/plaza") is a single-tab chat aggregator for live streamers and viewers. Instead of juggling five different browser windows for every platform's popout chat, Hiroba puts them all on one page in a flexible, resizable, drag-and-drop grid.

## Features

- **Multi-platform** - YouTube Live, Twitch, Kick, Rumble, Facebook out of the box
- **FancyZones-style layout** - drag panels anywhere, resize from any edge or corner
- **Persistent** - layout and panel config auto-save to localStorage
- **No login required** - open in any browser, configure your channels and go
- **Add/remove panels freely** - any combination of platforms, as many as you want
- **Dark by default** - built for monitoring during streams

## Supported platforms

| Platform | Notes |
|---|---|
| YouTube Live | Requires the live video ID |
| Twitch | Official embed chat API, auto-detects domain |
| Kick | Popout chat URL |
| Rumble | Popup chat URL |
| Facebook | Video embed |

> TikTok and Instagram block all iframe embedding and have no public popout chat URLs.

## Getting started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

- **Drag** - grab the grip in any panel's header to move it
- **Resize** - drag any edge or corner handle to resize
- **Add** - click "Add Chat" in the toolbar, pick a platform, enter the channel/video ID
- **Edit** - click the gear icon on a panel to change the channel or label
- **Remove** - click X on a panel to close it
- **Reset** - click "Reset" to snap all panels back to equal columns

Layout and panel config save to localStorage automatically.

## Stack

- [Next.js 16](https://nextjs.org) - App Router
- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) - draggable resizable grid
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [bun](https://bun.sh)

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amajorai/hiroba)

---

Named after 広場 (*hiroba*) — the open public squares found throughout Japan where people naturally gather.
