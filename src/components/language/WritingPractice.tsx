"use client"

import React, { useState, useRef, useEffect } from "react"
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
  Check,
  HelpCircle,
  Minus,
  BookOpen,
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
  const [activeHistoryTab, setActiveHistoryTab] = useState<"vocab" | "free">("vocab")
  const [searchQuery, setSearchQuery] = useState("")

  // Autocomplete state
  const [selectedVocabId, setSelectedVocabId] = useState("")
  const [searchVocabQuery, setSearchVocabQuery] = useState("")
  const [showVocabDropdown, setShowVocabDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Form state - Free Writing
  const [freeEnglish, setFreeEnglish] = useState("")
  const [freeTranslation, setFreeTranslation] = useState("")

  // Form state - Vocab-Based (Requires positive, negative, and interrogative)
  const [vocabEngPos, setVocabEngPos] = useState("")
  const [vocabTransPos, setVocabTransPos] = useState("")

  const [vocabEngNeg, setVocabEngNeg] = useState("")
  const [vocabTransNeg, setVocabTransNeg] = useState("")

  const [vocabEngInt, setVocabEngInt] = useState("")
  const [vocabTransInt, setVocabTransInt] = useState("")

  const [formError, setFormError] = useState<string | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVocabDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddWriting = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError(null)

    if (practiceMode === "free") {
      if (!freeEnglish.trim() || !freeTranslation.trim()) {
        setFormError("Please fill out both English sentence and translation.")
        return
      }

      try {
        await createWritingMutation.mutateAsync({
          vocabId: null,
          vocabWord: null,
          sentenceType: null,
          englishSentence: freeEnglish.trim(),
          indonesianTranslation: freeTranslation.trim(),
        })
        setFreeEnglish("")
        setFreeTranslation("")
        showSuccessToast("Free writing log added successfully")
      } catch {
        setFormError("Failed to add writing log.")
      }
    } else {
      // Vocab-based validation
      if (!selectedVocabId) {
        setFormError("Please select a vocabulary word.")
        return
      }

      if (
        !vocabEngPos.trim() || !vocabTransPos.trim() ||
        !vocabEngNeg.trim() || !vocabTransNeg.trim() ||
        !vocabEngInt.trim() || !vocabTransInt.trim()
      ) {
        setFormError("Please write sentences and translations for all three types (Positive, Negative, and Tanya).")
        return
      }

      const selectedVocabObj = vocabList.find((v) => v.id === selectedVocabId)
      if (!selectedVocabObj) {
        setFormError("Selected vocabulary word not found.")
        return
      }

      try {
        // Submit all three sentences
        await Promise.all([
          createWritingMutation.mutateAsync({
            vocabId: selectedVocabObj.id,
            vocabWord: selectedVocabObj.word,
            sentenceType: "Positive",
            englishSentence: vocabEngPos.trim(),
            indonesianTranslation: vocabTransPos.trim(),
          }),
          createWritingMutation.mutateAsync({
            vocabId: selectedVocabObj.id,
            vocabWord: selectedVocabObj.word,
            sentenceType: "Negative",
            englishSentence: vocabEngNeg.trim(),
            indonesianTranslation: vocabTransNeg.trim(),
          }),
          createWritingMutation.mutateAsync({
            vocabId: selectedVocabObj.id,
            vocabWord: selectedVocabObj.word,
            sentenceType: "Interrogative",
            englishSentence: vocabEngInt.trim(),
            indonesianTranslation: vocabTransInt.trim(),
          }),
        ])

        // Reset vocab inputs
        setVocabEngPos("")
        setVocabTransPos("")
        setVocabEngNeg("")
        setVocabTransNeg("")
        setVocabEngInt("")
        setVocabTransInt("")
        setFormError(null)
        showSuccessToast("Vocab practice sentences added successfully")
      } catch {
        setFormError("Failed to save some or all sentences. Please try again.")
      }
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

  // Auto-complete filtered list
  const filteredVocabList = vocabList.filter(
    (v) =>
      v.word.toLowerCase().includes(searchVocabQuery.toLowerCase()) ||
      v.translation.toLowerCase().includes(searchVocabQuery.toLowerCase())
  )

  // Separated writing logs lists
  const vocabWritingLogs = writingList.filter((log) => log.vocabId !== null)
  const freeWritingLogs = writingList.filter((log) => log.vocabId === null)

  // Search filter matching on active history list
  const activeHistoryList = activeHistoryTab === "vocab" ? vocabWritingLogs : freeWritingLogs
  const filteredHistory = activeHistoryList.filter((log) => {
    const matchesSearch =
      log.englishSentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.indonesianTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.vocabWord && log.vocabWord.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Select item in autocomplete
  const handleSelectVocab = (id: string, word: string) => {
    setSelectedVocabId(id)
    setSearchVocabQuery(word)
    setShowVocabDropdown(false)
    setFormError(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Upper Grid Layout: Form and History */}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        
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
                  // Pre-fill search with selected vocab if any
                  const activeObj = vocabList.find(v => v.id === selectedVocabId)
                  if (activeObj) {
                    setSearchVocabQuery(activeObj.word)
                  } else if (vocabList.length > 0) {
                    setSelectedVocabId(vocabList[0].id)
                    setSearchVocabQuery(vocabList[0].word)
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
                  
                  {/* Searchable autocomplete select */}
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <label className="text-xs font-bold text-muted-foreground">
                      Search & Select Word *
                    </label>
                    {vocabList.length === 0 ? (
                      <div className="text-xs border border-destructive/25 bg-destructive/5 text-destructive rounded-lg p-2.5 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        No vocabulary found. Add vocabulary in the first tab first.
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchVocabQuery}
                            onFocus={() => setShowVocabDropdown(true)}
                            onChange={(e) => {
                              setSearchVocabQuery(e.target.value)
                              setSelectedVocabId("") // Clear selection while typing
                              setShowVocabDropdown(true)
                            }}
                            placeholder="Type to search vocabulary..."
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10"
                          />
                          {selectedVocabId && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2 w-2 rounded-full bg-emerald-500" title="Valid Word Selected" />
                          )}
                        </div>

                        {showVocabDropdown && (
                          <div className="absolute z-30 w-full mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in slide-in-from-top-1 duration-150">
                            {filteredVocabList.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">
                                No matching vocabulary found
                              </div>
                            ) : (
                              filteredVocabList.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVocab(v.id, v.word)}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                                    selectedVocabId === v.id ? "bg-accent/40 font-bold" : ""
                                  }`}
                                >
                                  <span>{v.word}</span>
                                  <span className="text-[10px] text-muted-foreground italic max-w-[120px] truncate">{v.translation}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* FREE WRITING INPUTS */}
              {practiceMode === "free" ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label htmlFor="freeEnglish" className="text-xs font-bold text-muted-foreground">
                      English Sentence *
                    </label>
                    <textarea
                      id="freeEnglish"
                      rows={3}
                      required
                      value={freeEnglish}
                      onChange={(e) => setFreeEnglish(e.target.value)}
                      placeholder="Type your English sentence practice here..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="freeTranslation" className="text-xs font-bold text-muted-foreground">
                      Indonesian Translation *
                    </label>
                    <textarea
                      id="freeTranslation"
                      rows={3}
                      required
                      value={freeTranslation}
                      onChange={(e) => setFreeTranslation(e.target.value)}
                      placeholder="Terjemahan Bahasa Indonesia..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                /* VOCAB BASED THREE-SENTENCE INPUTS */
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Positive (+) Sentence Pair */}
                  <div className="space-y-2.5 border-l-2 border-emerald-500 pl-3">
                    <div className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-500">
                        1. Kalimat Positif (+)
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        value={vocabEngPos}
                        onChange={(e) => setVocabEngPos(e.target.value)}
                        placeholder="English positive sentence..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                      <input
                        type="text"
                        required
                        value={vocabTransPos}
                        onChange={(e) => setVocabTransPos(e.target.value)}
                        placeholder="Terjemahan Indonesia..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                    </div>
                  </div>

                  {/* Negative (-) Sentence Pair */}
                  <div className="space-y-2.5 border-l-2 border-rose-500 pl-3">
                    <div className="flex items-center gap-1">
                      <Minus className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-rose-500">
                        2. Kalimat Negatif (-)
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        value={vocabEngNeg}
                        onChange={(e) => setVocabEngNeg(e.target.value)}
                        placeholder="English negative sentence..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                      <input
                        type="text"
                        required
                        value={vocabTransNeg}
                        onChange={(e) => setVocabTransNeg(e.target.value)}
                        placeholder="Terjemahan Indonesia..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                    </div>
                  </div>

                  {/* Interrogative (?) Sentence Pair */}
                  <div className="space-y-2.5 border-l-2 border-blue-500 pl-3">
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-blue-500">
                        3. Kalimat Tanya (?)
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        value={vocabEngInt}
                        onChange={(e) => setVocabEngInt(e.target.value)}
                        placeholder="English interrogative sentence..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                      <input
                        type="text"
                        required
                        value={vocabTransInt}
                        onChange={(e) => setVocabTransInt(e.target.value)}
                        placeholder="Terjemahan Indonesia..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-sidebar-primary"
                      />
                    </div>
                  </div>

                </div>
              )}

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
                  (practiceMode === "vocab" && (!selectedVocabId || vocabList.length === 0))
                }
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sidebar-primary py-2.5 text-sm font-semibold text-sidebar-primary-foreground shadow-sm transition-all hover:bg-sidebar-primary/95 disabled:opacity-50"
              >
                {createWritingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Save Practice
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right List: History & Search (Column Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* History Separation Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border/40 pb-3">
            
            {/* History Category Selector */}
            <div className="flex gap-1.5 p-0.5 bg-secondary/20 border border-border/30 rounded-xl select-none shrink-0 self-start sm:self-auto">
              <button
                onClick={() => {
                  setActiveHistoryTab("vocab")
                  setSearchQuery("")
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeHistoryTab === "vocab"
                    ? "bg-background text-foreground shadow-sm border border-border/20 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Vocab-Based ({vocabWritingLogs.length})
              </button>
              <button
                onClick={() => {
                  setActiveHistoryTab("free")
                  setSearchQuery("")
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeHistoryTab === "free"
                    ? "bg-background text-foreground shadow-sm border border-border/20 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PencilLine className="h-3.5 w-3.5" /> Free Writing ({freeWritingLogs.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeHistoryTab === "vocab"
                    ? "Search sentences or vocabulary word..."
                    : "Search free writing sentences..."
                }
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
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground bg-card/10 select-none animate-in fade-in duration-200">
              {searchQuery
                ? "No sentences match your search query."
                : activeHistoryTab === "vocab"
                ? "No vocab-based sentences recorded yet. Practice some words on the left!"
                : "No free writing logs recorded yet. Start writing on the left!"}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {filteredHistory.map((log: WritingLog) => {
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
