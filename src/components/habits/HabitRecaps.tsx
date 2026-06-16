"use client"

import React from "react"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useHabitsQuery, useHabitStatsQuery } from "@/hooks/useHabits"
import { format, parseISO, startOfWeek, addDays, getDaysInMonth, startOfMonth, endOfMonth } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Activity, Award, CalendarDays, Percent, Trophy, Zap, Sparkles } from "lucide-react"

// Types
interface ChartDataPoint {
  dayLabel: string
  completions: number
}

export function HabitRecaps() {
  const activeDate = useWorkspaceStore((state) => state.activeDate)
  const userConfig = useWorkspaceStore((state) => state.userConfig)

  const baseDate = parseISO(activeDate)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: userConfig.startOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Calculate Active Month boundaries (to match HabitGrid query range exactly)
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)
  const startDateStr = format(monthStart, "yyyy-MM-dd")
  const endDateStr = format(monthEnd, "yyyy-MM-dd")

  const { data: monthlyData } = useHabitsQuery(startDateStr, endDateStr)

  // Calculate Active Month stats
  const currentMonthStr = activeDate.substring(0, 7) // "YYYY-MM"
  const { data: monthlyStats, isLoading: statsLoading } = useHabitStatsQuery(currentMonthStr)

  // Prepare weekly chart data from monthlyData logs in-memory
  const chartData: ChartDataPoint[] = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const completions = monthlyData?.logs.filter((l) => l.date === dayStr && l.status === "completed").length || 0
    return {
      dayLabel: format(day, "EEE"),
      completions,
    }
  })

  // Calculate monthly metrics
  const daysInMonth = getDaysInMonth(baseDate)
  const totalHabits = monthlyStats?.totalHabits || 0
  const completedLogsCount = monthlyStats?.completedCount || 0
  const totalTargetOpportunity = totalHabits * daysInMonth
  const successRate = totalTargetOpportunity > 0 
    ? Math.round((completedLogsCount / totalTargetOpportunity) * 100) 
    : 0

  // Calculate best performing habit in-memory
  const habitCompletionCounts: Record<string, number> = {}
  monthlyData?.logs.forEach((log) => {
    if (log.status === "completed") {
      habitCompletionCounts[log.habitId] = (habitCompletionCounts[log.habitId] || 0) + 1
    }
  })

  let bestHabitName = "None"
  let bestHabitCount = 0

  if (monthlyData?.habits) {
    for (const habit of monthlyData.habits) {
      const count = habitCompletionCounts[habit.id] || 0
      if (count > bestHabitCount) {
        bestHabitCount = count
        bestHabitName = habit.name
      }
    }
  }

  // Calculate best performing day of week in-memory
  const weekdayCompletionCounts: Record<string, number> = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
  }
  monthlyData?.logs.forEach((log) => {
    if (log.status === "completed") {
      try {
        const dayLabel = format(parseISO(log.date), "EEE")
        if (weekdayCompletionCounts[dayLabel] !== undefined) {
          weekdayCompletionCounts[dayLabel]++
        }
      } catch {
        // ignore invalid dates
      }
    }
  })

  let bestDayName = "N/A"
  let bestDayCount = 0
  Object.entries(weekdayCompletionCounts).forEach(([day, count]) => {
    if (count > bestDayCount) {
      bestDayCount = count
      bestDayName = day
    }
  })

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* 1. Monthly Statistics Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-card/50 flex flex-col justify-between">
        <h4 className="text-sm font-bold tracking-wider text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-500" />
          MONTHLY RECAP
        </h4>
        
        {statsLoading ? (
          <div className="flex-1 flex items-center justify-center py-6 text-xs text-muted-foreground">
            Calculating statistics...
          </div>
        ) : (
          <div className="mt-4 space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" /> Total Habits
              </span>
              <span className="text-lg font-bold text-foreground">{totalHabits}</span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" /> Total Check-ins
              </span>
              <span className="text-lg font-bold text-foreground">{completedLogsCount} times</span>
            </div>

            <div className="flex items-center justify-between pb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4 text-purple-500" /> Success Rate
              </span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {successRate}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Monthly Insights Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-card/50 flex flex-col justify-between">
        <h4 className="text-sm font-bold tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-purple-500" />
          MONTHLY INSIGHTS
        </h4>
        
        {statsLoading ? (
          <div className="flex-1 flex items-center justify-center py-6 text-xs text-muted-foreground">
            Analyzing trends...
          </div>
        ) : (
          <div className="mt-4 space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex flex-col border-b border-border/40 pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Best Habit
              </span>
              <span className="text-sm font-bold text-foreground mt-1 truncate max-w-[180px]">
                {bestHabitName} {bestHabitCount > 0 ? `(${bestHabitCount}x)` : ""}
              </span>
            </div>

            <div className="flex flex-col pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-purple-500" /> Most Active Day
              </span>
              <span className="text-sm font-bold text-foreground mt-1">
                {bestDayCount > 0 ? `${bestDayName} (${bestDayCount} check-ins)` : "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Weekly Consistency Chart */}
      <div className="col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-card/50">
        <div className="mb-4">
          <h4 className="text-sm font-bold tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            WEEKLY CONSISTENCY TREND
          </h4>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis 
                dataKey="dayLabel" 
                tickLine={false} 
                className="text-[10px] fill-muted-foreground font-semibold"
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                className="text-[10px] fill-muted-foreground font-semibold"
              />
              <Tooltip 
                cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              />
              <Bar 
                dataKey="completions" 
                name="Successful Check-ins" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

