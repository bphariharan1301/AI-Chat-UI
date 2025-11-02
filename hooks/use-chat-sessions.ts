"use client"

import { useState, useEffect, useCallback } from "react"
import type { ChatSession, Message } from "@/types"

const STORAGE_KEY = "ai-chat-sessions"

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }))
        setSessions(parsed)
        
        // Set current session to the most recent one
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[parsed.length - 1].id)
        }
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    }
  }, [])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
      } catch (error) {
        console.error("Failed to save chat sessions:", error)
      }
    }
  }, [sessions])

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions((prev) => [...prev, newSession])
    setCurrentSessionId(newSession.id)
    return newSession.id
  }, [])

  const addMessage = useCallback(
    (sessionId: string, message: Message) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            const updated = {
              ...session,
              messages: [...session.messages, message],
              updatedAt: new Date(),
            }
            // Update title from first user message
            if (message.role === "user" && session.messages.length === 0) {
              updated.title =
                message.content.slice(0, 50) +
                (message.content.length > 50 ? "..." : "")
            }
            return updated
          }
          return session
        })
      )
    },
    []
  )

  const updateSessionMessages = useCallback(
    (sessionId: string, messages: Message[]) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              messages,
              updatedAt: new Date(),
            }
          }
          return session
        })
      )
    },
    []
  )

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId)
      setCurrentSessionId(
        remaining.length > 0 ? remaining[remaining.length - 1].id : null
      )
    }
  }, [currentSessionId, sessions])

  const clearAllSessions = useCallback(() => {
    setSessions([])
    setCurrentSessionId(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null

  return {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    addMessage,
    updateSessionMessages,
    deleteSession,
    clearAllSessions,
  }
}

