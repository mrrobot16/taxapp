"use client";

import { useState } from "react";
import type { Conversation } from "@/hooks/useChat";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onSettingsOpen: () => void;
}

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
        flex flex-col bg-rh-surface border-r border-rh-border h-full
        transition-all duration-300 ease-in-out overflow-hidden
        max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[45] max-md:w-[min(100vw,308px)] max-md:shadow-xl
        ${isOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
        md:relative md:shrink-0 md:translate-x-0
        ${isOpen ? "md:w-[308px]" : "md:w-[72px]"}
      `}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-4 overflow-hidden">
        <div className="flex items-center justify-between gap-1 w-[275px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Icon name="menu" size="md" />
          </Button>

          {isOpen && (
            <Button
              variant={searchActive ? "outline" : "ghost"}
              size="icon"
              onClick={() => {
                setSearchActive((v) => !v);
                setSearchQuery("");
              }}
              aria-label="Search conversations"
            >
              <Icon name="search" size="md" />
            </Button>
          )}
        </div>

        {isOpen && searchActive && (
          <div className="mt-2">
            <Input
              autoFocus
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search conversations…"
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
        <Button
          variant="ghost"
          size={isOpen ? "medium" : "icon"}
          fullWidth={isOpen}
          justify={isOpen ? "start" : undefined}
          gap={isOpen ? "md" : undefined}
          onClick={onSettingsOpen}
          aria-label="Settings and help"
          className={isOpen ? "rounded-xl hover:bg-rh-border" : ""}
        >
          <Icon name="gear" size="md" />
          {isOpen && (
            <span className="whitespace-nowrap">Settings &amp; Help</span>
          )}
        </Button>
      </div>
    </aside>
  );
}
