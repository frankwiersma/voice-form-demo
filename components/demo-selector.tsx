"use client"

import { cn } from "@/lib/utils"
import { DemoConfig } from "@/lib/demos"

interface DemoSelectorProps {
  demos: DemoConfig[]
  selectedDemoId: string
  onSelectDemo: (demoId: string) => void
}

export function DemoSelector({ demos, selectedDemoId, onSelectDemo }: DemoSelectorProps) {
  return (
    <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">Demos</h2>
        <p className="text-sm text-muted-foreground">Select a form demo</p>
      </div>

      <div className="space-y-2">
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => onSelectDemo(demo.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-all duration-200",
              "border-2 hover:shadow-md",
              selectedDemoId === demo.id
                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
                : "bg-card hover:bg-accent border-border hover:border-primary/30"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{demo.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm",
                  selectedDemoId === demo.id ? "text-primary-foreground" : "text-foreground"
                )}>
                  {demo.title}
                </div>
                <div className={cn(
                  "text-xs mt-0.5",
                  selectedDemoId === demo.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {demo.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
