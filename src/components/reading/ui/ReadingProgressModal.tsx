"use client"

import React, { useState } from "react"
import {
  ReadingItem,
  useReadingProgressLogsQuery,
  useAddReadingProgressMutation,
  useDeleteReadingProgressMutation,
} from "@/hooks/useReading"
import { Modal } from "@/components/ui/Modal"
import { formatDate } from "@/hooks/useReadingPage"
import { confirmDestructive, showSuccessToast } from "@/lib/sweetalert"
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  AlertCircle,
  Calendar,
  FileText,
} from "lucide-react"

interface ReadingProgressModalProps {
  book: ReadingItem | null
  onClose: () => void
}

export function ReadingProgressModal({ book, onClose }: ReadingProgressModalProps) {
  const bookId = book?.id || null
  const { data: logs = [], isLoading, isError } = useReadingProgressLogsQuery(bookId)
  const addProgressMutation = useAddReadingProgressMutation()
  const deleteProgressMutation = useDeleteReadingProgressMutation(bookId)

  const [progressInput, setProgressInput] = useState("")
  const [notesInput, setNotesInput] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!book) return null

  const handleAddProgress = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErrorMsg(null)

    if (!progressInput.trim()) {
      setErrorMsg("Please enter progress value (e.g. Hal. 120 or +20 hal).")
      return
    }

    try {
      await addProgressMutation.mutateAsync({
        bookId: book.id,
        progress: progressInput.trim(),
        notes: notesInput.trim() || null,
      })
      setProgressInput("")
      setNotesInput("")
      showSuccessToast("Progress logged successfully")
    } catch {
      setErrorMsg("Failed to save progress entry.")
    }
  }

  const handleDeleteLog = async (logId: string): Promise<void> => {
    const confirmed = await confirmDestructive(
      "Delete Progress Entry?",
      "Are you sure you want to delete this progress log?"
    )
    if (!confirmed) return

    try {
      await deleteProgressMutation.mutateAsync(logId)
      showSuccessToast("Progress entry deleted")
    } catch {
      setErrorMsg("Failed to delete progress log.")
    }
  }

  return (
    <Modal
      isOpen={!!book}
      onClose={onClose}
      title={`Progress History: ${book.title}`}
      icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
    >
      <div className="space-y-6 pt-1">
        {/* Author info & current status */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <p className="text-xs text-muted-foreground italic">by {book.author}</p>
            <p className="text-xs font-semibold text-primary mt-0.5">
              Status: {book.status} {book.currentProgress ? `• Currently at: ${book.currentProgress}` : ""}
            </p>
          </div>
        </div>

        {/* Form to log new progress */}
        <form onSubmit={handleAddProgress} className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3.5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-blue-500" /> Log New Progress
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="progressInput" className="text-[11px] font-bold text-muted-foreground">
                Progress / Pages Read *
              </label>
              <input
                id="progressInput"
                type="text"
                required
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                placeholder="e.g. Hal. 150 or Bab 4"
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="notesInput" className="text-[11px] font-bold text-muted-foreground">
                Session Note (Optional)
              </label>
              <input
                id="notesInput"
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Key takeaways or session reflection..."
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive flex items-center gap-1 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addProgressMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-600/90 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {addProgressMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Save Progress Entry
                </>
              )}
            </button>
          </div>
        </form>

        {/* Log History Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Progress Timeline & History ({logs.length})
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center text-xs text-destructive font-semibold">
              Error loading progress logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
              No progress entries logged yet. Add your first update above!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 p-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-500">
                        {log.progress}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-foreground/90 leading-snug flex items-start gap-1 pt-0.5">
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{log.notes}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={deleteProgressMutation.isPending}
                    className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all shrink-0 cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
