"use client";

import { useCallback, useRef, useState } from "react";
import {
  API_ROUTES,
  CHAT_HISTORY_WINDOW,
  CONVERSATION_TITLE_PREVIEW_LENGTH,
  RANDOM_ID_SLICE_END,
  RANDOM_ID_SLICE_START,
} from "@/constants";

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
  phaseLabel?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  history: HistoryEntry[];
}

export type BackendStatus = "loading" | "ok" | "no_index" | "offline";

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  topK: number;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  selectConversation: (id: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(RANDOM_ID_SLICE_START, RANDOM_ID_SLICE_END);
}

export function useChat({ topK }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const historyRef = useRef<HistoryEntry[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const selectConversation = useCallback((id: string) => {
    const conv = conversationsRef.current.find((c) => c.id === id);
    if (!conv) return;
    activeIdRef.current = id;
    setActiveConversationId(id);
    setMessages(conv.messages);
    historyRef.current = conv.history;
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoadingRef.current) return;

      setError(null);

      const userMsg: Message = { id: uid(), role: "user", content: text };

      // Create a new conversation on the first message of a session
      let convId = activeIdRef.current;
      if (!convId) {
        convId = uid();
        activeIdRef.current = convId;
        setActiveConversationId(convId);
        const title =
          text.length > CONVERSATION_TITLE_PREVIEW_LENGTH
            ? text.slice(0, CONVERSATION_TITLE_PREVIEW_LENGTH) + "\u2026"
            : text;
        const newConv: Conversation = { id: convId, title, messages: [], history: [] };
        setConversations((prev) => [newConv, ...prev]);
      }

      const currentConvId = convId;

      setMessages((prev) => [...prev, userMsg]);

      const assistantId = uid();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        phaseLabel: "Connecting to assistant",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsLoading(true);
      isLoadingRef.current = true;

      try {
        const res = await fetch(API_ROUTES.chat, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: historyRef.current.slice(-CHAT_HISTORY_WINDOW),
            top_k: topK,
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

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            let event: {
              type: string;
              content?: string;
              sources?: Source[];
              message?: string;
              label?: string;
            };
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === "phase" && event.label) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        phaseLabel: event.label,
                      }
                    : m
                )
              );
            } else if (event.type === "text" && event.content) {
              fullAnswer += event.content;
            } else if (event.type === "sources" && event.sources) {
              sources = event.sources;
            } else if (event.type === "done") {
              continue;
            } else if (event.type === "error" && event.message) {
              throw new Error(event.message);
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fullAnswer,
                  sources: sources.length > 0 ? sources : undefined,
                  phaseLabel: undefined,
                }
              : m
          )
        );

        historyRef.current.push(
          { role: "user", content: text },
          { role: "assistant", content: fullAnswer }
        );

        // Persist final messages + history into the conversation snapshot
        setMessages((latestMsgs) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === currentConvId
                ? { ...c, messages: latestMsgs, history: [...historyRef.current] }
                : c
            )
          );
          return latestMsgs;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, an error occurred. Please try again.", phaseLabel: undefined }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [topK]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    historyRef.current = [];
    activeIdRef.current = null;
    setActiveConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    conversations,
    activeConversationId,
    selectConversation,
  };
}
