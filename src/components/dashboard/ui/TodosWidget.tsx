"use client"

import React from "react"
import { DailyTodo } from "@/hooks/useDailyLogs"
import { ListTodo, Check } from "lucide-react"

interface TodosWidgetProps {
  todos: DailyTodo[]
  isLoading: boolean
  isError: boolean
  handleToggle: (id: string, completed: boolean) => void
  isPendingToggle: boolean
}

export function TodosWidget({
  todos,
  isLoading,
  isError,
  handleToggle,
  isPendingToggle,
}: TodosWidgetProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/25 dark:bg-card/10 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-sidebar-primary" />
          <h3 className="text-lg font-bold text-foreground">Daily Checklist</h3>
        </div>
        <span className="text-xs bg-secondary/80 px-2 py-0.5 rounded-full border border-border font-semibold text-muted-foreground flex items-center justify-center min-w-[50px] h-5">
          {isLoading ? (
            <span className="inline-block w-8 h-2.5 bg-muted/30 animate-pulse rounded" />
          ) : (
            `${todos.filter((t) => t.completed).length}/${todos.length} Done`
          )}
        </span>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2 pt-1">
            <div className="h-12 w-full bg-muted/20 animate-pulse rounded-xl" />
            <div className="h-12 w-full bg-muted/20 animate-pulse rounded-xl" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 py-8 text-center text-xs text-destructive font-semibold">
            Error loading checklist.
          </div>
        ) : todos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            No checklist items set for today.
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => !isPendingToggle && handleToggle(todo.id, todo.completed)}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200 bg-card hover:border-sidebar-primary/30 ${
                  todo.completed ? "opacity-75 border-border/50 bg-secondary/10" : "border-border shadow-sm"
                }`}
              >
                <button
                  type="button"
                  disabled={isPendingToggle}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    todo.completed
                      ? "bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground"
                      : "border-border hover:border-sidebar-primary/50"
                  }`}
                  aria-label="Toggle todo status"
                >
                  {todo.completed ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                </button>
                <span
                  className={`text-xs font-semibold truncate leading-tight ${
                    todo.completed ? "line-through text-muted-foreground font-normal" : "text-foreground"
                  }`}
                >
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
