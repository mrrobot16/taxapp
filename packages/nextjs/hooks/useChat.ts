"use client";

import { useCallback, useRef, useState } from "react";

export interface Source {
  text: string;
  metadata: Record<string, string>;
  score: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  apiKey: string;
  topK: number;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat({ apiKey, topK }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep a plain history for the API (no sources, no ids)
  const historyRef = useRef<HistoryEntry[]>([]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);

      const userMsg: Message = { id: uid(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = uid();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: historyRef.current.slice(-20),
            top_k: topK,
            api_key: apiKey,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Unknown error");
          throw new Error(errText);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullAnswer = "";
        let sources: Source[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines look like: "data: {...}\n\n"
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            let event: { type: string; content?: string; sources?: Source[]; message?: string };
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === "text" && event.content) {
              fullAnswer += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullAnswer } : m
                )
              );
            } else if (event.type === "sources" && event.sources) {
              sources = event.sources;
            } else if (event.type === "error" && event.message) {
              throw new Error(event.message);
            }
          }
        }

        // Attach sources to the final assistant message
        if (sources.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sources } : m
            )
          );
        }

        // Update conversation history for context
        historyRef.current.push(
          { role: "user", content: text },
          { role: "assistant", content: fullAnswer }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, an error occurred. Please try again." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, topK, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
