"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, X, Check, Mic } from "lucide-react"
import { getKey, setKey, hasKey, PROVIDER_CONFIGS, type Provider } from "@/lib/apiKeys"
import type { STTProvider } from "@/actions/voice-to-form"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onClose: () => void
  sttProvider: STTProvider
  onChangeProvider: (p: STTProvider) => void
  /** which key tab to focus when opening */
  initialProvider?: Provider
}

const KEY_TABS: Provider[] = ["google", "elevenlabs", "deepgram"]

const STT_OPTIONS: { id: STTProvider; label: string; sub: string; keyProvider: Provider; badge: string }[] = [
  { id: "gemini", label: "Google Gemini", sub: "Multimodal · fast", keyProvider: "google", badge: "G" },
  { id: "elevenlabs", label: "ElevenLabs Scribe", sub: "High accuracy", keyProvider: "elevenlabs", badge: "11" },
  { id: "deepgram", label: "Deepgram Nova", sub: "Fast · low cost", keyProvider: "deepgram", badge: "DG" },
]

export function SettingsModal({ open, onClose, sttProvider, onChangeProvider, initialProvider }: Props) {
  const [values, setValues] = useState<Record<Provider, string>>({ google: "", elevenlabs: "", deepgram: "" })
  const [reveal, setReveal] = useState<Record<Provider, boolean>>({ google: false, elevenlabs: false, deepgram: false })
  const [activeTab, setActiveTab] = useState<Provider>(initialProvider ?? "google")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setValues({ google: getKey("google"), elevenlabs: getKey("elevenlabs"), deepgram: getKey("deepgram") })
      setSaved(false)
      if (initialProvider) setActiveTab(initialProvider)
    }
  }, [open, initialProvider])

  if (!open) return null

  const persist = (next: Record<Provider, string>) => {
    for (const p of KEY_TABS) setKey(p, next[p])
  }

  const handleSave = () => {
    persist(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const cfg = PROVIDER_CONFIGS[activeTab]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#001e50]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-white shadow-2xl dark:bg-[hsl(217_100%_18%)]">
        {/* Header band — TenneT dark blue */}
        <div className="tennet-header flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Settings</h2>
            <p className="mt-0.5 text-xs text-[#a0c4e8]">Keys are stored only in your browser — never on a server.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Speech-to-text provider */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Speech-to-text provider</h3>
            </div>
            <div className="grid gap-2">
              {STT_OPTIONS.map((opt) => {
                const selected = sttProvider === opt.id
                const ready = hasKey(opt.keyProvider) && hasKey("google")
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeProvider(opt.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-all",
                      selected
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/40 hover:bg-accent/50"
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                      {opt.badge}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.sub}</span>
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        ready ? "bg-[#33a92f]" : "bg-[#ff6428]"
                      )}
                      title={ready ? "Key configured" : "API key needed"}
                    />
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              A Google Gemini key is always required (used for field extraction).
            </p>
          </div>

          <div className="tennet-accent-line mb-5" />

          {/* API keys */}
          <h3 className="mb-2 text-sm font-bold text-foreground">API keys</h3>
          <div className="mb-3 flex gap-1 border-b border-border">
            {KEY_TABS.map((p) => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
                  activeTab === p
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {p === "google" ? "Gemini" : p === "elevenlabs" ? "ElevenLabs" : "Deepgram"}
                {values[p] && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#33a92f]" />}
              </button>
            ))}
          </div>

          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {cfg.label}
              {cfg.required && <span className="ml-1 text-[#ff6428]">*</span>}
            </label>
            <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3c8cfa] hover:underline">
              {cfg.docsLabel}
            </a>
          </div>
          <div className="relative">
            <input
              type={reveal[activeTab] ? "text" : "password"}
              value={values[activeTab]}
              onChange={(e) => setValues((v) => ({ ...v, [activeTab]: e.target.value }))}
              placeholder={cfg.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-input bg-white px-4 py-2.5 pr-10 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-[#3c8cfa] focus:ring-1 focus:ring-[#3c8cfa] dark:bg-[hsl(218_100%_12%)]"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => ({ ...r, [activeTab]: !r[activeTab] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              tabIndex={-1}
            >
              {reveal[activeTab] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{cfg.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            Close
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition",
              saved ? "bg-[#33a92f]" : "bg-primary hover:bg-[#3c8cfa]"
            )}
          >
            {saved ? "✓ Saved" : "Save keys"}
          </button>
        </div>
      </div>
    </div>
  )
}
