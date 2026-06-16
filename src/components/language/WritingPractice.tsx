"use client"

import React, { useState } from "react"
import {
  useVocabularyQuery,
  useWritingQuery,
  useCreateWritingMutation,
  useDeleteWritingMutation,
  WritingLog,
} from "@/hooks/useLanguage"
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
  PencilLine,
  History,
  Check,
  HelpCircle,
  Minus,
} from "lucide-react"
import { GridCardSkeleton } from "@/components/ui/Skeletons"
import { confirmDestructive, showError, showSuccessToast } from "@/lib/sweetalert"

export function WritingPractice() {
  const { data: vocabList = [] } = useVocabularyQuery()
  const { data: writingList = [], isLoading, isError } = useWritingQuery()
  const createWritingMutation = useCreateWritingMutation()
  const deleteWritingMutation = useDeleteWritingMutation()

  // State controls
  const [practiceMode, setPracticeMode] = useState<"free" | "vocab">("free")
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [selectedVocabId, setSelectedVocabId] = useState("")
  const [sentenceType, setSentenceType] = useState<"Positive" | "Negative" | "Interrogative">("Positive")
  const [englishSentence, setEnglishSentence] = useState("")
  const [indonesianTranslation, setIndonesianTranslation] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const handleAddWriting = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError(null)

    if (!englishSentence.trim() || !indonesianTranslation.trim()) {
      setFormError("Please fill out both English and Indonesian translation fields.")
      return
    }

    let vocabWord: string | null = null
    let vocabId: string | null = null

    if (practiceMode === "vocab") {
      if (!selectedVocabId) {
        setFormError("Please select a vocabulary word for this sentence.")
        return
      }
      const selectedVocabObj = vocabList.find((v) => v.id === selectedVocabId)
      if (selectedVocabObj) {
        vocabWord = selectedVocabObj.word
        vocabId = selectedVocabObj.id
      }
    }

    try {
      await createWritingMutation.mutateAsync({
        vocabId,
        vocabWord,
        sentenceType: practiceMode === "vocab" ? sentenceType : null,
        englishSentence: englishSentence.trim(),
        indonesianTranslation: indonesianTranslation.trim(),
      })

      // Reset form on success
      setEnglishSentence("")
      setIndonesianTranslation("")
      setFormError(null)
      showSuccessToast("Writing log added successfully")
    } catch {
      setFormError("Failed to add writing log. Please try again.")
    }
  }

  const handleDeleteWriting = async (id: string): Promise<void> => {
    const isConfirmed = await confirmDestructive(
      "Delete Writing Log",
      "Are you sure you want to delete this writing practice log?"
    )
    if (!isConfirmed) return

    try {
      await deleteWritingMutation.mutateAsync(id)
      showSuccessToast("Writing log deleted successfully")
    } catch {
      showError("Delete Error", "Failed to delete writing log.")
    }
  }

  // Filters
  const filteredWriting = writingList.filter((log) => {
    const matchesSearch =
      log.englishSentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.indonesianTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.vocabWord && log.vocabWord.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Upper Grid Layout: Form and History */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Left Form: Workspace Creation (Column Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card/45 dark:bg-card/20 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <PencilLine className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-bold text-foreground">New Writing Practice</h3>
            </div>

            {/* Practice Mode Selector Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 rounded-xl mb-5 border border-border/40 select-none">
              <button
                type="button"
                onClick={() => {
                  setPracticeMode("free")
                  setFormError(null)
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  practiceMode === "free"
                    ? "bg-background text-foreground shadow-sm border border-border/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Free Writing
              </button>
              <button
                type="button"
                onClick={() => {
                  setPracticeMode("vocab")
                  setFormError(null)
                  // Default to first item if available
                  if (vocabList.length > 0 && !selectedVocabId) {
                    setSelectedVocabId(vocabList[0].id)
                  }
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  practiceMode === "vocab"
                    ? "bg-background text-foreground shadow-sm border border-border/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vocab-Based
              </button>
            </div>

            <form onSubmit={handleAddWriting} className="space-y-4">
              {/* Conditional Fields for Vocabulary Practice */}
              {practiceMode === "vocab" && (
                <div className="space-y-4 border-b border-border/40 pb-4 animate-in fade-in duration-200">
                  {/* Select Vocab word */}
                  <div className="space-y-1.5">
                    <label htmlFor="vocabSelect" className="text-xs font-bold text-muted-foreground">
                      Select Vocabulary Word *
                    </label>
                    {vocabList.length === 0 ? (
                      <div className="text-xs border border-destructive/25 bg-destructive/5 text-destructive rounded-lg p-2.5 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        No vocabulary found. Add vocabulary in the first tab first.
                      </div>
                    ) : (
                      <select
                        id="vocabSelect"
                        value={selectedVocabId}
                        onChange={(e) => setSelectedVocabId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-sidebar-primary"
                      >
                        {vocabList.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.word} ({v.translation})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Sentence Type selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">
                      Sentence Type (Tipe Kalimat) *
                    </span>
                    <div className="grid grid-cols-3 gap-2 select-none">
                      <button
                        type="button"
                        onClick={() => setSentenceType("Positive")}
                        className={`py-1.5 px-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                          sentenceType === "Positive"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-extrabold"
                            : "bg-secondary/10 border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" /> Positif (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSentenceType("Negative")}
                        className={`py-1.5 px-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                          sentenceType === "Negative"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-extrabold"
                            : "bg-secondary/10 border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                      >
                        <Minus className="h-3.5 w-3.5" /> Negatif (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSentenceType("Interrogative")}
                        className={`py-1.5 px-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                          sentenceType === "Interrogative"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-500 font-extrabold"
                            : "bg-secondary/10 border-border text-muted-foreground hover:bg-secondary/20"
                        }`}
                      >
                        <HelpCircle className="h-3.5 w-3.5" /> Tanya (?)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* English sentence text input */}
              <div className="space-y-1.5">
                <label htmlFor="englishSentence" className="text-xs font-bold text-muted-foreground">
                  English Sentence *
                </label>
                <textarea
                  id="englishSentence"
                  rows={3}
                  required
                  value={englishSentence}
                  onChange={(e) => setEnglishSentence(e.target.value)}
                  placeholder={
                    practiceMode === "vocab"
                      ? "Write an English sentence incorporating the selected word..."
                      : "Type your English sentence practice here..."
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10 resize-none leading-relaxed"
                />
              </div>

              {/* Translation text input */}
              <div className="space-y-1.5">
                <label htmlFor="indonesianTranslation" className="text-xs font-bold text-muted-foreground">
                  Indonesian Translation *
                </label>
                <textarea
                  id="indonesianTranslation"
                  rows={3}
                  required
                  value={indonesianTranslation}
                  onChange={(e) => setIndonesianTranslation(e.target.value)}
                  placeholder="Terjemahan Bahasa Indonesia..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10 resize-none leading-relaxed"
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive flex items-center gap-1 font-semibold animate-in slide-in-from-top-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  createWritingMutation.isPending ||
                  (practiceMode === "vocab" && vocabList.length === 0)
                }
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sidebar-primary py-2.5 text-sm font-semibold text-sidebar-primary-foreground shadow-sm transition-all hover:bg-sidebar-primary/95 disabled:opacity-50"
              >
                {createWritingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Save Sentence
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right List: History & Search (Column Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2 self-start">
              <History className="h-4.5 w-4.5 text-muted-foreground" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Practice History</h4>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sentences or words..."
                className="w-full rounded-lg border border-border bg-card/60 pl-9 pr-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
              />
            </div>
          </div>

          {/* List items */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <GridCardSkeleton key={idx} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm font-semibold text-destructive">
              <AlertCircle className="h-6 w-6" />
              <span>Error loading writing logs. Please check database.</span>
            </div>
          ) : filteredWriting.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground bg-card/10 select-none">
              {searchQuery ? "No sentences match your search query." : "No writing logs found. Start typing your first sentence on the left!"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWriting.map((log: WritingLog) => {
                return (
                  <div
                    key={log.id}
                    className="group relative rounded-xl border border-border bg-card/45 dark:bg-card/15 p-4 shadow-sm hover:border-sidebar-primary/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {log.vocabWord ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
                              Word: {log.vocabWord}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-secondary/40 text-muted-foreground border border-border/50">
                              Free Writing
                            </span>
                          )}

                          {log.sentenceType && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                                log.sentenceType === "Positive"
                                  ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
                                  : log.sentenceType === "Negative"
                                  ? "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20"
                                  : "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20"
                              }`}
                            >
                              {log.sentenceType === "Positive"
                                ? "Positif"
                                : log.sentenceType === "Negative"
                                ? "Negatif"
                                : "Tanya"}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteWriting(log.id)}
                          disabled={deleteWritingMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                          aria-label="Delete sentence log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* English Sentence */}
                      <p className="text-sm font-semibold tracking-tight text-foreground leading-relaxed">
                        {log.englishSentence}
                      </p>

                      {/* Indonesian translation */}
                      <div className="pt-1.5 border-t border-dashed border-border/30 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                          Terjemahan
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          {log.indonesianTranslation}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-3 text-[9px] font-semibold text-muted-foreground/60 text-right">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}
