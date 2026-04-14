"use client";

import { memo, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import type { Message, Source } from "@/hooks/useChat";
import Icon from "@/components/ui/Icon";
import {
  MESSAGE_LIST_AUTOSCROLL_DELAY_MS,
  SOURCES_TEXT_PREVIEW_LENGTH,
  STREAM_PHASE_CHECK_DISPLAY_MS,
  STREAM_PHASES,
} from "@/constants";

const mdComponents: Components = {
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="font-serif text-xl font-semibold text-rh-white mt-5 mb-2 first:mt-0" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="font-serif text-lg font-semibold text-rh-white mt-5 mb-2 first:mt-0" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="font-serif text-base font-semibold text-rh-white mt-4 mb-1.5 first:mt-0" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-3 leading-[1.7] last:mb-0" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-rh-white" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className="italic text-rh-warm-gray" {...props}>{children}</em>
  ),
  a: ({ children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a className="text-rh-lime underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-rh-cool-gray" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-rh-cool-gray" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed pl-1" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-3 border-rh-border pl-4 my-3 text-rh-cool-gray italic" {...props}>{children}</blockquote>
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="border-rh-border my-5" {...props} />
  ),
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className={`block text-rh-warm-white ${className ?? ""}`} {...props}>{children}</code>;
    }
    return (
      <code className="bg-rh-border/60 text-rh-lime px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>{children}</code>
    );
  },
  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre className="bg-rh-surface rounded-lg p-4 overflow-x-auto mb-3 text-[0.85rem] leading-relaxed" {...props}>{children}</pre>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-rh-border">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-rh-surface-2" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className="text-left px-4 py-2.5 font-semibold text-rh-warm-white text-xs uppercase tracking-wider border-b border-rh-border" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-2.5 text-rh-warm-white border-b border-rh-border/50" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr className="even:bg-rh-surface/40 transition-colors" {...props}>{children}</tr>
  ),
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  showSources: boolean;
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-xs text-rh-lime hover:text-rh-warm-white font-medium list-none flex items-center gap-1 select-none">
        <Icon name="chevron-right" size="sm" className="h-3 w-3 transition-transform group-open:rotate-90" />
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
                {src.text.length > SOURCES_TEXT_PREVIEW_LENGTH
                  ? src.text.slice(0, SOURCES_TEXT_PREVIEW_LENGTH) + "…"
                  : src.text}
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

const UserBubble = memo(function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-rh-green text-white rounded-[24px] px-4 py-3 text-sm leading-relaxed shadow font-medium">
        {content}
      </div>
    </div>
  );
});

const AssistantBubble = memo(function AssistantBubble({
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
  const [stepState, setStepState] = useState(0);

  useEffect(() => {
    if (!isStreaming || content) {
      setStepState(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STREAM_PHASES.length; i++) {
      timers.push(setTimeout(
        () => setStepState(i * 2 - 1),
        STREAM_PHASES[i].afterMs - STREAM_PHASE_CHECK_DISPLAY_MS
      ));
      timers.push(setTimeout(
        () => setStepState(i * 2),
        STREAM_PHASES[i].afterMs
      ));
    }

    return () => timers.forEach(clearTimeout);
  }, [isStreaming, content]);

  const phaseIndex = Math.floor(stepState / 2);
  const isChecked = stepState % 2 === 1;

  const rendered = useMemo(
    () => (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    ),
    [content],
  );

  return (
    <div className="flex gap-6">
      <Image
        src="/favicon.png"
        alt="Taxapp"
        width={28}
        height={28}
        className="shrink-0 mt-1 h-7 w-7 object-cover"
      />

      <div className="flex-1 min-w-0">
        <div>
          {content ? (
            <div className="prose-chat text-sm text-rh-warm-white leading-relaxed">
              {rendered}
            </div>
          ) : (
            isStreaming && (
              <div className="py-1 max-w-xs">
                <div className="flex items-center gap-2.5 text-xs">
                  {isChecked ? (
                    <span className="h-4 w-4 rounded-full bg-rh-lime/20 flex items-center justify-center">
                      <Icon name="check" size="sm" className="!h-2.5 !w-2.5 text-rh-lime" />
                    </span>
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-rh-lime border-t-transparent animate-spin" />
                  )}
                  <span className={isChecked ? "text-rh-cool-gray" : "text-rh-warm-white"}>
                    {STREAM_PHASES[phaseIndex].label}
                  </span>
                </div>
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
});

export default function MessageList({
  messages,
  isLoading,
  showSources,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, MESSAGE_LIST_AUTOSCROLL_DELAY_MS);
    return () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); };
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
