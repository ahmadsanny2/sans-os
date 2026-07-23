"use client"

import { useState } from "react"

export interface CategoryItem {
  id: string
  name: string
  module: "habits" | "timetable" | "learning" | "projects" | "general"
  color: string
  description?: string
  isSystemDefault?: boolean
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  // General / Universal
  { id: "default_general", name: "General", module: "general", color: "primary", description: "General or unclassified tasks", isSystemDefault: true },
  
  // Habits
  { id: "1", name: "Health & Fitness", module: "habits", color: "emerald", description: "Habits for physical & mental health", isSystemDefault: true },
  { id: "5", name: "Mindset & Reading", module: "habits", color: "rose", description: "Daily reading and mindfulness", isSystemDefault: true },
  
  // Timetable / Daily Flow
  { id: "2", name: "Deep Work", module: "timetable", color: "blue", description: "High focus coding & engineering blocks", isSystemDefault: true },
  { id: "6", name: "Leisure & Rest", module: "timetable", color: "cyan", description: "Breaks, social, and hobbies", isSystemDefault: true },
  { id: "timetable_personal", name: "Personal", module: "timetable", color: "orange", description: "Personal daily routines", isSystemDefault: true },
  { id: "timetable_work", name: "Work", module: "timetable", color: "violet", description: "Professional work hours", isSystemDefault: true },
  { id: "timetable_education", name: "Education", module: "timetable", color: "amber", description: "Study sessions and lectures", isSystemDefault: true },
  
  // Learning
  { id: "4", name: "Computer Science", module: "learning", color: "amber", description: "Algorithms, system design, and AI", isSystemDefault: true },
  { id: "learn_languages", name: "Languages", module: "learning", color: "rose", description: "Language learning and practice", isSystemDefault: true },
  { id: "learn_mathematics", name: "Mathematics", module: "learning", color: "blue", description: "Math study and practice", isSystemDefault: true },
  { id: "learn_science", name: "Science", module: "learning", color: "emerald", description: "Scientific learning resources", isSystemDefault: true },

  // Projects
  { id: "3", name: "Software Development", module: "projects", color: "violet", description: "Fullstack web app development", isSystemDefault: true },
  { id: "proj_design", name: "Design", module: "projects", color: "pink", description: "UI/UX design and assets creation", isSystemDefault: true },
  { id: "proj_research", name: "Research", module: "projects", color: "cyan", description: "Investigation and analysis projects", isSystemDefault: true },
  { id: "proj_marketing", name: "Marketing", module: "projects", color: "orange", description: "Marketing and growth tasks", isSystemDefault: true },
]

const STORAGE_KEY = "sansos_custom_categories_v1"

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CategoryItem[]
        // Ensure "General" is present
        const hasGeneral = parsed.some((c) => c.name.toLowerCase() === "general")
        if (!hasGeneral) {
          const generalItem: CategoryItem = {
            id: "default_general",
            name: "General",
            module: "general",
            color: "primary",
            description: "General or unclassified tasks",
            isSystemDefault: true
          }
          const merged = [generalItem, ...parsed]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return merged
        }
        return parsed
      }
      return DEFAULT_CATEGORIES
    } catch (e) {
      console.error("Failed to load categories from localStorage:", e)
      return DEFAULT_CATEGORIES
    }
  })
  const [isLoaded] = useState(true)

  const saveCategories = (items: CategoryItem[]) => {
    setCategories(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error("Failed to save categories to localStorage:", e)
    }
  }

  const addCategory = (newItem: Omit<CategoryItem, "id" | "isSystemDefault">) => {
    const created: CategoryItem = {
      ...newItem,
      id: "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      isSystemDefault: false,
    }
    const updated = [...categories, created]
    saveCategories(updated)
    return created
  }

  const updateCategory = async (id: string, patch: Partial<Omit<CategoryItem, "id" | "isSystemDefault">>) => {
    const oldCategory = categories.find((cat) => cat.id === id)
    const updated = categories.map((cat) => (cat.id === id ? { ...cat, ...patch } : cat))
    saveCategories(updated)

    if (oldCategory && patch.name && patch.name !== oldCategory.name) {
      try {
        await fetch("/api/categories/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rename",
            oldName: oldCategory.name,
            newName: patch.name,
          }),
        })
      } catch (err) {
        console.error("Failed to sync category rename to DB:", err)
      }
    }
  }

  const deleteCategory = async (id: string) => {
    const targetCategory = categories.find((cat) => cat.id === id)
    const updated = categories.filter((cat) => cat.id !== id || cat.isSystemDefault)
    saveCategories(updated)

    if (targetCategory) {
      try {
        await fetch("/api/categories/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete",
            oldName: targetCategory.name,
          }),
        })
      } catch (err) {
        console.error("Failed to sync category delete to DB:", err)
      }
    }
  }

  const resetToDefault = () => {
    saveCategories(DEFAULT_CATEGORIES)
  }

  return {
    categories,
    isLoaded,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefault,
  }
}
