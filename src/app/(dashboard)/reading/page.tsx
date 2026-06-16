"use client"

import React, { useEffect } from "react"
import { ReadingBoard } from "@/components/reading/ReadingBoard"
import { BookOpen } from "lucide-react"

export default function ReadingJournalPage() {
  // Update document title for client-side SEO
  useEffect(() => {
    document.title = "Reading Journal - SansOS Workspace"
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-4">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-violet-500 shrink-0" />
            Reading Journal
          </h1>
          <p className="text-sm text-muted-foreground">
            Log your reading lists, track book reviews, and manage key takeaways
          </p>
        </div>
      </div>

      {/* Main Board Workspace */}
      <ReadingBoard />
    </div>
  )
}
