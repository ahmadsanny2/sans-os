"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DashboardWidgetProps {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function DashboardWidget({
  title,
  description,
  href,
  icon: Icon,
}: DashboardWidgetProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sidebar-primary/50 hover:shadow-md dark:bg-card/50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-secondary p-2.5 text-foreground transition-colors group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-sidebar-primary truncate">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-sidebar-primary shrink-0 ml-1" />
      </div>
      <Link href={href} className="absolute inset-0" aria-label={`Go to ${title}`} />
    </div>
  )
}
