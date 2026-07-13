"use client"

import React, { useState } from "react"
import { Formula } from "@/hooks/useLanguage"
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Edit2,
  Check,
  X
} from "lucide-react"

interface FormulaListViewProps {
  formulaList: Formula[]
  isLoading: boolean
  isError: boolean
  showFormulaForm: boolean
  setShowFormulaForm: (show: boolean) => void
  formulaName: string
  setFormulaName: (name: string) => void
  formulaString: string
  setFormulaString: (formula: string) => void
  formulaDescription: string
  setFormulaDescription: (desc: string) => void
  searchQueryFormula: string
  setSearchQueryFormula: (query: string) => void
  formulaFormError: string | null
  handleAddFormula: (e: React.FormEvent) => Promise<void>
  handleUpdateFormula: (id: string, name: string, formulaVal: string, description: string | null) => Promise<void>
  handleDeleteFormula: (id: string) => Promise<void>
  filteredFormulas: Formula[]
  formulaCreatePending: boolean
}

export function FormulaListView({
  formulaList,
  isLoading,
  isError,
  showFormulaForm,
  setShowFormulaForm,
  formulaName,
  setFormulaName,
  formulaString,
  setFormulaString,
  formulaDescription,
  setFormulaDescription,
  searchQueryFormula,
  setSearchQueryFormula,
  formulaFormError,
  handleAddFormula,
  handleUpdateFormula,
  handleDeleteFormula,
  filteredFormulas,
  formulaCreatePending,
}: FormulaListViewProps) {
  // Inline edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editFormulaVal, setEditFormulaVal] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const startEdit = (f: Formula) => {
    setEditingId(f.id)
    setEditName(f.name)
    setEditFormulaVal(f.formula)
    setEditDesc(f.description || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim() || !editFormulaVal.trim()) {
      return
    }
    await handleUpdateFormula(id, editName.trim(), editFormulaVal.trim(), editDesc.trim() || null)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            Formulas & Patterns
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Register and manage grammar formulas ({formulaList.length}) to practice writing and dialogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchQueryFormula}
              onChange={(e) => setSearchQueryFormula(e.target.value)}
              className="w-full sm:w-60 rounded-xl border border-border/60 bg-background/50 pl-8.5 pr-3.5 py-1.5 text-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button
            onClick={() => setShowFormulaForm(!showFormulaForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {showFormulaForm ? "Cancel Add" : "Add Formula"}
          </button>
        </div>
      </div>

      {/* 2. Add Formula Form (Only visible when showFormulaForm is true) */}
      {showFormulaForm && (
        <div className="bento-card p-5 animate-in slide-in-from-top-4 duration-200 border-violet-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-bold text-foreground">Add New Formula</h3>
          </div>

          <form onSubmit={handleAddFormula} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="formulaNameInput" className="text-xs font-bold text-muted-foreground">
                  Formula Name *
                </label>
                <input
                  id="formulaNameInput"
                  type="text"
                  required
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="e.g. Present Continuous, Simple Past"
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="formulaStringInput" className="text-xs font-bold text-muted-foreground">
                  Formula Pattern *
                </label>
                <input
                  id="formulaStringInput"
                  type="text"
                  required
                  value={formulaString}
                  onChange={(e) => setFormulaString(e.target.value)}
                  placeholder="e.g. S + am/is/are + V-ing | Q: Aux + S + V1?"
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="formulaDescInput" className="text-xs font-bold text-muted-foreground">
                Description (Optional)
              </label>
              <textarea
                id="formulaDescInput"
                value={formulaDescription}
                onChange={(e) => setFormulaDescription(e.target.value)}
                placeholder="Briefly explain the use case or grammar context for this pattern..."
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>

            {formulaFormError && (
              <p className="text-xs text-destructive flex items-center gap-1 font-semibold animate-in slide-in-from-top-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {formulaFormError}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
              <button
                type="button"
                onClick={() => setShowFormulaForm(false)}
                className="rounded-lg border border-border/40 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formulaCreatePending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {formulaCreatePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Save Formula
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Formulas List / Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-2xl bg-card/35 border border-border/40 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm font-semibold text-destructive">
          <AlertCircle className="h-6 w-6" />
          <span>Error loading formulas. Please reload the page.</span>
        </div>
      ) : filteredFormulas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/40 py-16 text-center text-sm text-muted-foreground bg-card/10 select-none animate-in fade-in duration-200">
          {searchQueryFormula ? (
            <>
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-bold">No results found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Try adjusting your search query.
              </p>
            </>
          ) : (
            <>
              <Sparkles className="mx-auto h-8 w-8 text-violet-500/60 mb-2 animate-pulse" />
              <p className="font-bold">No formulas registered yet</p>
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs mx-auto">
                Click &quot;Add Formula&quot; above to register your first grammar formula.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFormulas.map((f) => {
            const isEditing = editingId === f.id
            return (
              <div
                key={f.id}
                className="group rounded-2xl border border-border/60 bg-card/40 dark:bg-card/20 p-4.5 shadow-sm hover:border-violet-500/20 hover:bg-card/65 transition-all duration-200 backdrop-blur-md relative flex flex-col justify-between"
              >
                {isEditing ? (
                  // Inline editing form
                  <div className="space-y-3 w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Formula Name"
                      className="w-full text-xs font-bold rounded border border-border/80 bg-background px-2 py-1 outline-none"
                    />
                    <input
                      type="text"
                      value={editFormulaVal}
                      onChange={(e) => setEditFormulaVal(e.target.value)}
                      placeholder="Formula Pattern"
                      className="w-full text-xs font-mono rounded border border-border/80 bg-background px-2 py-1 outline-none"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description"
                      rows={2}
                      className="w-full text-xs rounded border border-border/80 bg-background px-2 py-1 outline-none resize-none"
                    />
                    <div className="flex justify-end gap-1.5 pt-1.5 border-t border-border/30">
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => saveEdit(f.id)}
                        disabled={!editName.trim() || !editFormulaVal.trim()}
                        className="p-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-50 cursor-pointer"
                        title="Save Changes"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display card
                  <>
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-bold text-foreground tracking-tight">
                          {f.name}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(f)}
                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Edit formula"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFormula(f.id)}
                            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                            title="Delete formula"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="font-mono bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/15 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl text-xs font-bold leading-relaxed mb-2 max-w-full overflow-x-auto select-all">
                        {f.formula}
                      </div>

                      {f.description ? (
                        <p className="text-[11px] text-muted-foreground/90 font-medium leading-relaxed">
                          {f.description}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/40 italic">
                          No description provided.
                        </p>
                      )}
                    </div>

                    <div className="text-[9px] text-muted-foreground/50 text-right mt-3 select-none">
                      Added {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
