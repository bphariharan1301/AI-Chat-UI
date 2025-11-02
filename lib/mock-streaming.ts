import type { StreamingChunk } from "@/types"

/**
 * Mock streaming response generator
 * Simulates token-by-token streaming with slight delay
 */
export async function* mockStreamResponse(
  fullText: string,
  delay: number = 30
): AsyncGenerator<StreamingChunk, void, unknown> {
  const words = fullText.split(/(\s+)/)
  
  for (let i = 0; i < words.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    const chunk = words.slice(0, i + 1).join("")
    yield { content: chunk, done: false }
  }
  
  yield { content: fullText, done: true }
}

/**
 * Generate mock AI response based on user message
 */
export function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  
  // Check for code-related questions
  if (lower.includes("code") || lower.includes("function") || lower.includes("example")) {
    return `Here's a code example that might help:

\`\`\`typescript
function example() {
  // This is a mock code response
  const greeting = "Hello, World!"
  console.log(greeting)
  return greeting
}
\`\`\`

This function demonstrates basic TypeScript syntax. You can extend it by adding parameters, return types, or additional logic.

**Additional Notes:**
- TypeScript provides type safety
- Functions can be async for handling promises
- You can use arrow functions for concise syntax

Would you like me to explain any specific part in more detail?`
  }
  
  // Check for long messages
  if (lower.includes("long") || lower.includes('detailed') || lower.includes("comprehensive")) { 
    return `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This topic involves several key concepts that work together. First, there's the foundational principle that guides the overall approach. Then, we have practical applications that build on this foundation.

**Key Points:**
1. Understanding the basics is crucial
2. Practice helps solidify concepts
3. Real-world applications bring it all together

The relationship between these elements creates a comprehensive understanding that can be applied across various contexts. Would you like me to dive deeper into any specific aspect?`
  }


  // Check for explanation requests
  if (lower.includes("explain") || lower.includes("what") || lower.includes("how")) {
    return `Here's a detailed explanation:

This topic involves several key concepts that work together. First, there's the foundational principle that guides the overall approach. Then, we have practical applications that build on this foundation.

**Key Points:**
1. Understanding the basics is crucial
2. Practice helps solidify concepts
3. Real-world applications bring it all together

The relationship between these elements creates a comprehensive understanding that can be applied across various contexts. Would you like me to dive deeper into any specific aspect?`
  }
  
  // Default response
  return `Thank you for your message. I'm here to help you explore ideas, solve problems, and provide insights on a wide range of topics.

Here's what I can help with:
- **Technical questions**: Code examples, architecture, best practices
- **Explanations**: Breaking down complex topics into understandable parts
- **Problem-solving**: Working through challenges step by step
- **Creative collaboration**: Brainstorming and refining ideas
`
}

