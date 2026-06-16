"use client"

import React, { useEffect } from "react"
import { LanguageBoard } from "@/components/language/LanguageBoard"
import { Languages } from "lucide-react"

export default function LanguageLogsPage() {
  // Update document title for client-side SEO
  useEffect(() => {
    document.title = "Language Logs - SansOS Workspace"
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-4">
      {/* Header section */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-2 pb-6 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Languages className="h-7 w-7 text-violet-500 shrink-0" />
            Language Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Track vocabulary words, definitions, translations, and mastery levels
          </p>
        </div>
      </div>

      {/* Main Board Workspace */}
      <LanguageBoard />
    </div>
  )
}
