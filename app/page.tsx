"use client"

import dynamic from "next/dynamic"

const ChatGrid = dynamic(() => import("@/components/chat-grid"), { ssr: false })

export default function Page() {
  return <ChatGrid />
}
