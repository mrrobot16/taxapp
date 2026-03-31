"use client";

import { useRef, useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled: boolean;
  disabledReason?: string;
}

export default function ChatInput({
  onSend,
  isLoading,
  disabled,
  disabledReason,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const isBlocked = disabled || isLoading;

  return (
    <div className="shrink-0 border-t border-gray-800 bg-gray-950 px-4 py-4">
      {disabledReason && (
        <p className="text-xs text-amber-400 mb-2 text-center">{disabledReason}</p>
      )}

      <div className={`flex items-end gap-2 bg-gray-800 border rounded-2xl px-4 py-3 transition-colors ${
        isBlocked
          ? "border-gray-700 opacity-60"
          : "border-gray-600 focus-within:border-blue-500"
      }`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask a tax question…"
          disabled={isBlocked}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-gray-100 placeholder-gray-500 focus:outline-none leading-relaxed max-h-44 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSubmit}
          disabled={isBlocked || !value.trim()}
          className="shrink-0 mb-0.5 h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700"
          aria-label="Send"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-600 text-center mt-2">
        Press <kbd className="bg-gray-800 rounded px-1">Enter</kbd> to send ·{" "}
        <kbd className="bg-gray-800 rounded px-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
