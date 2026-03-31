"use client";

interface SidebarProps {
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
    <aside className="w-72 shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🧾</span>
          <h1 className="text-lg font-semibold text-white">IRS Copilot</h1>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Ask any US tax question. Answers are grounded in IRS forms,
          publications, and curated tax scenarios.
        </p>
      </div>

      {/* Settings */}
      <div className="flex-1 px-5 py-5 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Settings
          </h2>

          {/* API Key */}
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium text-gray-300">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500">
              Get a key at{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Show sources toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-300">Show retrieved sources</span>
            <button
              onClick={() => onShowSourcesChange(!showSources)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showSources ? "bg-blue-600" : "bg-gray-600"
              }`}
              role="switch"
              aria-checked={showSources}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  showSources ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Top-K slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Sources to retrieve</label>
              <span className="text-sm font-semibold text-blue-400">{topK}</span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              value={topK}
              onChange={(e) => onTopKChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>3</span>
              <span>15</span>
            </div>
          </div>
        </div>

        {/* Clear conversation */}
        <div className="border-t border-gray-800 pt-5">
          <button
            onClick={onClear}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Clear conversation
          </button>
        </div>
      </div>

      {/* Knowledge base status */}
      <div className="px-5 py-4 border-t border-gray-800">
        {backendStatus === "loading" && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-500 animate-pulse" />
            Connecting…
          </div>
        )}
        {backendStatus === "ok" && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {docCount?.toLocaleString()} documents indexed
          </div>
        )}
        {backendStatus === "no_index" && (
          <div className="flex items-start gap-2 text-xs text-amber-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <span>
              Knowledge base not found. Run{" "}
              <code className="bg-gray-800 px-1 rounded">python scripts/indexer.py</code>{" "}
              first.
            </span>
          </div>
        )}
        {backendStatus === "offline" && (
          <div className="flex items-start gap-2 text-xs text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400 mt-1 shrink-0" />
            <span>
              Python backend offline. Run{" "}
              <code className="bg-gray-800 px-1 rounded">npm run start:api</code>.
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Knowledge base: 2025 IRS forms, instructions, and publications.
        </p>
      </div>
    </aside>
  );
}
