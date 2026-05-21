"use client"

import * as React from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface IpadMockupProps {
  children: React.ReactNode
  className?: string
  /** max height of the screen viewport while docked; content scrolls inside */
  screenClassName?: string
  /** optional content shown in a slide-out panel (only in fullscreen) */
  sidePanel?: React.ReactNode
  /** controlled fullscreen state */
  expanded: boolean
  onExpandedChange: (v: boolean) => void
  /** controlled side-panel state */
  panelOpen: boolean
}

/**
 * Realistic, glossy iPad device frame. Children render inside the screen,
 * which scrolls internally. Clicking the device (bezel) animates it to a
 * near-fullscreen overlay. In fullscreen, an open side panel slides out to the
 * left and shifts the iPad to the right. Fullscreen + panel are controlled by
 * the parent so a button next to the form title can drive them.
 *
 * The DOM structure stays stable across docked/fullscreen (only classes change)
 * so the form and any child state are preserved.
 */
export function IpadMockup({
  children,
  className,
  screenClassName,
  sidePanel,
  expanded,
  onExpandedChange,
  panelOpen,
}: IpadMockupProps) {
  React.useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExpandedChange(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [expanded, onExpandedChange])

  return (
    <>
      <div
        className={cn("ipad-backdrop", expanded ? "ipad-backdrop--show" : "pointer-events-none opacity-0")}
        aria-hidden
      />

      {/* stage: display:contents while docked, fixed centered flex row in fullscreen */}
      <div
        className={expanded ? "ipad-stage" : "contents"}
        onClick={() => expanded && onExpandedChange(false)}
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
            if (!expanded) onExpandedChange(true)
            else e.stopPropagation()
          }}
        >
          <div className={cn("ipad-screen", expanded && "h-full")}>
            <div className="ipad-gloss" />

            {/* fullscreen toggle — on the iPad screen itself, top-right */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onExpandedChange(!expanded)
              }}
              aria-label={expanded ? "Exit fullscreen" : "Expand"}
              title={expanded ? "Exit fullscreen" : "Fullscreen"}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/85 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-accent hover:text-foreground"
            >
              {expanded ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
            </button>

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
