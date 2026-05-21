"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface IpadMockupProps {
  children: React.ReactNode
  className?: string
  /** max height of the screen viewport; content scrolls inside */
  screenClassName?: string
}

/**
 * Realistic, glossy iPad device frame. Children render inside the screen,
 * which scrolls internally so the device keeps a fixed footprint.
 */
export function IpadMockup({ children, className, screenClassName }: IpadMockupProps) {
  return (
    <div className={cn("ipad-frame w-full", className)}>
      <div className="ipad-screen">
        <div className="ipad-gloss" />
        <div
          className={cn(
            "ipad-scroll relative z-10 overflow-y-auto overscroll-contain",
            screenClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
