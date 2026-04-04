"use client";

import { useState } from "react";
import type { Conversation } from "@/hooks/useChat";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onSettingsOpen: () => void;
}

const GearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

export default function Sidebar({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onSettingsOpen,
}: SidebarProps) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <aside
      className={`
        relative shrink-0 flex flex-col bg-rh-surface border-r border-rh-border h-full
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? "w-[308px]" : "w-[72px]"}
      `}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-4 overflow-hidden">
        <div className="flex items-center justify-between gap-1 w-[275px]">
          <button
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-rh-warm-gray hover:text-rh-white hover:bg-rh-surface-2 transition-colors"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {isOpen && (
            <button
              onClick={() => {
                setSearchActive((v) => !v);
                setSearchQuery("");
              }}
              aria-label="Search conversations"
              className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                searchActive
                  ? "text-rh-white bg-rh-surface-2"
                  : "text-rh-warm-gray hover:text-rh-white hover:bg-rh-surface-2"
              }`}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {isOpen && searchActive && (
          <div className="mt-2">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-rh-surface-2 border border-rh-border rounded-lg px-3 py-2 text-sm text-rh-white placeholder-rh-cool-gray focus:outline-none focus:ring-2 focus:ring-rh-lime focus:border-transparent transition"
            />
          </div>
        )}
      </div>

      {/* Conversation list */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-xs text-rh-cool-gray text-center ">
              {searchQuery
                ? "No conversations match your search."
                : "No conversations yet."}
            </p>
          ) : (
            <ul>
              {filtered.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2.5 mx-1 text-sm rounded-lg transition-colors ${
                      conv.id === activeConversationId
                        ? "bg-rh-surface-2 text-rh-white"
                        : "text-rh-warm-gray hover:bg-rh-surface-2 hover:text-rh-white"
                    }`}
                    style={{ maxWidth: "calc(100% - 8px)" }}
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-rh-cool-gray"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-3 3v-3z"
                      />
                    </svg>
                    <span className="truncate">{conv.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (<div className="flex-1" />)}

      {/* Settings & Help button */}
      <div className="shrink-0 px-4 py-4 overflow-hidden">
        <button
          onClick={onSettingsOpen}
          aria-label="Settings and help"
          className={`flex items-center gap-3 text-rh-warm-gray hover:text-rh-white transition-colors ${
            isOpen
              ? "w-full h-10 px-4 rounded-xl hover:bg-rh-border"
              : "h-10 w-10 flex items-center justify-center rounded-lg hover:bg-rh-surface-2"
          }`}
        >
          <GearIcon className="h-5 w-5 shrink-0" />
          {isOpen && <span className="text-sm font-medium whitespace-nowrap">Settings &amp; Help</span>}
        </button>
      </div>
    </aside>
  );
}
