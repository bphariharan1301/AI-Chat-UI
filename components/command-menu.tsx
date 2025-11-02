"use client"

import { useState, useEffect } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, Trash2, Settings } from "lucide-react"

interface CommandMenuProps {
  onNewChat: () => void
  onClearHistory: () => void
  onOpenSettings: () => void
}

export function CommandMenu({
  onNewChat,
  onClearHistory,
  onOpenSettings,
}: CommandMenuProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (action: string) => {
    setOpen(false)
    switch (action) {
      case "new-chat":
        onNewChat()
        break
      case "clear-history":
        onClearHistory()
        break
      case "settings":
        onOpenSettings()
        break
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect("new-chat")}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("clear-history")}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear History</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

