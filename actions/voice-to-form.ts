"use server"

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
import { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api/types/SpeechToTextChunkResponseModel"
import { createClient } from "@deepgram/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"

import { doctorFormSchema } from "@/lib/schema"

const extractionSchema = doctorFormSchema.partial()

export type STTProvider = "elevenlabs" | "deepgram" | "gemini"

export async function voiceToFormAction(
  audio: File,
  sttProvider: STTProvider = "elevenlabs"
) {
  try {
    if (!audio) {
      return { data: {} }
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

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

    const schemaShape = doctorFormSchema.shape
    const fieldNames = Object.keys(schemaShape)

    const systemPrompt = `You are an expert medical transcriptionist and clinical documentation specialist. Your job is to extract structured patient information from a doctor's natural speech, understanding both explicit statements and implicit contextual information.

FIELD EXTRACTION RULES:

1. **patientName**: Extract the patient's full name from any mention
   - Listen for: "patient is...", "this is...", "patient's name is...", "I have [name]", "seeing [name]"
   - Examples: "patient John Doe" → "John Doe", "seeing Sarah Smith today" → "Sarah Smith"

2. **age**: Extract patient's age as a number only
   - Listen for: "[number] years old", "age [number]", "[number] year old patient"
   - Examples: "28 years old" → "28", "patient is 45" → "45"

3. **gender**: Intelligently infer from ANY contextual clue:
   - Pronouns: he/him/his → "male", she/her/hers → "female"
   - Explicit: male/female/man/woman/boy/girl → use appropriate gender
   - Names: Use common name patterns if obvious (John → male, Sarah → female)
   - Titles: Mr. → "male", Ms./Mrs. → "female"

4. **chiefComplaint**: The PRIMARY medical concern/reason for visit
   - This is the MAIN problem, not all symptoms
   - Listen for: "complaining of...", "presenting with...", "came in for...", "has...", "problem is..."
   - Phrases like "stomach pain", "headache", "chest pain", "cough" are chief complaints
   - Examples: "has stomach pain" → "stomach pain", "presenting with headache" → "headache"
   - Look for pain, discomfort, or primary medical issues mentioned FIRST or with emphasis

5. **symptoms**: ALL symptoms and clinical observations mentioned
   - This is a comprehensive list, separate from chief complaint
   - Include: pain descriptions, duration, severity, associated symptoms
   - Examples: "severe headache for 3 days with nausea", "fever and chills"

6. **medicalHistory**: Past medical conditions, surgeries, chronic diseases
   - Listen for: "history of...", "past...", "previously had...", "diagnosed with..."
   - Examples: "history of diabetes", "had appendectomy"

7. **allergies**: Any allergies mentioned (medication, food, environmental)
   - Listen for: "allergic to...", "allergy to...", "has allergies..."
   - Include: drug allergies, hay fever, food allergies, etc.

8. **currentMedications**: Current medications patient is taking
   - Listen for: "taking...", "on...", "medication...", "prescribed..."
   - Examples: "takes vitamin D", "on insulin"

CONTEXTUAL INTELLIGENCE:
- Infer information from surrounding context
- A symptom mentioned first is often the chief complaint
- If someone says "he has stomach pain", extract: chiefComplaint="stomach pain", gender="male", symptoms="stomach pain"
- Understand medical terminology and casual descriptions
- Use clinical judgment to categorize information appropriately
- CRITICAL: If a field is not mentioned, DO NOT include it in the output at all. Do NOT use the word "undefined" or empty strings.
- Only include fields that have actual information extracted from the speech
- Extract EVERYTHING mentioned, reading between the lines for implicit information
- Be concise - do not repeat the same information multiple times`

    const userPrompt = `Extract patient data from this medical dictation. Be concise - extract each field ONCE only.

Dictation: "${transcribedText}"

Extract these fields (omit if not mentioned):
- patientName: full name
- age: number only
- gender: "male" if he/him/his, "female" if she/her/hers
- chiefComplaint: main problem
- symptoms: clinical observations
- medicalHistory: past conditions
- allergies: allergy list
- currentMedications: current meds`

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

        const extractionPrompt = `Extract patient information from this medical dictation into valid JSON. Extract ALL fields mentioned.

Dictation: "${transcribedText}"

Return ONLY valid JSON with these fields (omit field entirely if not mentioned):
{
  "patientName": "full name",
  "age": "number only",
  "gender": "male or female",
  "chiefComplaint": "main problem",
  "symptoms": "all symptoms",
  "medicalHistory": "past conditions",
  "allergies": "allergies",
  "currentMedications": "medications"
}

Important: Extract gender from pronouns (he/him=male, she/her=female), age from any mention of years old, medications from "takes" or "on", allergies from "allergic to".`

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
