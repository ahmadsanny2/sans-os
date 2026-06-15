"use client"

import React, { useEffect } from "react"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { HabitGrid } from "@/components/habits/HabitGrid"
import { HabitRecaps } from "@/components/habits/HabitRecaps"
import { format, parseISO, addMonths, subMonths } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

export default function HabitsPage() {
  const activeDate = useWorkspaceStore((state) => state.activeDate)
  const setActiveDate = useWorkspaceStore((state) => state.setActiveDate)

  // Update document title for client-side SEO
  useEffect(() => {
    document.title = "Habit Tracker - SansOS Workspace"
  }, [])

  const baseDate = parseISO(activeDate)

  // Navigation handlers
  const handlePrevMonth = (): void => {
    const newDate = subMonths(baseDate, 1)
    setActiveDate(format(newDate, "yyyy-MM-dd"))
  }

  const handleNextMonth = (): void => {
    const newDate = addMonths(baseDate, 1)
    setActiveDate(format(newDate, "yyyy-MM-dd"))
  }

  const handleGoToToday = (): void => {
    setActiveDate(format(new Date(), "yyyy-MM-dd"))
  }

  const activeMonthFormatted = format(baseDate, "MMMM yyyy")

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4">
      {/* Top Navigation Control Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Habit Tracker
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-violet-500" />
            Active Month: <span className="font-semibold text-foreground">{activeMonthFormatted}</span>
          </p>
        </div>

        {/* Calendar Navigation Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handlePrevMonth}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous Month
          </button>
          
          <button
            onClick={handleGoToToday}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Go to today"
          >
            Today
          </button>

          <button
            onClick={handleNextMonth}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Next month"
          >
            Next Month
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recaps and Statistics Widgets */}
      <HabitRecaps />

      {/* Habit Matrix Grid Checklist */}
      <HabitGrid />
    </div>
  )
}
