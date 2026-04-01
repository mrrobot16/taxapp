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
  const canSend = !isBlocked && value.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-rh-border bg-rh-dark px-4 py-4">
      {disabledReason && (
        <p className="text-xs text-amber-400 mb-2 text-center">{disabledReason}</p>
      )}

      <div
        className={`flex items-center gap-2 bg-rh-surface-2 border rounded-2xl px-4 py-2 transition-colors ${
          isBlocked
            ? "border-rh-border opacity-60"
            : "border-rh-border focus-within:border-rh-lime"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask a tax question…"
          disabled={isBlocked}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-rh-white placeholder-rh-cool-gray focus:outline-none leading-relaxed max-h-44 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`shrink-0 mb-0.5 h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
            canSend
              ? "bg-rh-lime text-rh-dark hover:opacity-90"
              : "bg-rh-border text-rh-cool-gray opacity-50"
          }`}
          aria-label="Send"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4"
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
              className="h-4 w-4"
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

      <p className="text-xs text-rh-cool-gray text-center mt-2">
        Press <kbd className="bg-rh-surface-2 border border-rh-border rounded px-1">Enter</kbd> to send ·{" "}
        <kbd className="bg-rh-surface-2 border border-rh-border rounded px-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
