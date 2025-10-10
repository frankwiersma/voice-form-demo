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
  imageDataOrUrl: string,
  prompt: string = "anomaly"
): Promise<{ data?: AnomalyDetectionResult; error?: string }> {
  try {
    if (!imageDataOrUrl) {
      return { error: "No image provided" }
    }

    console.log("Starting anomaly detection with fal.ai...")
    console.log("Prompt:", prompt)

    let imageUrl = imageDataOrUrl

    // If it's a data URI, upload it to fal.ai storage first
    if (imageDataOrUrl.startsWith("data:")) {
      console.log("Uploading image to fal.ai storage...")
      try {
        // Convert data URI to blob
        const response = await fetch(imageDataOrUrl)
        const blob = await response.blob()

        // Upload to fal.ai storage
        imageUrl = await fal.storage.upload(blob)
        console.log("Image uploaded to:", imageUrl)
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError)
        return { error: "Failed to upload image to storage" }
      }
    }

    // Add timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Detection timed out after 60 seconds")), 60000)
    )

    const detectionPromise = fal.subscribe("fal-ai/moondream3-preview/detect", {
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

    const result = await Promise.race([detectionPromise, timeoutPromise])

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
