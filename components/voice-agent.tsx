"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X, Mic, PhoneOff, Loader2, Bot, AudioLines } from "lucide-react"
import { getKey } from "@/lib/apiKeys"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/i18n"

const GREETING =
  "Hoi, ik ben Tenny, je offshore onderhoudsassistent. Je kunt Nederlands, Engels of Duits met me praten. Waar sta je en wat zie je?"

const TENNY_PROMPT = `You are Tenny, TenneT's offshore substation maintenance assistant. You support field engineers who talk to you hands-free by voice while inspecting high-voltage equipment on offshore platforms.

# Output style (voice)
- Your replies are spoken aloud: be concise, calm and clear. 1–2 short sentences unless more detail is needed.
- No markdown, no lists with symbols. Speak naturally.
- Reply in the SAME language the engineer uses. Support Dutch, English and German, and switch or translate on request.

# Priorities (in order)
1. Personal safety of the engineer and crew.
2. Asset integrity and grid reliability.
3. Accurate, structured documentation.

# Behaviour
- Lead with any safety-critical flag the moment you detect it, before follow-up questions.
- Anchor observations to an asset: ask for the equipment ID early.
- Gather observations one topic at a time (voice-friendly): pressure, then temperature, then sounds, then smells, then visual cues. If the engineer loses track, briefly restate what you still need.
- Compare each reading to the normal operating range and say clearly whether it is low, normal or high, with the range.
- Normalise spoken values ("two point two bar" -> "2.2 bar"; "eighty degrees" -> "80 degrees Celsius").
- Read back a short summary before finalising; ask the engineer to confirm.
- Offer to create an incident report, classify the risk and keep the engineer updated.

# Safety knowledge
- For suspected gas leaks (e.g. SF6): SF6 displaces oxygen (asphyxiant) and arc by-products are toxic. Tell the engineer to step back, ensure ventilation, and avoid enclosed pockets BEFORE further diagnosis.
- Typical SF6 gas-insulated equipment runs around 3.0 to 3.5 bar; a reading near 2.2 bar is low and suggests a leak.
- Never instruct the engineer to perform live-equipment or specialist repairs themselves; recommend qualified personnel and escalate high-risk situations.

# Incident report fields (when asked)
Subject, site/asset ID, observations (each with normal range + status), suspected cause, immediate action taken, recommended action, risk and impact (Low/Medium/High), follow-up.

# Risk classification
High: hazard to people, toxic/explosive release, or imminent failure of critical equipment. Medium: degraded performance without immediate hazard. Low: minor, monitor next round.

Be a knowledgeable colleague, not a manual. When unsure, say so and err toward caution.`

type Status = "idle" | "connecting" | "live" | "error"
interface Turn {
  role: "user" | "assistant"
  text: string
}

const STR: Record<Lang, Record<string, string>> = {
  nl: {
    title: "Tenny — spraakassistent",
    subtitle: "Offshore onderhoudsondersteuning",
    start: "Gesprek starten",
    stop: "Beëindigen",
    connecting: "Verbinden…",
    listening: "Luistert…",
    speaking: "Tenny spreekt…",
    needKey: "Stel eerst je Deepgram-sleutel in via Instellingen.",
    openSettings: "Open instellingen",
    hint: "Praat hands-free met Tenny over je inspectie. Spreek Nederlands, Engels of Duits.",
    micDenied: "Microfoontoegang geweigerd.",
    you: "Jij",
  },
  en: {
    title: "Tenny — voice assistant",
    subtitle: "Offshore maintenance support",
    start: "Start conversation",
    stop: "End",
    connecting: "Connecting…",
    listening: "Listening…",
    speaking: "Tenny is speaking…",
    needKey: "Set your Deepgram key in Settings first.",
    openSettings: "Open settings",
    hint: "Talk hands-free with Tenny about your inspection. Speak Dutch, English or German.",
    micDenied: "Microphone permission denied.",
    you: "You",
  },
}

interface Props {
  open: boolean
  onClose: () => void
  onNeedKey: () => void
  lang: Lang
}

export function VoiceAgent({ open, onClose, onNeedKey, lang }: Props) {
  const t = STR[lang]
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const [turns, setTurns] = useState<Turn[]>([])
  const [agentSpeaking, setAgentSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const playCtxRef = useRef<AudioContext | null>(null)
  const procRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nextPlayRef = useRef(0)
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])
  const keepAliveRef = useRef<number | null>(null)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  const stop = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
    sourcesRef.current.forEach((s) => {
      try {
        s.stop()
      } catch {}
    })
    sourcesRef.current = []
    nextPlayRef.current = 0
    if (procRef.current) {
      procRef.current.disconnect()
      procRef.current.onaudioprocess = null
      procRef.current = null
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    micCtxRef.current?.close().catch(() => {})
    micCtxRef.current = null
    playCtxRef.current?.close().catch(() => {})
    playCtxRef.current = null
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }
    setAgentSpeaking(false)
    setStatus("idle")
  }, [])

  const start = useCallback(async () => {
    const key = getKey("deepgram")
    if (!key) {
      onNeedKey()
      return
    }
    setError("")
    setTurns([])
    setStatus("connecting")

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      setError(t.micDenied)
      setStatus("error")
      return
    }
    streamRef.current = stream

    const micCtx = new AudioContext()
    micCtxRef.current = micCtx
    const inputRate = Math.round(micCtx.sampleRate)
    const playCtx = new AudioContext()
    playCtxRef.current = playCtx
    nextPlayRef.current = 0

    // Prefer a short-lived server token; fall back to the BYOK key (sent to Deepgram directly).
    let protocols: string[] = ["token", key]
    try {
      const r = await fetch("/api/deepgram-token", { method: "POST" })
      const j = await r.json()
      if (j?.mode === "bearer" && j.token) protocols = ["bearer", j.token]
    } catch {}

    const playChunk = (buf: ArrayBuffer) => {
      const ctx = playCtxRef.current
      if (!ctx) return
      const i16 = new Int16Array(buf)
      if (!i16.length) return
      const f32 = new Float32Array(i16.length)
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768
      const audioBuf = ctx.createBuffer(1, f32.length, 24000)
      audioBuf.copyToChannel(f32, 0)
      const src = ctx.createBufferSource()
      src.buffer = audioBuf
      src.connect(ctx.destination)
      const startAt = Math.max(ctx.currentTime, nextPlayRef.current)
      src.start(startAt)
      nextPlayRef.current = startAt + audioBuf.duration
      sourcesRef.current.push(src)
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src)
      }
    }

    const flushPlayback = () => {
      sourcesRef.current.forEach((s) => {
        try {
          s.stop()
        } catch {}
      })
      sourcesRef.current = []
      nextPlayRef.current = 0
    }

    const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", protocols)
    ws.binaryType = "arraybuffer"
    wsRef.current = ws

    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") {
        playChunk(ev.data as ArrayBuffer)
        return
      }
      let msg: { type: string; [k: string]: unknown }
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      switch (msg.type) {
        case "Welcome":
          ws.send(
            JSON.stringify({
              type: "Settings",
              audio: {
                input: { encoding: "linear16", sample_rate: inputRate },
                output: { encoding: "linear16", sample_rate: 24000, container: "none" },
              },
              agent: {
                listen: { provider: { type: "deepgram", version: "v2", model: "flux-general-multi" } },
                think: { provider: { type: "google", model: "gemini-3-flash-preview" }, prompt: TENNY_PROMPT },
                speak: {
                  provider: { type: "eleven_labs", model_id: "eleven_multilingual_v2", voice_id: "DtsPFCrhbCbbJkwZsb3d" },
                },
                greeting: GREETING,
              },
            })
          )
          break
        case "SettingsApplied": {
          const source = micCtx.createMediaStreamSource(stream)
          const proc = micCtx.createScriptProcessor(4096, 1, 1)
          procRef.current = proc
          proc.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return
            const input = e.inputBuffer.getChannelData(0)
            const i16 = new Int16Array(input.length)
            for (let i = 0; i < input.length; i++) {
              const s = Math.max(-1, Math.min(1, input[i]))
              i16[i] = s < 0 ? s * 32768 : s * 32767
            }
            ws.send(i16.buffer)
          }
          const mute = micCtx.createGain()
          mute.gain.value = 0
          source.connect(proc)
          proc.connect(mute)
          mute.connect(micCtx.destination)
          setStatus("live")
          break
        }
        case "ConversationText":
          setTurns((prev) => [...prev, { role: msg.role as "user" | "assistant", text: String(msg.content || "") }])
          break
        case "UserStartedSpeaking":
          flushPlayback()
          setAgentSpeaking(false)
          break
        case "AgentStartedSpeaking":
          setAgentSpeaking(true)
          break
        case "AgentAudioDone":
          setAgentSpeaking(false)
          break
        case "Error":
          setError(String(msg.description || "Agent error"))
          setStatus("error")
          break
      }
    }
    ws.onerror = () => {
      setError("Connection error")
      setStatus("error")
    }
    ws.onclose = () => {
      if (procRef.current) {
        procRef.current.disconnect()
        procRef.current.onaudioprocess = null
        procRef.current = null
      }
    }
    keepAliveRef.current = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "KeepAlive" }))
    }, 8000)
  }, [onNeedKey, t.micDenied])

  // auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" })
  }, [turns])

  // stop when the modal closes / unmounts
  useEffect(() => {
    if (!open) stop()
    return () => stop()
  }, [open, stop])

  if (!open) return null

  const live = status === "live"
  const statusLabel =
    status === "connecting" ? t.connecting : agentSpeaking ? t.speaking : live ? t.listening : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#001e50]/95" onClick={onClose} />

      <div className="relative flex h-[80vh] max-h-[640px] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl dark:border-[#1d4a96] dark:bg-[#072a66]">
        {/* Header */}
        <div className="tennet-header flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Bot className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">{t.title}</h2>
              <p className="text-xs text-[#a0c4e8]">{t.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transcript */}
        <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {turns.length === 0 && status !== "live" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{t.hint}</p>
          )}
          {turns.map((turn, i) => (
            <div key={i} className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  turn.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                )}
              >
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide opacity-60">
                  {turn.role === "user" ? t.you : "Tenny"}
                </span>
                {turn.text}
              </div>
            </div>
          ))}
        </div>

        {/* Status + controls */}
        <div className="border-t border-border px-5 py-4">
          {error && <p className="mb-2 text-center text-sm text-destructive">{error}</p>}
          {statusLabel && !error && (
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              {agentSpeaking ? (
                <AudioLines className="h-3.5 w-3.5 text-[#3c8cfa]" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6428] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6428]" />
                </span>
              )}
              {statusLabel}
            </p>
          )}

          {!live && status !== "connecting" ? (
            <button
              onClick={start}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6428] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#e85718]"
            >
              <Mic className="h-4 w-4" />
              {t.start}
            </button>
          ) : status === "connecting" ? (
            <button
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white opacity-80"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.connecting}
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              <PhoneOff className="h-4 w-4" />
              {t.stop}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
