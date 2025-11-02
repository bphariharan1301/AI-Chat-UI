"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { mockStreamResponse, generateMockResponse } from "@/lib/mock-streaming";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { StickyQuestionHeader } from "@/components/chat/sticky-question-header";
import type { Message } from "@/types";

export function ChatContainer() {
	const {
		sessions,
		currentSession,
		currentSessionId,
		setCurrentSessionId,
		createSession,
		addMessage,
		updateSessionMessages,
		deleteSession,
		clearAllSessions,
	} = useChatSessions();

	// Use ref to track sessions for streaming updates
	const sessionsRef = useRef(sessions);
	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [stickyQuestion, setStickyQuestion] = useState<Message | null>(null);
	const [showStickyHeader, setShowStickyHeader] = useState(false);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const contentAreaRef = useRef<HTMLDivElement>(null);
	const questionElementRef = useRef<HTMLElement | null>(null);

	// Find the question element in the DOM
	useEffect(() => {
		if (!stickyQuestion || !contentAreaRef.current) {
			questionElementRef.current = null;
			return;
		}

		// Find the question element by matching the message ID
		const userMessages = contentAreaRef.current.querySelectorAll(
			'[data-message-role="user"]'
		);
		const questionElement = Array.from(userMessages).find(
			(el) => (el as HTMLElement).dataset.messageId === stickyQuestion.id
		) as HTMLElement | null;

		// Fallback to last user message if ID match fails
		questionElementRef.current =
			questionElement || (Array.from(userMessages).pop() as HTMLElement | null);
	}, [stickyQuestion, currentSession?.messages, streamingContent]);

	// Check if content overflows viewport and handle sticky header (Perplexity-style)
	useEffect(() => {
		const container = chatContainerRef.current;
		const contentArea = contentAreaRef.current;
		if (!container || !contentArea) return;

		const checkStickyHeader = () => {
			if (!stickyQuestion) {
				setShowStickyHeader(false);
				return;
			}

			const containerHeight = container.clientHeight;
			const contentHeight = contentArea.scrollHeight;
			const scrollTop = container.scrollTop;

			// Check if content overflows (response is longer than viewport)
			const hasOverflow = contentHeight > containerHeight;

			if (!hasOverflow) {
				// No overflow, hide sticky header
				setShowStickyHeader(false);
				return;
			}

			// If we have overflow, show header when scrolled past question
			// Find the question element position
			let shouldShow = false;

			if (questionElementRef.current) {
				const questionRect = questionElementRef.current.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				// Show header if question is scrolled above the top of container
				shouldShow = questionRect.bottom < containerRect.top;
			} else {
				// Fallback: show when scrolled past a threshold
				shouldShow = scrollTop > 50;
			}

			setShowStickyHeader(shouldShow);
		};

		// Use ResizeObserver to detect when content size changes (especially during streaming)
		const resizeObserver = new ResizeObserver(() => {
			// Small delay to ensure DOM is updated
			setTimeout(checkStickyHeader, 50);
		});

		resizeObserver.observe(contentArea);

		// Check on scroll
		const handleScroll = () => {
			checkStickyHeader();
		};

		container.addEventListener("scroll", handleScroll, { passive: true });

		// Initial check and periodic checks during streaming
		checkStickyHeader();
		const intervalId = setInterval(checkStickyHeader, 200);

		return () => {
			resizeObserver.disconnect();
			container.removeEventListener("scroll", handleScroll);
			clearInterval(intervalId);
		};
	}, [currentSession?.messages, streamingContent, isStreaming, stickyQuestion]);

	// Find the current question for sticky header (question for the response being scrolled)
	useEffect(() => {
		if (currentSession) {
			// Find the last user message that has a following assistant message
			const messages = currentSession.messages;
			for (let i = messages.length - 1; i >= 0; i--) {
				if (messages[i].role === "user") {
					// Check if there's an assistant message after this user message
					const hasAssistantAfter = messages
						.slice(i + 1)
						.some((m) => m.role === "assistant");
					if (hasAssistantAfter || isStreaming) {
						setStickyQuestion(messages[i]);
						break;
					}
				}
			}
		} else {
			setStickyQuestion(null);
		}
	}, [currentSession, isStreaming]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [currentSession?.messages, streamingContent]);

	const handleSendInternal = useCallback(
		async (content: string, sessionId: string) => {
			// Add user message
			const userMessage: Message = {
				id: `msg-${Date.now()}`,
				role: "user",
				content,
				timestamp: new Date(),
			};

			addMessage(sessionId, userMessage);

			// Set streaming state
			setIsStreaming(true);
			setStreamingContent("");

			// Generate mock response
			const fullResponse = generateMockResponse(content);

			// Stream response
			let accumulatedContent = "";
			let assistantMessageId = `msg-assistant-${Date.now()}`;
			let assistantMessageAdded = false;

			for await (const chunk of mockStreamResponse(fullResponse, 25)) {
				accumulatedContent = chunk.content;
				setStreamingContent(accumulatedContent);

				// Update messages in real-time
				const assistantMessage: Message = {
					id: assistantMessageId,
					role: "assistant",
					content: accumulatedContent,
					timestamp: new Date(),
				};

				// Get current session to update messages
				const currentSessions = sessionsRef.current;
				const session = currentSessions.find((s) => s.id === sessionId);
				if (session) {
					const messages = [...session.messages];
					const lastMsg = messages[messages.length - 1];
					if (lastMsg?.role === "user" && !assistantMessageAdded) {
						// Add new assistant message
						assistantMessageAdded = true;
						updateSessionMessages(sessionId, [...messages, assistantMessage]);
					} else {
						// Update existing assistant message
						if (
							messages.length > 0 &&
							messages[messages.length - 1].role === "assistant"
						) {
							messages[messages.length - 1] = assistantMessage;
							updateSessionMessages(sessionId, messages);
						}
					}
				}

				if (chunk.done) {
					setIsStreaming(false);
					setStreamingContent("");
				}
			}
		},
		[addMessage, updateSessionMessages, sessionsRef]
	);

	const handleSend = useCallback(
		async (content: string) => {
			let sessionId = currentSessionId;
			if (!sessionId) {
				sessionId = createSession();
				// Wait a bit for session to be created
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			handleSendInternal(content, sessionId);
		},
		[currentSessionId, createSession, handleSendInternal]
	);

	const handleRegenerate = useCallback(() => {
		if (!currentSession || currentSession.messages.length === 0) return;

		const lastUserMessage = [...currentSession.messages]
			.reverse()
			.find((m) => m.role === "user");
		if (lastUserMessage) {
			// Remove last assistant message if exists
			const messages = currentSession.messages.filter(
				(m, idx, arr) =>
					!(
						idx === arr.length - 1 &&
						m.role === "assistant" &&
						arr[idx - 1]?.id === lastUserMessage.id
					)
			);
			updateSessionMessages(currentSession.id, messages);
			// Regenerate
			handleSendInternal(lastUserMessage.content, currentSession.id);
		}
	}, [currentSession, updateSessionMessages, handleSendInternal]);

	const handleEdit = useCallback(() => {
		// TODO: Implement edit functionality
		console.log("Edit not implemented yet");
	}, []);

	return (
		<div className="flex h-screen w-full overflow-hidden">
			<ChatSidebar
				sessions={sessions}
				currentSessionId={currentSessionId}
				onSelectSession={setCurrentSessionId}
				onNewChat={createSession}
				onDeleteSession={deleteSession}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<div ref={chatContainerRef} className="flex-1 overflow-y-auto relative">
					{stickyQuestion && (
						<StickyQuestionHeader
							question={stickyQuestion}
							isVisible={showStickyHeader}
						/>
					)}

					<div ref={contentAreaRef} className="min-h-full">
						{!currentSession || currentSession.messages.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<div className="text-center max-w-md px-6">
									<h2 className="text-2xl font-semibold mb-2">
										Start a conversation
									</h2>
									<p className="text-sm text-muted-foreground">
										Ask me anything, and I'll do my best to help.
									</p>
								</div>
							</div>
						) : (
							<>
								{currentSession.messages.map((message) => (
									<div
										key={message.id}
										data-message-role={message.role}
										data-message-id={message.id}
									>
										<MessageBubble
											message={message}
											onRegenerate={
												message.role === "assistant" &&
												message.id ===
													currentSession.messages[
														currentSession.messages.length - 1
													]?.id
													? handleRegenerate
													: undefined
											}
											onEdit={message.role === "user" ? handleEdit : undefined}
										/>
									</div>
								))}
								{isStreaming && <ThinkingIndicator />}
								<div ref={messagesEndRef} />
							</>
						)}
					</div>
				</div>

				<ChatInput onSend={handleSend} isLoading={isStreaming} />
			</div>
		</div>
	);
}
