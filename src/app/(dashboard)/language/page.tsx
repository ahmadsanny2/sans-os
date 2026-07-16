import React, { Suspense } from "react"
import LanguageComponent from "@/components/language/page"

export default function LanguagePage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center p-8 text-muted-foreground text-sm font-semibold animate-pulse">Loading Language Logs...</div>}>
      <LanguageComponent />
    </Suspense>
  )
}
