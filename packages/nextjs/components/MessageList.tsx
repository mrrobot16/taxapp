"use client";

import { useEffect, useRef } from "react";
import type { Message, Source } from "@/hooks/useChat";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  showSources: boolean;
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-xs text-rh-lime hover:text-rh-warm-white font-medium list-none flex items-center gap-1 select-none">
        <svg
          className="h-3 w-3 transition-transform group-open:rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Sources ({sources.length} retrieved)
      </summary>

      <div className="mt-2 space-y-2 border-l-2 border-rh-border pl-3">
        {sources.map((src, i) => {
          const label =
            src.metadata?.file ??
            src.metadata?.form ??
            src.metadata?.publication ??
            `Source ${i + 1}`;
          return (
            <div key={i} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-rh-warm-white truncate">{label}</span>
                <span className="ml-2 shrink-0 text-rh-cool-gray">
                  relevance: {src.score.toFixed(2)}
                </span>
              </div>
              <p className="text-rh-cool-gray line-clamp-3 leading-relaxed">
                {src.text.length > 300 ? src.text.slice(0, 300) + "…" : src.text}
              </p>
              {i < sources.length - 1 && (
                <hr className="mt-2 border-rh-border" />
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-rh-lime text-rh-dark rounded-[24px] px-4 py-3 text-sm leading-relaxed shadow font-medium">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  sources,
  showSources,
  isStreaming,
}: {
  content: string;
  sources?: Source[];
  showSources: boolean;
  isStreaming: boolean;
}) {
  return (
    <div className="flex gap-6">
      {/* Avatar */}
      <div className="shrink-0 mt-1 h-7 w-7 rounded-full bg-rh-border flex items-center justify-center text-sm">
        🧾
      </div>

      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm shadow">
          {content ? (
            <div
              className="prose-chat text-sm text-rh-warm-white leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          ) : (
            isStreaming && (
              <div className="flex gap-1 items-center py-1">
                <span className="h-2 w-2 rounded-full bg-rh-cool-gray animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-rh-cool-gray animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-rh-cool-gray animate-bounce" />
              </div>
            )
          )}
          {isStreaming && content && (
            <span className="inline-block h-4 w-0.5 bg-rh-lime animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {showSources && sources && sources.length > 0 && !isStreaming && (
          <div className="mt-5">
            <SourcesPanel sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Very lightweight markdown → HTML converter.
 * Handles: bold, inline code, code blocks, headings, bullet lists, numbered lists, line breaks.
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />")
    .replace(/^(?!<[hup]|<pre)(.+)/, "<p>$1</p>");
}

export default function MessageList({
  messages,
  isLoading,
  showSources,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastAssistantIndex = messages.reduce(
    (last, msg, i) => (msg.role === "assistant" ? i : last),
    -1
  );

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-6 space-y-5">
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} content={msg.content} />
        ) : (
          <AssistantBubble
            key={msg.id}
            content={msg.content}
            sources={msg.sources}
            showSources={showSources}
            isStreaming={isLoading && i === lastAssistantIndex}
          />
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
