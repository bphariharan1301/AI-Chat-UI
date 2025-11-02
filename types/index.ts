export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface Artifact {
  id: string
  type: "code" | "markdown" | "text"
  content: string
  isExpanded: boolean
}

export interface StreamingChunk {
  content: string
  done: boolean
}

