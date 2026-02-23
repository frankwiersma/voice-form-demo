"use server"

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
import { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api/types/SpeechToTextChunkResponseModel"
import { createClient } from "@deepgram/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"

import { doctorFormSchema, substationInspectionSchema } from "@/lib/schema"
import { DEMOS } from "@/lib/demos"

export type STTProvider = "elevenlabs" | "deepgram" | "gemini"

export interface ApiKeyOverrides {
  elevenlabs?: string
  deepgram?: string
  google?: string
}

export async function voiceToFormAction(
  audio: File,
  sttProvider: STTProvider = "elevenlabs",
  demoId: string = "medical-intake",
  keyOverrides?: ApiKeyOverrides
) {
  // Get the schema for the selected demo
  const demo = DEMOS.find(d => d.id === demoId)
  if (!demo) {
    return { data: {}, error: "Demo not found" }
  }

  const extractionSchema = demo.schema.partial()
  try {
    if (!audio) {
      return { data: {} }
    }

    // Prefer client-provided keys, fall back to server env vars
    const elevenLabsApiKey = keyOverrides?.elevenlabs || process.env.ELEVENLABS_API_KEY
    const deepgramApiKey = keyOverrides?.deepgram || process.env.DEEPGRAM_API_KEY
    const googleApiKey = keyOverrides?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY

    // Validate STT provider API keys
    if (sttProvider === "elevenlabs" && !elevenLabsApiKey) {
      console.warn("ElevenLabs API key not configured")
      return { data: {} }
    }

    if (sttProvider === "deepgram" && !deepgramApiKey) {
      console.warn("Deepgram API key not configured")
      return { data: {} }
    }

    if (sttProvider === "gemini" && !googleApiKey) {
      console.warn("Google Gemini API key not configured")
      return { data: {} }
    }

    if (!googleApiKey) {
      console.warn("Google Gemini API key not configured for extraction")
      return { data: {} }
    }

    const audioBuffer = await audio.arrayBuffer()
    let transcribedText = ""

    // Transcribe based on selected provider
    if (sttProvider === "elevenlabs") {
      console.log("Starting transcription with ElevenLabs...")
      const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey })
      const file = new File([audioBuffer], audio.name || "audio.webm", {
        type: audio.type || "audio/webm",
      })

      const transcriptionResult = await client.speechToText.convert({
        file,
        modelId: "scribe_v1",
        languageCode: "en",
      })

      transcribedText = (
        transcriptionResult as SpeechToTextChunkResponseModel
      ).text
    } else if (sttProvider === "deepgram") {
      console.log("Starting transcription with Deepgram...")
      const deepgram = createClient(deepgramApiKey!)

      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        Buffer.from(audioBuffer),
        {
          model: "nova-2",
          language: "en",
          smart_format: true,
        }
      )

      if (error) {
        console.error("Deepgram transcription error:", error)
        return { data: {} }
      }

      transcribedText =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
    } else if (sttProvider === "gemini") {
      console.log("Starting transcription with Google Gemini...")
      const genAI = new GoogleGenerativeAI(googleApiKey!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

      const result = await model.generateContent([
        {
          inlineData: {
            data: Buffer.from(audioBuffer).toString("base64"),
            mimeType: "audio/webm",
          },
        },
        "Transcribe this audio to text. Only return the transcription, nothing else.",
      ])

      transcribedText = result.response.text() || ""
    }

    console.log(`Transcribed text (${sttProvider}):`, transcribedText)

    if (!transcribedText) {
      return { data: {} }
    }

    const schemaShape = demo.schema.shape
    const fieldNames = Object.keys(schemaShape)

    // Generate field descriptions dynamically from demo config
    const fieldDescriptions = demo.fields.map(field => {
      return `- ${field.name}: ${field.label}`
    }).join('\n')

    // Generate extraction instructions based on demo type
    const extractionInstructions = demo.id === "medical-intake"
      ? `You are an expert medical transcriptionist and clinical documentation specialist. Extract structured patient information from natural speech.`
      : `You are an expert inspection report transcriptionist. Extract structured inspection information from natural speech about a substation routine inspection.`

    const systemPrompt = `${extractionInstructions}

FIELD EXTRACTION RULES:
${fieldDescriptions}

CONTEXTUAL INTELLIGENCE:
- Infer information from surrounding context
- Understand terminology and casual descriptions
- CRITICAL: If a field is not mentioned, DO NOT include it in the output at all. Do NOT use the word "undefined" or empty strings.
- Only include fields that have actual information extracted from the speech
- Extract EVERYTHING mentioned, reading between the lines for implicit information
- Be concise - do not repeat the same information multiple times`

    const userPrompt = `Extract data from this dictation. Be concise - extract each field ONCE only.

Dictation: "${transcribedText}"

Extract these fields (omit if not mentioned):
${fieldDescriptions}`

    let extractedData
    let modelUsed = "unknown"

    // Helper function to add timeout to promises
    const withTimeout = <T>(
      promise: Promise<T>,
      timeoutMs: number,
      errorMessage: string
    ): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        ),
      ])
    }

    // Use Google Gemini for extraction with direct SDK
    if (googleApiKey) {
      try {
        console.log("Extracting fields with Google Gemini Flash 2.5...")
        const genAI = new GoogleGenerativeAI(googleApiKey)
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2000, // Increased to prevent truncation
          }
        })

        // Generate JSON template from demo fields
        const jsonTemplate = demo.fields.reduce((acc, field) => {
          acc[field.name] = field.label.toLowerCase()
          return acc
        }, {} as Record<string, string>)

        const extractionPrompt = `Extract information from this dictation into valid JSON. Extract ALL fields mentioned.

Dictation: "${transcribedText}"

Return ONLY valid JSON with these fields (omit field entirely if not mentioned):
${JSON.stringify(jsonTemplate, null, 2)}

Important: Extract all information from the dictation. Infer context where appropriate.`

        const result = await withTimeout(
          model.generateContent(extractionPrompt),
          60000,
          "Google Gemini extraction timeout"
        )

        const responseText = result.response.text()
        console.log("Raw Gemini response:", responseText)

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = responseText.trim()
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '')
        }

        // Try to parse JSON, if truncated try to fix it
        try {
          extractedData = JSON.parse(jsonText)
        } catch (parseError) {
          console.warn("JSON parse error, attempting to repair:", parseError)
          // Try to close any open strings/objects
          let repairedJson = jsonText
          // If string is not closed, add closing quote
          const openQuotes = (repairedJson.match(/"/g) || []).length
          if (openQuotes % 2 !== 0) {
            repairedJson += '"'
          }
          // If object is not closed, add closing brace
          const openBraces = (repairedJson.match(/{/g) || []).length
          const closeBraces = (repairedJson.match(/}/g) || []).length
          if (openBraces > closeBraces) {
            repairedJson += '}'
          }
          try {
            extractedData = JSON.parse(repairedJson)
            console.log("✓ Repaired and parsed JSON successfully")
          } catch (repairError) {
            console.error("Could not repair JSON:", repairError)
            throw parseError // Throw original error
          }
        }

        modelUsed = "Google Gemini Flash 2.5"
        console.log("✓ Extracted data with Google Gemini")
      } catch (error) {
        console.error("Google Gemini extraction failed:", error)
        return { data: {}, error: "AI extraction failed. Please try again." }
      }
    } else {
      console.error("Google Gemini API key not configured")
      return { data: {} }
    }

    console.log("Extracted data using", modelUsed, ":", extractedData)

    // Filter out "undefined" strings and empty values
    const cleanedData: Record<string, string> = {}
    if (extractedData) {
      for (const [key, value] of Object.entries(extractedData)) {
        // Handle both strings and numbers (convert numbers to strings)
        if (value !== null && value !== undefined) {
          const stringValue = typeof value === "number" ? String(value) : value

          if (
            typeof stringValue === "string" &&
            stringValue.trim() !== "" &&
            stringValue.toLowerCase() !== "undefined" &&
            !stringValue.includes("undefined undefined")
          ) {
            cleanedData[key] = stringValue.trim()
          }
        }
      }
    }

    console.log("Cleaned data:", cleanedData)

    return {
      data: cleanedData,
      success: true,
    }
  } catch (error) {
    console.error("Voice to form error:", error)
    return {
      data: {},
      error: error instanceof Error ? error.message : "Failed to process audio",
      success: false,
    }
  }
}
