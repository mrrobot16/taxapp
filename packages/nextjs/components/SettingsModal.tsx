"use client";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Text from "@/components/ui/Text";
import type { BackendStatus } from "@/hooks/useChat";

interface SettingsModalProps {
  showSources: boolean;
  onShowSourcesChange: (val: boolean) => void;
  topK: number;
  onTopKChange: (val: number) => void;
  onClear: () => void;
  docCount: number | null;
  backendStatus: BackendStatus;
  onClose: () => void;
}

export default function SettingsModal({
  showSources,
  onShowSourcesChange,
  topK,
  onTopKChange,
  onClear,
  docCount,
  backendStatus,
  onClose,
}: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-rh-surface border border-rh-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rh-border">
          <Text as="h2" size="base" weight="semibold" color="white">
            Settings &amp; Help
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-6">
          {/* Show sources toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-rh-warm-white">Show retrieved sources</span>
            <button
              onClick={() => onShowSourcesChange(!showSources)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rh-lime ${
                showSources ? "bg-rh-lime" : "bg-rh-border"
              }`}
              role="switch"
              aria-checked={showSources}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                  showSources ? "translate-x-6 bg-rh-dark" : "translate-x-1 bg-rh-warm-gray"
                }`}
              />
            </button>
          </div>

          {/* Top-K slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-rh-warm-white">Sources to retrieve</label>
              <span className="text-sm font-semibold text-rh-lime">{topK}</span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              value={topK}
              onChange={(e) => onTopKChange(Number(e.target.value))}
              className="w-full h-2 bg-rh-border rounded-lg appearance-none cursor-pointer accent-rh-lime"
            />
            <div className="flex justify-between text-xs text-rh-cool-gray">
              <span>3</span>
              <span>15</span>
            </div>
          </div>

          {/* Knowledge base status */}
          <div className="rounded-lg bg-rh-surface-2 border border-rh-border px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-rh-cool-gray uppercase tracking-widest mb-2">
              Knowledge Base
            </p>
            {backendStatus === "loading" && (
              <div className="flex items-center gap-2 text-xs text-rh-warm-gray">
                <span className="inline-block h-2 w-2 rounded-full bg-rh-cool-gray animate-pulse" />
                Connecting&hellip;
              </div>
            )}
            {backendStatus === "ok" && (
              <div className="flex items-center gap-2 text-xs text-[#4ade80]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#4ade80]" />
                {docCount?.toLocaleString()} documents indexed
              </div>
            )}
            {backendStatus === "no_index" && (
              <div className="flex items-start gap-2 text-xs text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                <span>
                  Knowledge base not found. Run{" "}
                  <code className="bg-rh-surface px-1 rounded text-rh-lime">python scripts/indexer.py</code>{" "}
                  first.
                </span>
              </div>
            )}
            {backendStatus === "offline" && (
              <div className="flex items-start gap-2 text-xs text-red-400">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400 mt-1 shrink-0" />
                <span>
                  Python backend offline. Run{" "}
                  <code className="bg-rh-surface px-1 rounded text-rh-lime">npm run start:api</code>.
                </span>
              </div>
            )}
            <p className="text-xs text-rh-cool-gray pt-1">
              2025 IRS forms, instructions, and publications.
            </p>
          </div>

          {/* Clear conversation */}
          <Button
            variant="secondary"
            size="medium"
            fullWidth
            onClick={() => { onClear(); onClose(); }}
          >
            Clear conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
