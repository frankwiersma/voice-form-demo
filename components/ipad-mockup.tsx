"use client"

import * as React from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface IpadMockupProps {
  children: React.ReactNode
  className?: string
  /** max height of the screen viewport while docked; content scrolls inside */
  screenClassName?: string
}

/**
 * Realistic, glossy iPad device frame. Children render inside the screen,
 * which scrolls internally. Clicking the device (bezel) or the expand button
 * animates it to a near-fullscreen overlay — bezels stay visible and the app
 * remains faintly visible behind a translucent backdrop.
 */
export function IpadMockup({ children, className, screenClassName }: IpadMockupProps) {
  const [expanded, setExpanded] = React.useState(false)

  React.useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [expanded])

  return (
    <>
      {/* translucent backdrop — app stays faintly visible behind */}
      <div
        className={cn("ipad-backdrop", expanded ? "ipad-backdrop--show" : "pointer-events-none opacity-0")}
        onClick={() => setExpanded(false)}
        aria-hidden
      />

      <div
        className={cn("ipad-frame", expanded ? "ipad-frame--expanded" : "w-full cursor-zoom-in", className)}
        onClick={() => !expanded && setExpanded(true)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          aria-label={expanded ? "Exit fullscreen" : "Expand"}
          className="absolute right-4 top-1.5 z-30 rounded-full bg-white/15 p-1 text-white/80 backdrop-blur transition hover:bg-white/30 hover:text-white"
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        <div className={cn("ipad-screen", expanded && "h-full")}>
          <div className="ipad-gloss" />
          {/* stop screen clicks from toggling the device */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "ipad-scroll relative z-10 cursor-auto overflow-y-auto overscroll-contain",
              expanded ? "h-full" : screenClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
