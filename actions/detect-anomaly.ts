"use server"

import { fal } from "@fal-ai/client"

// Configure fal.ai client
if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY environment variable is not set")
}

fal.config({
  credentials: process.env.FAL_KEY
})

export interface DetectedObject {
  x_min: number
  y_min: number
  x_max: number
  y_max: number
}

export interface AnomalyDetectionResult {
  objects: DetectedObject[]
  finish_reason: string
  usage_info?: {
    input_tokens: number
    output_tokens: number
    prefill_time_ms: number
    decode_time_ms: number
    ttft_ms: number
  }
}

export async function detectAnomalyAction(
  imageUrl: string,
  prompt: string = "anomaly"
): Promise<{ data?: AnomalyDetectionResult; error?: string }> {
  try {
    if (!imageUrl) {
      return { error: "No image provided" }
    }

    console.log("Starting anomaly detection with fal.ai...")
    console.log("Image URL:", imageUrl)
    console.log("Prompt:", prompt)

    const result = await fal.subscribe("fal-ai/moondream3-preview/detect", {
      input: {
        image_url: imageUrl,
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log)
        }
      },
    })

    console.log("Detection result:", result.data)

    return {
      data: result.data as AnomalyDetectionResult,
    }
  } catch (error) {
    console.error("Anomaly detection error:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to detect anomalies",
    }
  }
}
