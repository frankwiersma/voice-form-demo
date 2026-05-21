"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, Settings, Mic } from "lucide-react"

import { cn } from "@/lib/utils"
import { voiceToFormAction, STTProvider } from "@/actions/voice-to-form"
import { DEMOS } from "@/lib/demos"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsModal } from "@/components/settings-modal"
import { IpadMockup } from "@/components/ipad-mockup"
import { getAllKeys, hasKey, type Provider } from "@/lib/apiKeys"
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
const APP_TITLE = "Offshore Substation Inspection"

export default function InspectionPage() {
  const currentDemo = DEMOS.find((d) => d.id === ACTIVE_DEMO_ID) || DEMOS[0]

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [sttProvider, setSttProvider] = useState<STTProvider>("gemini")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<Provider>("google")
  const [imgError, setImgError] = useState(false)

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
        const result = await voiceToFormAction(audioFile, sttProvider, ACTIVE_DEMO_ID, getAllKeys())

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
    [form, sttProvider]
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
            <span className="hidden text-sm font-medium text-[#a0c4e8] sm:inline">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openSettings("google")}
              title="Settings"
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
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(360px,440px)] lg:gap-12">
          {/* Left: copy + offshore image */}
          <div className="order-2 lg:order-1">
            <p className="text-sm font-bold uppercase tracking-wider text-[#3c8cfa]">Offshore grid · field operations</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {APP_TITLE}, by voice.
            </h1>
            <div className="tennet-accent-line mt-4" />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Walk the platform, speak your observations, and let AI structure them into a complete
              routine inspection report — switchgear, leaks, safety equipment, security and more.
              Snap a photo and AI flags anomalies automatically.
            </p>

            <figure className="mt-6 overflow-hidden rounded-xl border border-border bg-[#001e50] shadow-[0_20px_50px_-25px_rgba(0,30,80,0.6)]">
              <div className="relative aspect-[16/13] w-full">
                {!imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/offshore-platform.png"
                    alt="Cutaway of a TenneT offshore high-voltage substation platform"
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
                Offshore high-voltage substation — cutaway view
              </figcaption>
            </figure>
          </div>

          {/* Right: form inside iPad */}
          <div className="order-1 mx-auto w-full max-w-[440px] lg:order-2">
            <IpadMockup screenClassName="max-h-[74vh]">
              <div className="px-5 pb-6 pt-6 sm:px-6">
                {/* Form header inside the device */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold leading-tight text-foreground">{APP_TITLE}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {error && !isProcessing && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    <span>AI-assisted voice dictation</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isProcessing}
                    className={cn(
                      "mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all",
                      isRecording ? "bg-[#ff6428]" : "bg-primary hover:bg-[#3c8cfa]",
                      isProcessing && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
                    {isProcessing ? "Processing…" : isRecording ? "Stop & fill form" : "Voice fill"}
                  </button>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {currentDemo.fields.map((field) => (
                        <FormField
                          key={field.name}
                          control={form.control}
                          name={field.name}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {field.label}
                              </FormLabel>
                              <FormControl>
                                {field.type === "anomaly-detector" ? (
                                  <AnomalyDetector onDetectionComplete={(results) => formField.onChange(results)} />
                                ) : field.type === "textarea" ? (
                                  <Textarea placeholder={field.placeholder} {...formField} />
                                ) : (
                                  <Input placeholder={field.placeholder} {...formField} />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                      {currentDemo.submitButtonText}
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
