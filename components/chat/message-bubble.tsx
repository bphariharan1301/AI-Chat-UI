"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";
import {
	Copy,
	Check,
	RefreshCw,
	Edit2,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
	message: Message;
	isStreaming?: boolean;
	onRegenerate?: () => void;
	onEdit?: () => void;
}

export function MessageBubble({
	message,
	isStreaming = false,
	onRegenerate,
	onEdit,
}: MessageBubbleProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(message.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (message.role === "user") {
		return (
			<div className="flex items-start gap-4 px-6 py-6 group">
				<div className="flex-1 max-w-3xl ml-auto">
					<div className="flex items-start justify-end gap-2 mb-2">
						<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							{onEdit && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={onEdit}
								>
									<Edit2 className="h-4 w-4" />
								</Button>
							)}
						</div>
						<Card className="bg-foreground text-background border-0">
							<CardContent className="px-4 py-3 text-sm">
								{message.content}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	// Parse artifacts (code blocks, etc.)
	const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
	const artifacts: Array<{
		type: "code" | "markdown";
		language?: string;
		content: string;
		fullMatch: string;
	}> = [];

	let match;
	const parts: Array<{
		type: "text" | "artifact";
		content: string;
		artifact?: any;
	}> = [];
	let lastIndex = 0;
	let processedText = message.content;

	while ((match = codeBlockRegex.exec(message.content)) !== null) {
		const [fullMatch, language = "", content] = match;
		const artifact = {
			type: "code" as const,
			language,
			content: content.trim(),
			fullMatch,
		};
		artifacts.push(artifact);

		// Add text before artifact
		if (match.index > lastIndex) {
			parts.push({
				type: "text",
				content: processedText.slice(lastIndex, match.index),
			});
		}

		// Add artifact
		parts.push({
			type: "artifact",
			content: fullMatch,
			artifact,
		});

		lastIndex = match.index + fullMatch.length;
	}

	// Add remaining text
	if (lastIndex < processedText.length) {
		parts.push({
			type: "text",
			content: processedText.slice(lastIndex),
		});
	}

	// If no artifacts found, treat entire message as text
	if (parts.length === 0) {
		parts.push({ type: "text", content: message.content });
	}

	return (
		<div className="flex items-start gap-4 px-6 py-6 group">
			<div className="flex-1 max-w-3xl">
				<div className="space-y-3">
					{parts.map((part, idx) => {
						if (part.type === "artifact" && part.artifact) {
							return (
								<ArtifactBlock
									key={idx}
									artifact={part.artifact}
									isStreaming={isStreaming && idx === parts.length - 1}
								/>
							);
						}
						return (
							<div
								key={idx}
								className="prose prose-sm max-w-none dark:prose-invert"
							>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{part.content}
								</ReactMarkdown>
							</div>
						);
					})}
				</div>

				{!isStreaming && (
					<div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 text-xs"
							onClick={handleCopy}
						>
							{copied ? (
								<>
									<Check className="h-3 w-3 mr-1" />
									Copied
								</>
							) : (
								<>
									<Copy className="h-3 w-3 mr-1" />
									Copy
								</>
							)}
						</Button>
						{onRegenerate && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 text-xs"
								onClick={onRegenerate}
							>
								<RefreshCw className="h-3 w-3 mr-1" />
								Regenerate
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

interface ArtifactBlockProps {
	artifact: {
		type: "code";
		language?: string;
		content: string;
	};
	isStreaming?: boolean;
}

function ArtifactBlock({ artifact, isStreaming = false }: ArtifactBlockProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(artifact.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const shouldTruncate = artifact.content.length > 300;
	const displayContent = isExpanded
		? artifact.content
		: shouldTruncate
		? artifact.content.slice(0, 300) + "..."
		: artifact.content;

	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between px-4 py-2 bg-muted/50">
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs font-mono">
						{artifact.language || "code"}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						onClick={handleCopy}
					>
						{copied ? (
							<>
								<Check className="h-3 w-3 mr-1" />
								Copied
							</>
						) : (
							<>
								<Copy className="h-3 w-3 mr-1" />
								Copy
							</>
						)}
					</Button>
					{shouldTruncate && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<>
									<ChevronUp className="h-3 w-3 mr-1" />
									Collapse
								</>
							) : (
								<>
									<ChevronDown className="h-3 w-3 mr-1" />
									Expand
								</>
							)}
						</Button>
					)}
				</div>
			</CardHeader>
			<Separator />
			<CardContent className="p-4 bg-muted/30">
				<pre
					className={cn(
						"text-sm overflow-x-auto",
						isStreaming && "animate-pulse-slow"
					)}
				>
					<code>{displayContent}</code>
				</pre>
			</CardContent>
		</Card>
	);
}
