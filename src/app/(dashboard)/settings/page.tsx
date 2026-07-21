import { Suspense } from "react"
import { SettingsComponent } from "@/components/settings/page"

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading settings...</div>}>
      <SettingsComponent />
    </Suspense>
  )
}
