"use client"

import { useState, useEffect } from "react"
import { getKey, setKey, hasRequiredKeys, PROVIDER_CONFIGS, type Provider } from "@/lib/apiKeys"

interface Props {
  /** Which provider triggered the modal (pre-selects that tab) */
  initialProvider?: Provider
  open: boolean
  onClose: (saved: boolean) => void
}

const PROVIDERS: Provider[] = ["google", "elevenlabs", "deepgram"]

export function ApiKeyModal({ initialProvider, open, onClose }: Props) {
  const [values, setValues] = useState<Record<Provider, string>>({
    google: "",
    elevenlabs: "",
    deepgram: "",
  })
  const [showValues, setShowValues] = useState<Record<Provider, boolean>>({
    google: false,
    elevenlabs: false,
    deepgram: false,
  })
  const [saved, setSaved] = useState(false)
  const [activeProvider, setActiveProvider] = useState<Provider>(initialProvider ?? "google")

  useEffect(() => {
    if (open) {
      setValues({
        google: getKey("google"),
        elevenlabs: getKey("elevenlabs"),
        deepgram: getKey("deepgram"),
      })
      setSaved(false)
      if (initialProvider) setActiveProvider(initialProvider)
    }
  }, [open, initialProvider])

  if (!open) return null

  const handleSave = () => {
    for (const p of PROVIDERS) {
      setKey(p, values[p])
    }
    setSaved(true)
    setTimeout(() => onClose(true), 500)
  }

  const cfg = PROVIDER_CONFIGS[activeProvider]
  const canSave = !!(values.google?.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onClose(false)} />

      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">🔑 API Keys</h2>
            <p className="text-xs text-gray-500 mt-0.5">Stored only in your browser — never sent to any server.</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Provider tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 gap-1 pt-3">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${
                activeProvider === p
                  ? "border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {p === "google" ? "Gemini" : p === "elevenlabs" ? "ElevenLabs" : "Deepgram"}
              {p === "google" && <span className="ml-1 text-pink-500 text-xs">*</span>}
              {values[p] && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />}
            </button>
          ))}
        </div>

        {/* Active provider field */}
        <div className="px-6 py-5">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {cfg.label}
              {cfg.required && <span className="ml-1 text-pink-500">*</span>}
            </label>
            <a
              href={cfg.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 transition"
            >
              {cfg.docsLabel}
            </a>
          </div>
          <div className="relative">
            <input
              type={showValues[activeProvider] ? "text" : "password"}
              value={values[activeProvider]}
              onChange={(e) => setValues((v) => ({ ...v, [activeProvider]: e.target.value }))}
              placeholder={cfg.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowValues((sv) => ({ ...sv, [activeProvider]: !sv[activeProvider] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              tabIndex={-1}
            >
              {showValues[activeProvider] ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{cfg.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <p className="text-xs text-gray-400">* Google Gemini required for all providers</p>
          <div className="flex gap-2">
            <button
              onClick={() => onClose(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                saved
                  ? "bg-green-600 text-white"
                  : canSave
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {saved ? "✓ Saved!" : "Save Keys"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
