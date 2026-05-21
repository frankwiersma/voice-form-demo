"use client"

import * as React from "react"
import { Maximize2, Minimize2, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface IpadMockupProps {
  children: React.ReactNode
  className?: string
  /** max height of the screen viewport while docked; content scrolls inside */
  screenClassName?: string
  /** optional content shown in a slide-out panel (only in fullscreen, via the lightbulb) */
  sidePanel?: React.ReactNode
}

/**
 * Realistic, glossy iPad device frame. Children render inside the screen,
 * which scrolls internally. Clicking the device (bezel) animates it to a
 * near-fullscreen overlay. In fullscreen, a lightbulb button slides a side
 * panel out to the left and shifts the iPad to the right.
 *
 * The DOM structure is kept stable across docked/fullscreen (only classes
 * change) so the form and any child state are preserved.
 */
export function IpadMockup({ children, className, screenClassName, sidePanel }: IpadMockupProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [panelOpen, setPanelOpen] = React.useState(false)

  React.useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [expanded])

  // reset the side panel whenever we leave fullscreen
  React.useEffect(() => {
    if (!expanded) setPanelOpen(false)
  }, [expanded])

  return (
    <>
      {/* translucent backdrop — app stays faintly visible behind */}
      <div
        className={cn("ipad-backdrop", expanded ? "ipad-backdrop--show" : "pointer-events-none opacity-0")}
        aria-hidden
      />

      {/* stage: a no-op (display:contents) while docked, a fixed centered flex row in fullscreen */}
      <div
        className={expanded ? "ipad-stage" : "contents"}
        onClick={() => expanded && setExpanded(false)}
      >
        {sidePanel && (
          <aside
            className={cn("ipad-side-panel", expanded && panelOpen ? "ipad-side-panel--open" : "", !expanded && "hidden")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ipad-side-panel-inner">{sidePanel}</div>
          </aside>
        )}

        <div
          className={cn("ipad-frame", expanded ? "ipad-frame--expanded" : "w-full cursor-zoom-in", className)}
          onClick={(e) => {
            if (!expanded) setExpanded(true)
            else e.stopPropagation()
          }}
        >
          {/* lightbulb — only in fullscreen, toggles the side panel */}
          {expanded && sidePanel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPanelOpen((v) => !v)
              }}
              aria-label="Toggle example script"
              aria-pressed={panelOpen}
              className={cn(
                "absolute left-4 top-1.5 z-30 rounded-full p-1 backdrop-blur transition",
                panelOpen ? "bg-[#ff6428] text-white" : "bg-white/15 text-white/80 hover:bg-white/30 hover:text-white"
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
            </button>
          )}

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
      </div>
    </>
  )
}
