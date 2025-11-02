"use client";

import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react";
import { Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearch, useMentions } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

interface ChatInputProps {
	onSend: (message: string) => void;
	isLoading?: boolean;
	placeholder?: string;
}

export function ChatInput({
	onSend,
	isLoading = false,
	placeholder = "Message...",
}: ChatInputProps) {
	const [message, setMessage] = useState("");
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [cursorPosition, setCursorPosition] = useState(0);
	const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">(
		"below"
	);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Detect if we're in mention mode (@)
	const getMentionQuery = useCallback(() => {
		const text = message.substring(0, cursorPosition);
		const lastAtIndex = text.lastIndexOf("@");
		if (lastAtIndex === -1) return null;

		const query = text.substring(lastAtIndex + 1);
		// Check if there's a space after @ (mention ended)
		if (query.includes(" ")) return null;

		return { query, startIndex: lastAtIndex };
	}, [message, cursorPosition]);

	// Detect search query (everything after last space)
	const getSearchQuery = useCallback(() => {
		const mention = getMentionQuery();
		if (mention) return null; // In mention mode, don't show search

		const text = message.substring(0, cursorPosition).trim();
		const lastSpace = text.lastIndexOf(" ");
		const query = lastSpace === -1 ? text : text.substring(lastSpace + 1);

		return query.length >= 2 ? query : null;
	}, [message, cursorPosition, getMentionQuery]);

	const mentionInfo = getMentionQuery();
	const searchQuery = getSearchQuery();

	// Fetch search results
	const { data: searchResults = [], isLoading: isSearchLoading } = useSearch(
		searchQuery || "",
		!!searchQuery && !mentionInfo
	);

	// Fetch mention results
	const { data: mentionResults = [], isLoading: isMentionsLoading } =
		useMentions(mentionInfo?.query || "", !!mentionInfo);

	// Debounce cursor position updates
	useEffect(() => {
		const handleSelectionChange = () => {
			if (textareaRef.current) {
				setCursorPosition(textareaRef.current.selectionStart);
			}
		};

		const textarea = textareaRef.current;
		if (textarea) {
			textarea.addEventListener("click", handleSelectionChange);
			textarea.addEventListener("keyup", handleSelectionChange);
			return () => {
				textarea.removeEventListener("click", handleSelectionChange);
				textarea.removeEventListener("keyup", handleSelectionChange);
			};
		}
	}, []);

	// Show/hide autocomplete
	useEffect(() => {
		const shouldShow =
			(mentionInfo && mentionResults.length > 0) ||
			(!!searchQuery && searchResults.length > 0 && !mentionInfo);

		setShowAutocomplete(shouldShow);
		setSelectedIndex(shouldShow ? 0 : -1);
	}, [mentionInfo, mentionResults, searchQuery, searchResults]);

	// Calculate dropdown position based on available viewport space
	useEffect(() => {
		if (!showAutocomplete || !containerRef.current) {
			return;
		}

		const calculatePosition = () => {
			const container = containerRef.current;
			if (!container) return;

			const containerRect = container.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			const spaceBelow = viewportHeight - containerRect.bottom;
			const spaceAbove = containerRect.top;
			const dropdownHeight = 300; // max-h-[300px]

			// If not enough space below but more space above, flip to above
			if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
				setDropdownPosition("above");
			} else {
				setDropdownPosition("below");
			}
		};

		calculatePosition();

		// Recalculate on window resize or scroll
		window.addEventListener("resize", calculatePosition);
		window.addEventListener("scroll", calculatePosition, true);

		return () => {
			window.removeEventListener("resize", calculatePosition);
			window.removeEventListener("scroll", calculatePosition, true);
		};
	}, [showAutocomplete]);

	// Scroll selected item into view
	useEffect(() => {
		if (dropdownRef.current && selectedIndex >= 0) {
			const selectedElement = dropdownRef.current.children[
				selectedIndex
			] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		}
	}, [selectedIndex]);

	// Handle keyboard navigation
	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (!showAutocomplete) {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
			return;
		}

		const results = mentionInfo ? mentionResults : searchResults;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < results.length - 1 ? prev + 1 : prev
				);
				break;

			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
				break;

			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < results.length) {
					handleSelect(selectedIndex);
				} else {
					handleSubmit();
				}
				break;

			case "Escape":
				e.preventDefault();
				setShowAutocomplete(false);
				setSelectedIndex(-1);
				break;

			default:
				// Reset selection on typing
				setSelectedIndex(0);
		}
	};

	// Handle selection
	const handleSelect = (index: number) => {
		if (mentionInfo) {
			const mention = mentionResults[index];
			if (mention) {
				const before = message.substring(0, mentionInfo.startIndex);
				const after = message.substring(cursorPosition);
				const newMessage = `${before}@${mention.username} ${after}`;
				setMessage(newMessage);
				setShowAutocomplete(false);
				// Set cursor after the mention
				setTimeout(() => {
					if (textareaRef.current) {
						const newPosition =
							mentionInfo.startIndex + mention.username.length + 2;
						textareaRef.current.setSelectionRange(newPosition, newPosition);
						setCursorPosition(newPosition);
					}
				}, 0);
			}
		} else if (searchQuery) {
			const result = searchResults[index];
			if (result) {
				const lastSpace = message.substring(0, cursorPosition).lastIndexOf(" ");
				const before =
					lastSpace === -1 ? "" : message.substring(0, lastSpace + 1);
				const after = message.substring(cursorPosition);
				const newMessage = `${before}${result.text} ${after}`;
				setMessage(newMessage);
				setShowAutocomplete(false);
				// Set cursor after the suggestion
				setTimeout(() => {
					if (textareaRef.current) {
						const newPosition = before.length + result.text.length + 1;
						textareaRef.current.setSelectionRange(newPosition, newPosition);
						setCursorPosition(newPosition);
					}
				}, 0);
			}
		}
	};

	const handleSubmit = () => {
		if (!message.trim() || isLoading) return;
		setShowAutocomplete(false);
		onSend(message.trim());
		setMessage("");
		setSelectedIndex(-1);
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value);
		setCursorPosition(e.target.selectionStart);
		// Auto-resize textarea
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				200
			)}px`;
		}
	};

	const currentResults = mentionInfo ? mentionResults : searchResults;
	const isLoadingResults = mentionInfo ? isMentionsLoading : isSearchLoading;
	const query = mentionInfo?.query || searchQuery || "";

	// Highlight matching text
	const highlightText = (text: string, highlight: string) => {
		if (!highlight) return text;
		const parts = text.split(new RegExp(`(${highlight})`, "gi"));
		return (
			<>
				{parts.map((part, index) =>
					part.toLowerCase() === highlight.toLowerCase() ? (
						<span key={index} className="font-bold">
							{part}
						</span>
					) : (
						<span key={index}>{part}</span>
					)
				)}
			</>
		);
	};

	return (
		<div className="border-t border-border bg-background">
			<div className="px-6 py-4">
				<div className="flex items-end gap-2">
					<div ref={containerRef} className="flex-1 relative">
						<Textarea
							ref={textareaRef}
							value={message}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							disabled={isLoading}
							rows={1}
							className={cn(
								"resize-none",
								"min-h-[52px] max-h-[200px]",
								"px-4 py-3"
							)}
						/>
						{showAutocomplete &&
							!isLoadingResults &&
							currentResults.length > 0 && (
								<div
									className={cn(
										"absolute left-0 right-0 z-50",
										"w-full rounded-md border bg-popover shadow-md",
										"max-h-[300px] overflow-hidden",
										dropdownPosition === "below"
											? "top-full mt-2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
											: "bottom-full mb-2 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2"
									)}
								>
									<div
										ref={dropdownRef}
										className="max-h-[300px] overflow-y-auto p-1"
									>
										{currentResults.map((result, index) => {
											const isSelected = index === selectedIndex;
											const isMention = mentionInfo !== null;

											return (
												<div
													key={isMention ? (result as any).id : index}
													onClick={() => handleSelect(index)}
													className={cn(
														"relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
														"focus:bg-accent focus:text-accent-foreground",
														"hover:bg-accent hover:text-accent-foreground",
														isSelected && "bg-accent text-accent-foreground"
													)}
												>
													{isMention ? (
														<div className="flex items-center gap-2 w-full">
															<User className="h-4 w-4 text-muted-foreground shrink-0" />
															<div className="flex-1 min-w-0">
																<div className="text-sm font-medium truncate">
																	{highlightText((result as any).name, query)}
																</div>
																<div className="text-xs text-muted-foreground truncate">
																	@{(result as any).username}
																</div>
															</div>
														</div>
													) : (
														<div className="text-sm w-full">
															{highlightText((result as any).text, query)}
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							)}
					</div>
					<Button
						onClick={handleSubmit}
						disabled={!message.trim() || isLoading}
						size="icon"
						className="h-[52px] w-[52px] shrink-0"
					>
						{isLoading ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Send className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
