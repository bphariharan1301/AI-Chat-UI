"use client"

import type { Message } from "@/types"
import { cn } from "@/lib/utils"

interface StickyQuestionHeaderProps {
  question: Message
  isVisible: boolean
}

export function StickyQuestionHeader({
  question,
  isVisible,
}: StickyQuestionHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10",
        "bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
        "border-b border-border",
        "transition-all duration-300 ease-in-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      )}
      role="banner"
      aria-label="Sticky question header"
    >
      <div className="max-w-3xl px-6 py-3">
        <p
          className={cn(
            "text-sm font-medium text-foreground line-clamp-2",
            "transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {question.content}
        </p>
      </div>
    </div>
  )
}

