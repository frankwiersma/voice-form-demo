"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { voiceToFormAction, STTProvider } from "@/actions/voice-to-form"
import { DEMOS, DemoConfig } from "@/lib/demos"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { DemoSelector } from "@/components/demo-selector"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { VoiceButton } from "@/components/ui/voice-button"
import { AnomalyDetector } from "@/components/anomaly-detector"

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

const SUPPORTED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm"] as const

function getMimeType(): string {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return "audio/webm"
}

export default function DoctorFormPage() {
  const [selectedDemoId, setSelectedDemoId] = useState(DEMOS[0].id)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [sttProvider, setSttProvider] = useState<STTProvider>("gemini")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Get current demo config
  const currentDemo = DEMOS.find(d => d.id === selectedDemoId) || DEMOS[0]

  const form = useForm({
    resolver: zodResolver(currentDemo.schema),
    defaultValues: currentDemo.defaultValues,
    mode: "onChange",
  })

  // Reset form when demo changes
  useEffect(() => {
    form.reset(currentDemo.defaultValues)
  }, [selectedDemoId, currentDemo.defaultValues, form])

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true)
      setError("")

      try {
        const audioFile = new File([audioBlob], "audio.webm", {
          type: audioBlob.type,
        })

        const result = await voiceToFormAction(audioFile, sttProvider, selectedDemoId)

        if (result.data && Object.keys(result.data).length > 0) {
          // Animate typing effect for each field
          const entries = Object.entries(result.data)
          for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i]
            if (value && value.trim()) {
              const text = value as string
              const chars = text.split("")
              const delayPerChar = 15 // Fast typing at 15ms per character

              // Type out character by character
              for (let j = 0; j <= chars.length; j++) {
                const partial = chars.slice(0, j).join("")
                form.setValue(key as any, partial, {
                  shouldValidate: false, // Don't validate until complete
                })
                await new Promise(resolve => setTimeout(resolve, delayPerChar))
              }

              // Final validation after typing complete
              form.setValue(key as any, text, {
                shouldValidate: true,
              })
            }
          }
        }
      } catch (err) {
        console.error("Voice input error:", err)
        setError(err instanceof Error ? err.message : "Failed to process audio")
      } finally {
        setIsProcessing(false)
      }
    },
    [form, sttProvider, selectedDemoId]
  )

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop()
    }
    cleanupStream()
    setIsRecording(false)
  }, [cleanupStream])

  const startRecording = useCallback(async () => {
    try {
      setError("")
      audioChunksRef.current = []

      const stream =
        await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS)
      streamRef.current = stream

      const mimeType = getMimeType()
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
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
  }, [processAudio])

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  useEffect(() => {
    return cleanupStream
  }, [cleanupStream])

  const onSubmit = (data: any) => {
    console.log("Form submitted:", data)
    alert("Form submitted! Check console for data.")
  }

  const voiceState = isProcessing
    ? "processing"
    : isRecording
      ? "recording"
      : error
        ? "error"
        : "idle"

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Demo Selector Side Pane */}
      <DemoSelector
        demos={DEMOS}
        selectedDemoId={selectedDemoId}
        onSelectDemo={setSelectedDemoId}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-auto">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex justify-between items-center mb-6 pt-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentDemo.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                AI-powered {currentDemo.description}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <Card className="relative overflow-hidden shadow-lg border-2 bg-white dark:bg-slate-900">
            <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <CardTitle className="text-2xl">{currentDemo.formTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {error && !isProcessing && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span>
                        Voice dictation powered by{" "}
                        {sttProvider === "elevenlabs"
                          ? "ElevenLabs Scribe"
                          : sttProvider === "deepgram"
                            ? "Deepgram Nova"
                            : "Google Gemini"}
                      </span>
                    </CardDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Speech-to-Text Provider:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSttProvider("elevenlabs")}
                        disabled={isRecording || isProcessing}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          "border-2 shadow-sm hover:shadow-md",
                          sttProvider === "elevenlabs"
                            ? "bg-primary text-primary-foreground border-primary scale-105"
                            : "bg-background hover:bg-accent hover:text-accent-foreground border-border hover:border-primary/50",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold shadow-sm">
                          11
                        </span>
                        ElevenLabs
                      </button>
                      <button
                        type="button"
                        onClick={() => setSttProvider("deepgram")}
                        disabled={isRecording || isProcessing}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          "border-2 shadow-sm hover:shadow-md",
                          sttProvider === "deepgram"
                            ? "bg-primary text-primary-foreground border-primary scale-105"
                            : "bg-background hover:bg-accent hover:text-accent-foreground border-border hover:border-primary/50",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-bold shadow-sm">
                          DG
                        </span>
                        Deepgram
                      </button>
                      <button
                        type="button"
                        onClick={() => setSttProvider("gemini")}
                        disabled={isRecording || isProcessing}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          "border-2 shadow-sm hover:shadow-md",
                          sttProvider === "gemini"
                            ? "bg-primary text-primary-foreground border-primary scale-105"
                            : "bg-background hover:bg-accent hover:text-accent-foreground border-border hover:border-primary/50",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 text-white text-xs font-bold shadow-sm">
                          G
                        </span>
                        Gemini
                      </button>
                    </div>
                  </div>
                </div>
                <VoiceButton
                  state={voiceState}
                  onPress={handleVoiceToggle}
                  disabled={isProcessing}
                  trailing="Voice Fill"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {currentDemo.fields.map((field, index) => {
                      // Determine if this field should take full width
                      const isFullWidth = field.type === "textarea" ||
                        field.type === "anomaly-detector" ||
                        (index >= 4 && currentDemo.fields[index - 1]?.type === "textarea")

                      return (
                        <FormField
                          key={field.name}
                          control={form.control}
                          name={field.name}
                          render={({ field: formField }) => (
                            <FormItem className={isFullWidth ? "sm:col-span-2" : ""}>
                              <FormLabel>{field.label}</FormLabel>
                              <FormControl>
                                {field.type === "anomaly-detector" ? (
                                  <AnomalyDetector
                                    onDetectionComplete={(results) => {
                                      formField.onChange(results)
                                    }}
                                  />
                                ) : field.type === "textarea" ? (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    {...formField}
                                  />
                                ) : (
                                  <Input
                                    placeholder={field.placeholder}
                                    {...formField}
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Error</p>
                          <p className="text-sm text-destructive/90">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 text-base font-medium">
                    {currentDemo.submitButtonText}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
