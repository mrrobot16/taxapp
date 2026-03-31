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
      <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 font-medium list-none flex items-center gap-1 select-none">
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

      <div className="mt-2 space-y-2 border-l-2 border-gray-700 pl-3">
        {sources.map((src, i) => {
          const label =
            src.metadata?.file ??
            src.metadata?.form ??
            src.metadata?.publication ??
            `Source ${i + 1}`;
          return (
            <div key={i} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-300 truncate">{label}</span>
                <span className="ml-2 shrink-0 text-gray-500">
                  relevance: {src.score.toFixed(2)}
                </span>
              </div>
              <p className="text-gray-500 line-clamp-3 leading-relaxed">
                {src.text.length > 300 ? src.text.slice(0, 300) + "…" : src.text}
              </p>
              {i < sources.length - 1 && (
                <hr className="mt-2 border-gray-700" />
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
      <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow">
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
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 mt-1 h-7 w-7 rounded-full bg-emerald-700 flex items-center justify-center text-sm">
        🧾
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow">
          {content ? (
            <div
              className="prose-chat text-sm text-gray-100 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          ) : (
            isStreaming && (
              <div className="flex gap-1 items-center py-1">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
              </div>
            )
          )}
          {isStreaming && content && (
            <span className="inline-block h-4 w-0.5 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {showSources && sources && sources.length > 0 && !isStreaming && (
          <div className="mt-1 px-4">
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
 * For a production app, replace with `marked` or `react-markdown`.
 */
function formatMarkdown(text: string): string {
  return text
    // Code blocks first (before other replacements)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // H3
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    // H2
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // H1
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs: double newlines
    .replace(/\n\n/g, "</p><p>")
    // Single line break
    .replace(/\n/g, "<br />")
    // Wrap everything in a paragraph if no block-level elements
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
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <span className="text-5xl mb-4">🧾</span>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Welcome to IRS Copilot
        </h2>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed">
          Ask any US tax question. I'll answer based strictly on IRS forms,
          publications, and curated tax scenarios — no guessing.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
          {[
            "What forms do I need for rental income?",
            "How do I report stock sales on my taxes?",
            "What is a Schedule K-1 and when do I need it?",
            "Can I deduct home office expenses as a contractor?",
          ].map((suggestion) => (
            <div
              key={suggestion}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400 text-left leading-relaxed"
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
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
