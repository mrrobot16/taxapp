"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";

type BackendStatus = "loading" | "ok" | "no_index" | "offline";

export default function Chat() {
  const [apiKey, setApiKey] = useState("");
  const [showSources, setShowSources] = useState(true);
  const [topK, setTopK] = useState(8);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [docCount, setDocCount] = useState<number | null>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
    apiKey,
    topK,
  });

  // Poll backend health once on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        if (res.status === 503 || data.status === "offline") {
          setBackendStatus("offline");
        } else if (data.status === "no_index") {
          setBackendStatus("no_index");
          setDocCount(0);
        } else {
          setBackendStatus("ok");
          setDocCount(data.doc_count ?? 0);
        }
      } catch {
        setBackendStatus("offline");
      }
    }
    checkHealth();
  }, []);

  const disabledReason = !apiKey
    ? "Enter your Anthropic API key in the sidebar to start chatting."
    : backendStatus === "offline"
    ? "Python backend is offline. Run: npm run start:api"
    : backendStatus === "no_index"
    ? "Knowledge base not indexed. Run: npm run scripts:indexer"
    : undefined;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        showSources={showSources}
        onShowSourcesChange={setShowSources}
        topK={topK}
        onTopKChange={setTopK}
        onClear={clearMessages}
        docCount={docCount}
        backendStatus={backendStatus}
      />

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Error banner */}
        {error && (
          <div className="shrink-0 bg-red-900/50 border-b border-red-700 px-4 py-2 text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        <MessageList
          messages={messages}
          isLoading={isLoading}
          showSources={showSources}
        />

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!apiKey || backendStatus === "offline" || backendStatus === "no_index"}
          disabledReason={disabledReason}
        />
      </main>
    </div>
  );
}
