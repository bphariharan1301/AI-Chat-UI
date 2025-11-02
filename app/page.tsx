"use client"

import { ChatContainer } from "@/features/chat/chat-container"
import { CommandMenu } from "@/components/command-menu"
import { useChatSessions } from "@/hooks/use-chat-sessions"

export default function Home() {
  const { createSession, clearAllSessions } = useChatSessions()

  const handleOpenSettings = () => {
    // TODO: Implement settings dialog
    console.log("Settings not implemented yet")
  }

  return (
    <main className="h-screen w-full">
      <CommandMenu
        onNewChat={createSession}
        onClearHistory={clearAllSessions}
        onOpenSettings={handleOpenSettings}
      />
      <ChatContainer />
    </main>
  )
}
