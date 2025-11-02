"use client"

export function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-4 px-6 py-6">
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse-slow [animation-delay:0ms]"></span>
            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse-slow [animation-delay:150ms]"></span>
            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse-slow [animation-delay:300ms]"></span>
          </div>
          <span>Thinking...</span>
        </div>
      </div>
    </div>
  )
}

