"use client"

import { useCallback, useState, useRef } from "react"
import { Upload, Loader2, AlertCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { detectAnomalyAction, DetectedObject } from "@/actions/detect-anomaly"

interface AnomalyDetectorProps {
  onDetectionComplete?: (results: string) => void
}

export function AnomalyDetector({ onDetectionComplete }: AnomalyDetectorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [detectionResults, setDetectionResults] = useState<DetectedObject[] | null>(null)
  const [error, setError] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const drawBoundingBoxes = useCallback((image: HTMLImageElement, objects: DetectedObject[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match image
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    // Draw the image
    ctx.drawImage(image, 0, 0)

    // Draw bounding boxes
    objects.forEach((obj, index) => {
      const x_min = obj.x_min * canvas.width
      const y_min = obj.y_min * canvas.height
      const x_max = obj.x_max * canvas.width
      const y_max = obj.y_max * canvas.height
      const width = x_max - x_min
      const height = y_max - y_min

      // Draw box
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.strokeRect(x_min, y_min, width, height)

      // Draw label background
      const label = `Anomaly ${index + 1}`
      ctx.font = "16px sans-serif"
      const textMetrics = ctx.measureText(label)
      const textHeight = 20
      const padding = 4

      ctx.fillStyle = "#ef4444"
      ctx.fillRect(
        x_min,
        y_min - textHeight - padding,
        textMetrics.width + padding * 2,
        textHeight + padding
      )

      // Draw label text
      ctx.fillStyle = "#ffffff"
      ctx.fillText(label, x_min + padding, y_min - padding)
    })
  }, [])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError("")
    setDetectionResults(null)

    try {
      // Convert file to base64 data URI
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        setUploadedImage(dataUrl)

        // Create an image element to get dimensions
        const img = new Image()
        img.onload = async () => {
          imageRef.current = img

          // Call the detection API
          const result = await detectAnomalyAction(dataUrl, "anomaly")

          if (result.error) {
            setError(result.error)
            setIsProcessing(false)
            return
          }

          if (result.data?.objects && result.data.objects.length > 0) {
            const detectedObjects = result.data.objects
            setDetectionResults(detectedObjects)

            // Draw bounding boxes
            setTimeout(() => {
              drawBoundingBoxes(img, detectedObjects)
            }, 100)

            // Format results for form field
            const resultsText = `Detected ${detectedObjects.length} anomalies:\n` +
              detectedObjects.map((obj, i) =>
                `${i + 1}. Location: (${(obj.x_min * 100).toFixed(1)}%, ${(obj.y_min * 100).toFixed(1)}%) to (${(obj.x_max * 100).toFixed(1)}%, ${(obj.y_max * 100).toFixed(1)}%)`
              ).join('\n')

            onDetectionComplete?.(resultsText)
          } else {
            const noAnomaliesText = "No anomalies detected in the image."
            onDetectionComplete?.(noAnomaliesText)
          }

          setIsProcessing(false)
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Image processing error:", err)
      setError(err instanceof Error ? err.message : "Failed to process image")
      setIsProcessing(false)
    }
  }, [drawBoundingBoxes, onDetectionComplete])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      processImage(file)
    } else {
      setError("Please upload an image file")
    }
  }, [processImage])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }, [processImage])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="anomaly-image-upload"
          disabled={isProcessing}
        />

        <label
          htmlFor="anomaly-image-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Detecting anomalies...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop an image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Upload inspection photos to detect anomalies automatically
              </p>
            </>
          )}
        </label>
      </div>

      {/* Error Display */}
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

      {/* Results Display */}
      {uploadedImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Detection Results:</p>
            {detectionResults && (
              <div className="flex items-center gap-1 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {detectionResults.length} anomal{detectionResults.length === 1 ? 'y' : 'ies'} detected
                </span>
              </div>
            )}
          </div>

          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ display: detectionResults ? 'block' : 'none' }}
            />
            {!detectionResults && uploadedImage && (
              <img
                src={uploadedImage}
                alt="Uploaded inspection"
                className="w-full h-auto"
              />
            )}
          </div>

          {detectionResults && detectionResults.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Detected locations:</p>
              {detectionResults.map((obj, i) => (
                <p key={i}>
                  {i + 1}. X: {(obj.x_min * 100).toFixed(1)}% - {(obj.x_max * 100).toFixed(1)}%,
                  Y: {(obj.y_min * 100).toFixed(1)}% - {(obj.y_max * 100).toFixed(1)}%
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
