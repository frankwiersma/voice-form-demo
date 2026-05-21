"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, Settings, Mic, Trash2, Copy, Check, Lightbulb } from "lucide-react"

import { cn } from "@/lib/utils"
import { voiceToFormAction, STTProvider } from "@/actions/voice-to-form"
import { DEMOS } from "@/lib/demos"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsModal } from "@/components/settings-modal"
import { IpadMockup } from "@/components/ipad-mockup"
import { getAllKeys, hasKey, type Provider } from "@/lib/apiKeys"
import { UI, FIELD_I18N, GROUP_I18N, EXAMPLE_SCRIPT, LANG_STORAGE_KEY, type Lang } from "@/lib/i18n"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AnomalyDetector } from "@/components/anomaly-detector"

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
}

const SUPPORTED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm"] as const

function getMimeType(): string {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return "audio/webm"
}

// In this branch the offshore substation inspection is the only available form.
const ACTIVE_DEMO_ID = "substation-inspection"

// Group fields into compact sections so more fits on screen without scrolling.
const FIELD_GROUPS: { title: string; fields: string[] }[] = [
  { title: "Identification", fields: ["inspectorName", "dateTime", "substationName", "weatherConditions"] },
  { title: "General & equipment condition", fields: ["generalImpression", "switchgearCondition", "leaksRustOverheating"] },
  { title: "Safety & security", fields: ["safetyEquipment", "cleanlinessVegetation", "securityStatus", "unusualObservations"] },
  { title: "Photo inspection", fields: ["imageAnomalyDetection"] },
  { title: "Actions & sign-off", fields: ["maintenanceActions", "additionalRemarks", "recommendations", "inspectorSignature"] },
]

export default function InspectionPage() {
  const currentDemo = DEMOS.find((d) => d.id === ACTIVE_DEMO_ID) || DEMOS[0]
  const fieldByName = Object.fromEntries(currentDemo.fields.map((f) => [f.name, f]))

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [sttProvider, setSttProvider] = useState<STTProvider>("gemini")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<Provider>("google")
  const [imgError, setImgError] = useState(false)
  const [anomalyKey, setAnomalyKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [scriptLen, setScriptLen] = useState<"short" | "long">("long")
  const [expanded, setExpanded] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [lang, setLang] = useState<Lang>("nl")
  const t = UI[lang]

  // Load + persist language preference (Dutch by default).
  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved === "nl" || saved === "en") setLang(saved)
  }, [])
  const changeLang = useCallback((next: Lang) => {
    setLang(next)
    localStorage.setItem(LANG_STORAGE_KEY, next)
  }, [])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const form = useForm({
    resolver: zodResolver(currentDemo.schema),
    defaultValues: currentDemo.defaultValues,
    mode: "onChange",
  })

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const openSettings = useCallback((tab: Provider = "google") => {
    setSettingsTab(tab)
    setSettingsOpen(true)
  }, [])

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true)
      setError("")
      try {
        const audioFile = new File([audioBlob], "audio.webm", { type: audioBlob.type })
        const result = await voiceToFormAction(audioFile, sttProvider, ACTIVE_DEMO_ID, getAllKeys(), lang)

        if (result.data && Object.keys(result.data).length > 0) {
          const entries = Object.entries(result.data)
          for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i]
            if (value && value.trim()) {
              const chars = (value as string).split("")
              for (let j = 0; j <= chars.length; j++) {
                form.setValue(key as never, chars.slice(0, j).join("") as never, { shouldValidate: false })
                await new Promise((r) => setTimeout(r, 15))
              }
              form.setValue(key as never, value as never, { shouldValidate: true })
            }
          }
        } else if (result.error) {
          setError(result.error)
        }
      } catch (err) {
        console.error("Voice input error:", err)
        setError(err instanceof Error ? err.message : "Failed to process audio")
      } finally {
        setIsProcessing(false)
      }
    },
    [form, sttProvider, lang]
  )

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop()
    cleanupStream()
    setIsRecording(false)
  }, [cleanupStream])

  const startRecording = useCallback(async () => {
    // Make sure the keys needed for the selected provider exist first.
    const needsKey =
      !hasKey("google") ||
      (sttProvider === "elevenlabs" && !hasKey("elevenlabs")) ||
      (sttProvider === "deepgram" && !hasKey("deepgram"))
    if (needsKey) {
      openSettings(!hasKey("google") ? "google" : (sttProvider as Provider))
      return
    }
    try {
      setError("")
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS)
      streamRef.current = stream
      const mimeType = getMimeType()
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        processAudio(audioBlob)
      }
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError("Microphone permission denied")
      console.error("Microphone error:", err)
    }
  }, [processAudio, sttProvider, openSettings])

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  useEffect(() => cleanupStream, [cleanupStream])

  const onSubmit = (data: unknown) => {
    console.log("Inspection submitted:", data)
    alert("Inspection report submitted! Check console for data.")
  }

  const handleClear = useCallback(() => {
    form.reset(currentDemo.defaultValues)
    setError("")
    setAnomalyKey((k) => k + 1) // remount AnomalyDetector to clear its uploaded image
  }, [form, currentDemo.defaultValues])

  const handleExpandedChange = useCallback((v: boolean) => {
    setExpanded(v)
    if (!v) setPanelOpen(false)
  }, [])

  const toggleScript = useCallback(() => {
    if (!expanded) {
      setExpanded(true)
      setPanelOpen(true)
    } else {
      setPanelOpen((p) => !p)
    }
  }, [expanded])

  const copyScript = useCallback(() => {
    navigator.clipboard?.writeText(EXAMPLE_SCRIPT[lang][scriptLen]).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [lang, scriptLen])

  const scriptPanel = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#ff6428]" />
          <h3 className="text-sm font-bold text-foreground">{t.scriptTitle}</h3>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
            {lang === "nl" ? "NL" : "EN"}
          </span>
        </div>
        <button
          type="button"
          onClick={copyScript}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#33a92f]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <div className="px-4 pt-3">
        <p className="text-xs text-muted-foreground">{t.scriptHint}</p>
        <div className="mt-3 inline-flex rounded-lg border border-border p-0.5">
          {(["short", "long"] as const).map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => setScriptLen(len)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition",
                scriptLen === len ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {len === "short" ? t.scriptShort : t.scriptLong}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto whitespace-pre-line px-4 py-3 text-sm leading-relaxed text-foreground">
        {EXAMPLE_SCRIPT[lang][scriptLen]}
      </div>
    </div>
  )

  return (
    <div className="tennet-page-bg min-h-screen">
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sttProvider={sttProvider}
        onChangeProvider={setSttProvider}
        initialProvider={settingsTab}
      />

      {/* Header band */}
      <header className="tennet-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tennet-logo-white.png" alt="TenneT" className="h-7 w-auto" />
            <span className="hidden text-sm font-medium text-[#a0c4e8] sm:inline">{t.appTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5">
              {(["nl", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  title={l === "nl" ? "Nederlands" : "English"}
                  aria-pressed={lang === l}
                  className={cn(
                    "flex h-7 w-8 items-center justify-center rounded-full text-base leading-none transition",
                    lang === l ? "bg-white shadow-sm" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <span aria-hidden>{l === "nl" ? "🇳🇱" : "🇬🇧"}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => openSettings("google")}
              title={t.settings}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-5 py-8 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(360px,440px)] lg:gap-12">
          {/* Left: copy + offshore image */}
          <div className="order-2 lg:order-1">
            <p className="text-sm font-bold uppercase tracking-wider text-[#3c8cfa]">{t.tagline}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t.appTitle}{t.headingSuffix}
            </h1>
            <div className="tennet-accent-line mt-4" />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t.heroBody}
            </p>

            <figure className="mt-6 overflow-hidden rounded-xl border border-border bg-[#001e50] shadow-[0_20px_50px_-25px_rgba(0,30,80,0.6)]">
              <div className="relative aspect-[16/13] w-full">
                {!imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/offshore-platform.png"
                    alt={t.figureAlt}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#003584] to-[#001e50] p-6 text-center">
                    <span className="text-sm font-semibold text-white">Offshore platform image</span>
                    <span className="max-w-xs text-xs text-[#a0c4e8]">
                      Save your image to <code className="rounded bg-white/10 px-1">public/offshore-platform.png</code> to show it here.
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 text-xs text-[#a0c4e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff6428]" />
                {t.figureCaption}
              </figcaption>
            </figure>
          </div>

          {/* Right: form inside iPad */}
          <div className="order-1 mx-auto w-full max-w-[440px] lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <IpadMockup
              screenClassName="max-h-[74vh]"
              sidePanel={scriptPanel}
              expanded={expanded}
              onExpandedChange={handleExpandedChange}
              panelOpen={panelOpen}
            >
              <div className="px-5 pb-6 pt-6 sm:px-6">
                {/* Form header inside the device */}
                <div className="mb-4 pr-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold leading-tight text-foreground">{t.appTitle}</h2>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleScript()
                      }}
                      title={t.scriptTitle}
                      aria-label={t.scriptTitle}
                      aria-pressed={expanded && panelOpen}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
                        expanded && panelOpen
                          ? "border-[#ff6428] bg-[#ff6428] text-white"
                          : "border-[#ff6428]/50 text-[#ff6428] hover:bg-[#ff6428]/10"
                      )}
                    >
                      <Lightbulb className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {error && !isProcessing && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    <span>{t.voiceDictation}</span>
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      disabled={isProcessing}
                      className={cn(
                        "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold uppercase tracking-wide text-white transition-all",
                        isRecording ? "bg-[#c84a1c]" : "bg-[#ff6428] hover:bg-[#e85718]",
                        isProcessing && "cursor-not-allowed opacity-70"
                      )}
                    >
                      <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
                      {isProcessing ? t.processing : isRecording ? t.stopFill : t.voiceFill}
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      title={t.clearForm}
                      aria-label={t.clearForm}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isProcessing && (
                    <div className="mt-2 loading-track" role="progressbar" aria-label={t.processing}>
                      <div className="loading-bar" />
                    </div>
                  )}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      {FIELD_GROUPS.map((group) => (
                        <section key={group.title}>
                          <div className="mb-2 flex items-center gap-2 border-t border-border pt-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#ff6428]" />
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {GROUP_I18N[group.title]?.[lang] ?? group.title}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                            {group.fields.map((name) => {
                              const field = fieldByName[name]
                              if (!field) return null
                              const fullWidth = field.type !== "text"
                              const tr = FIELD_I18N[name]?.[lang]
                              const label = tr?.label ?? field.label
                              const placeholder = tr?.placeholder ?? field.placeholder
                              return (
                                <FormField
                                  key={name}
                                  control={form.control}
                                  name={name}
                                  render={({ field: formField }) => (
                                    <FormItem className={fullWidth ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                                      <FormLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        {label}
                                      </FormLabel>
                                      <FormControl>
                                        {field.type === "anomaly-detector" ? (
                                          <AnomalyDetector key={anomalyKey} onDetectionComplete={(results) => formField.onChange(results)} />
                                        ) : field.type === "textarea" ? (
                                          <Textarea rows={2} placeholder={placeholder} className="min-h-[48px]" {...formField} />
                                        ) : (
                                          <Input placeholder={placeholder} {...formField} />
                                        )}
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )
                            })}
                          </div>
                        </section>
                      ))}
                    </div>

                    {error && (
                      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <p className="text-sm text-destructive">{error}</p>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="h-11 w-full text-sm font-semibold uppercase tracking-wide">
                      {t.submit}
                    </Button>
                  </form>
                </Form>
              </div>
            </IpadMockup>
          </div>
        </div>
      </main>
    </div>
  )
}
