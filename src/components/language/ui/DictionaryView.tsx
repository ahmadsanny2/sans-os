"use client"

import React, { useState, useEffect } from "react"
import { useCreateVocabularyMutation, VocabularyLog } from "@/hooks/useLanguage"
import { showError, showSuccessToast } from "@/lib/sweetalert"
import { Search, Loader2, BookOpen, Plus, Check, ChevronDown, Sparkles, BookMarked } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DictionaryViewProps {
  vocabList: VocabularyLog[]
}

interface DictionaryWord {
  word: string
}

interface WordDetails {
  word: string
  partOfSpeech: string
  definition: string
  translation: string
  alternativeTranslations: { partOfSpeech: string; translations: string[] }[]
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function DictionaryView({ vocabList }: DictionaryViewProps) {
  const [selectedLetter, setSelectedLetter] = useState<string>("A")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isAlphabetOpen, setIsAlphabetOpen] = useState<boolean>(false)
  const [words, setWords] = useState<DictionaryWord[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false)
  
  // Expanded word details state
  const [expandedWord, setExpandedWord] = useState<string | null>(null)
  const [wordDetails, setWordDetails] = useState<Record<string, WordDetails>>({})
  const [isLoadingDetails, setIsLoadingDetails] = useState<Record<string, boolean>>({})

  const createVocabMutation = useCreateVocabularyMutation()

  // Fetch words list when letter or search query changes
  useEffect(() => {
    async function fetchWords() {
      setIsLoadingWords(true)
      try {
        let url = `/api/language/dictionary`
        if (searchQuery.trim()) {
          url += `?q=${encodeURIComponent(searchQuery.trim())}`
        } else if (selectedLetter) {
          url += `?letter=${selectedLetter.toLowerCase()}`
        } else {
          setWords([])
          setIsLoadingWords(false)
          return
        }

        const res = await fetch(url)
        if (!res.ok) throw new Error("Failed to fetch dictionary words")
        const data = await res.json()
        setWords(data)
      } catch (err) {
        console.error(err)
        setWords([])
      } finally {
        setIsLoadingWords(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchWords()
    }, searchQuery.trim() ? 400 : 0) // Debounce search

    return () => clearTimeout(delayDebounce)
  }, [selectedLetter, searchQuery])

  // Lazy-load word details when card is expanded
  const handleToggleExpand = async (word: string) => {
    if (expandedWord === word) {
      setExpandedWord(null)
      return
    }

    setExpandedWord(word)

    // Only fetch if details don't exist yet
    if (!wordDetails[word]) {
      setIsLoadingDetails((prev) => ({ ...prev, [word]: true }))
      try {
        const res = await fetch(`/api/language/dictionary?word=${encodeURIComponent(word)}`)
        if (!res.ok) throw new Error("Failed to load details")
        const data = await res.json()
        setWordDetails((prev) => ({ ...prev, [word]: data }))
      } catch (err) {
        console.error(err)
        showError("Lookup Error", `Failed to load details for "${word}"`)
      } finally {
        setIsLoadingDetails((prev) => ({ ...prev, [word]: false }))
      }
    }
  }

  // Save dictionary word to logs
  const handleSaveToLogs = async (wordObj: WordDetails) => {
    // Check if duplicate (just in case)
    const isDuplicate = vocabList.some(
      (v) => v.word.trim().toLowerCase() === wordObj.word.trim().toLowerCase()
    )

    if (isDuplicate) {
      showError("Duplicate", "This word is already registered in your logs.")
      return
    }

    try {
      await createVocabMutation.mutateAsync({
        word: wordObj.word,
        partOfSpeech: wordObj.partOfSpeech,
        definition: wordObj.definition,
        translation: wordObj.translation,
        langDirection: "en-id", // Dictionary is EN -> ID
        masteryLevel: 3,
      })
      showSuccessToast(`Saved "${wordObj.word}" to logs`)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save word"
      showError("Error", errMsg)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search word in dictionary..."
            className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-sidebar-primary focus:ring-2 focus:ring-sidebar-primary/10"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedLetter("A")
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Powered by Datamuse & Free Dictionary API
        </div>
      </div>

      {/* Collapsible Alphabetical Browse Panel */}
      <div className="border border-border/40 bg-secondary/15 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setIsAlphabetOpen(!isAlphabetOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-violet-500 animate-pulse" />
            Browse Alphabetically {selectedLetter && !searchQuery && `(Selected: ${selectedLetter})`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isAlphabetOpen ? "rotate-180 text-violet-500" : ""
            }`}
          />
        </button>
        
        <AnimatePresence>
          {isAlphabetOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-t border-border/30 bg-card/40"
            >
              <div className="flex flex-wrap gap-1.5 p-3 justify-center">
                {ALPHABET.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => {
                      setSelectedLetter(letter)
                      setSearchQuery("") // Clear search query when browsing alphabetically
                      setExpandedWord(null)
                    }}
                    className={`h-7 w-7 text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                      selectedLetter === letter && !searchQuery
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Words Grid / List */}
      {isLoadingWords ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">Loading dictionary words...</span>
        </div>
      ) : !searchQuery.trim() && !selectedLetter ? (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl space-y-2 bg-secondary/5 animate-in fade-in duration-200">
          <BookOpen className="h-10 w-10 text-violet-500/50 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Search Dictionary</h3>
          <p className="text-xs text-muted-foreground">Type a word in the search box above or open the alphabetical filter to find definitions, translations, and save them to your logs.</p>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl space-y-2 bg-secondary/5">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No words found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((item) => {
            const isExpanded = expandedWord === item.word
            const details = wordDetails[item.word]
            const detailsLoading = isLoadingDetails[item.word]
            
            // Check if this word is already registered in the user's logs
            const isAlreadySaved = vocabList.some(
              (v) => v.word.trim().toLowerCase() === item.word.trim().toLowerCase()
            )

            return (
              <div
                key={item.word}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isExpanded
                    ? "border-sidebar-primary/40 bg-secondary/10 shadow-md col-span-full sm:col-span-full lg:col-span-full"
                    : "border-border bg-card/45 hover:border-sidebar-primary/20 hover:shadow-sm"
                }`}
              >
                {/* Main Header / Clickable Toggle */}
                <div
                  onClick={() => handleToggleExpand(item.word)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {item.word.charAt(0)}
                    </div>
                    <span className="text-md font-bold text-foreground capitalize tracking-tight">
                      {item.word}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAlreadySaved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <BookMarked className="h-3 w-3" /> Saved
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                        isExpanded ? "rotate-180 text-violet-400" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="border-t border-border/40 bg-card/20"
                    >
                      <div className="p-5 space-y-5">
                        {detailsLoading ? (
                          <div className="flex items-center justify-center py-8 gap-2">
                            <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
                            <span className="text-xs font-semibold text-muted-foreground">Fetching meanings and translations...</span>
                          </div>
                        ) : details ? (
                          <div className="space-y-4">
                            {/* Definition & Part of Speech Badge */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                                  English Definition
                                </span>
                                {details.partOfSpeech && (
                                  <div className="flex flex-wrap gap-1">
                                    {details.partOfSpeech.split(",").map((pos) => {
                                      const cleanPos = pos.trim().toLowerCase()
                                      return (
                                        <span
                                          key={cleanPos}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                            cleanPos === "verb"
                                              ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                              : cleanPos === "noun"
                                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                              : cleanPos === "adjective"
                                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                              : cleanPos === "adverb"
                                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                              : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                          }`}
                                        >
                                          {cleanPos}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-foreground/80 leading-relaxed bg-secondary/10 dark:bg-zinc-950/20 p-3 rounded-xl border border-border/30">
                                {details.definition}
                              </p>
                            </div>

                            {/* Indonesian Translations */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
                                Indonesian Meanings
                              </span>

                              {/* Primary Google Translation */}
                              <div className="p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl space-y-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-400 block select-none">
                                  Primary Translation
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                  {details.translation}
                                </span>
                              </div>

                              {/* Bilingual alternative meanings */}
                              {details.alternativeTranslations && details.alternativeTranslations.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground block mt-3">
                                    Alternative Meanings (by Part of Speech)
                                  </span>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {details.alternativeTranslations.map((alt, index) => (
                                      <div
                                        key={index}
                                        className="p-3 bg-secondary/20 dark:bg-zinc-950/15 border border-border/40 rounded-xl space-y-1.5"
                                      >
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                          {alt.partOfSpeech}
                                        </span>
                                        <div className="text-xs font-bold text-foreground/80 flex flex-wrap gap-1">
                                          {alt.translations.join(", ")}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Row */}
                            <div className="flex justify-end border-t border-border/30 pt-4 mt-2">
                              {isAlreadySaved ? (
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm select-none"
                                >
                                  <Check className="h-4.5 w-4.5 stroke-[3]" /> Saved to Logs
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSaveToLogs(details)}
                                  disabled={createVocabMutation.isPending}
                                  className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-sm select-none cursor-pointer"
                                >
                                  {createVocabMutation.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-4.5 w-4.5 stroke-[2.5]" /> Save to Logs
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs font-semibold text-destructive">
                            Failed to load details.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
