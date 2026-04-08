"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";

type BackendStatus = "loading" | "ok" | "no_index" | "offline";

export default function Chat() {
  const [showSources, setShowSources] = useState(true);
  const [topK, setTopK] = useState(8);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [docCount, setDocCount] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    conversations,
    activeConversationId,
    selectConversation,
  } = useChat({ topK });

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

  const disabledReason =
    backendStatus === "offline"
      ? "Python backend is offline. Run: npm run start:api"
      : backendStatus === "no_index"
      ? "Knowledge base not indexed. Run: npm run scripts:indexer"
      : undefined;

  return (
    <div className="flex h-screen bg-rh-dark text-rh-white overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {settingsOpen && (
        <SettingsModal
          showSources={showSources}
          onShowSourcesChange={setShowSources}
          topK={topK}
          onTopKChange={setTopK}
          onClear={clearMessages}
          docCount={docCount}
          backendStatus={backendStatus}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <main className="flex flex-col flex-1 overflow-hidden min-w-0">
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
          disabled={backendStatus === "offline" || backendStatus === "no_index"}
          disabledReason={disabledReason}
        />
      </main>
    </div>
  );
}
