"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
    apiKey,
    topK,
  });

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
    <div className="flex h-screen bg-rh-dark text-rh-white overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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

      <main className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-rh-border bg-rh-surface md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg text-rh-warm-gray hover:text-rh-white hover:bg-rh-surface-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/taxapp.png" alt="IRS Copilot logo" width={24} height={24} className="rounded-sm" />
          <span className="font-serif font-semibold text-rh-white text-base tracking-tight">IRS Copilot</span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="shrink-0 bg-red-900/40 border-b border-red-800/60 px-4 py-2 text-sm text-red-300 flex items-center justify-between">
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
