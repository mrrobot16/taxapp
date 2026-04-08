"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useChat } from "@/hooks/useChat";

type BackendStatus = "loading" | "ok" | "no_index" | "offline";

const SUGGESTION_PROMPTS = [
  "What forms do I need for rental income?",
  "How do I report stock sales on my taxes?",
  "What is a Schedule K-1 and when do I need it?",
  "Can I deduct home office expenses as a contractor?",
];

export default function Chat() {
  const [showSources, setShowSources] = useState(true);
  const [topK, setTopK] = useState(8);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [docCount, setDocCount] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mobile: start with drawer closed so main uses full width; desktop keeps sidebar expanded
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

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

  const inputDisabled = backendStatus === "offline" || backendStatus === "no_index";

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

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-rh-dark text-rh-white overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          selectConversation(id);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(false);
          }
        }}
        onSettingsOpen={() => {
          setSettingsOpen(true);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(false);
          }
        }}
      />

      {/* Mobile / tablet: dim main when sidebar is expanded so it floats instead of squeezing layout */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      <main className="flex flex-col flex-1 overflow-hidden min-w-0 w-full bg-rh-dark">
        <header className="shrink-0 bg-rh-dark px-4 py-4 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" size="md" />
          </Button>
          <Image
            src="/taxapp.png"
            alt="Taxapp"
            width={200}
            height={56}
            className="h-9 w-auto max-w-[min(200px,45vw)] rounded-sm object-contain object-left shrink-0"
            priority
          />
        </header>

        {error && (
          <div className="shrink-0 bg-red-900/40 border-b border-red-800/60 px-4 py-2 text-sm text-red-300">
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 overflow-y-auto min-h-0">
              <div className="w-full max-w-2xl flex flex-col items-center text-center">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-rh-white mb-3 tracking-tight">
                  Welcome to taxapp
                </h1>
                <p className="text-rh-warm-gray text-sm max-w-md leading-relaxed mb-8">
                  Ask any US tax question. I&apos;ll answer based strictly on IRS forms,
                  publications, and curated tax scenarios — no guessing.
                </p>

                <ChatInput
                  variant="embedded"
                  onSend={sendMessage}
                  isLoading={isLoading}
                  disabled={inputDisabled}
                  disabledReason={disabledReason}
                />

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                  {SUGGESTION_PROMPTS.map((text) => (
                    <Button
                      key={text}
                      type="button"
                      variant="outline"
                      size="small"
                      disabled={inputDisabled || isLoading}
                      className="!h-auto min-h-0 py-2.5 px-3 text-left font-normal whitespace-normal"
                      onClick={() => sendMessage(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  showSources={showSources}
                />
              </div>
              <ChatInput
                variant="footer"
                onSend={sendMessage}
                isLoading={isLoading}
                disabled={inputDisabled}
                disabledReason={disabledReason}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
