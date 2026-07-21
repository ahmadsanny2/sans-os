"use client"

import React, { useEffect } from "react"
import { usePomodoroPage } from "@/hooks/usePomodoroPage"
import { PomodoroTimerView } from "./ui/PomodoroTimerView"

export default function PomodoroComponent() {
  const pageData = usePomodoroPage()

  useEffect(() => {
    document.title = "Pomodoro Focus — SansOS Workspace"
  }, [])

  return <PomodoroTimerView {...pageData} />
}
