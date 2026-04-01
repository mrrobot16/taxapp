"use client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  showSources: boolean;
  onShowSourcesChange: (val: boolean) => void;
  topK: number;
  onTopKChange: (val: number) => void;
  onClear: () => void;
  docCount: number | null;
  backendStatus: "ok" | "no_index" | "offline" | "loading";
}

export default function Sidebar({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  showSources,
  onShowSourcesChange,
  topK,
  onTopKChange,
  onClear,
  docCount,
  backendStatus,
}: SidebarProps) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-rh-surface border-r border-rh-border h-full overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:shrink-0
      `}
    >
      {/* Header */}
      <div className="px-5 py-6 border-b border-rh-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧾</span>
            <h1 className="font-serif text-lg font-semibold text-rh-white tracking-tight">IRS Copilot</h1>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden p-1.5 rounded-lg text-rh-warm-gray hover:text-rh-white hover:bg-rh-surface-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-rh-warm-gray leading-relaxed">
          Ask any US tax question. Answers are grounded in IRS forms,
          publications, and curated tax scenarios.
        </p>
      </div>

      {/* Settings */}
      <div className="flex-1 px-5 py-5 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-rh-cool-gray uppercase tracking-widest mb-3">
            Settings
          </h2>

          {/* API Key */}
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium text-rh-warm-white">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-rh-surface-2 border border-rh-border rounded-lg px-3 py-2 text-sm text-rh-white placeholder-rh-cool-gray focus:outline-none focus:ring-2 focus:ring-rh-lime focus:border-transparent transition"
            />
            <p className="text-xs text-rh-cool-gray">
              Get a key at{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rh-lime hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Show sources toggle */}
          <div className="flex items-center justify-between mb-4">
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
        </div>

        {/* Clear conversation */}
        <div className="border-t border-rh-border pt-5">
          <button
            onClick={onClear}
            className="w-full bg-rh-surface-2 hover:bg-rh-border border border-rh-border text-rh-warm-gray hover:text-rh-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Clear conversation
          </button>
        </div>
      </div>

      {/* Knowledge base status */}
      <div className="px-5 py-4 border-t border-rh-border">
        {backendStatus === "loading" && (
          <div className="flex items-center gap-2 text-xs text-rh-warm-gray">
            <span className="inline-block h-2 w-2 rounded-full bg-rh-cool-gray animate-pulse" />
            Connecting…
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
              <code className="bg-rh-surface-2 px-1 rounded text-rh-lime">python scripts/indexer.py</code>{" "}
              first.
            </span>
          </div>
        )}
        {backendStatus === "offline" && (
          <div className="flex items-start gap-2 text-xs text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400 mt-1 shrink-0" />
            <span>
              Python backend offline. Run{" "}
              <code className="bg-rh-surface-2 px-1 rounded text-rh-lime">npm run start:api</code>.
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-rh-cool-gray">
          Knowledge base: 2025 IRS forms, instructions, and publications.
        </p>
      </div>
    </aside>
  );
}
