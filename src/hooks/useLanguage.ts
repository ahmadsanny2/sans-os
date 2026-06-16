import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface VocabularyLog {
  id: string
  userId: string
  word: string
  partOfSpeech: string
  definition: string
  translation: string
  exampleSentence: string | null
  masteryLevel: number
  createdAt: string
}

// 1. Fetch vocabulary list
async function fetchVocabulary(): Promise<VocabularyLog[]> {
  const res = await fetch("/api/language")
  if (!res.ok) {
    throw new Error("Failed to fetch vocabulary logs")
  }
  return res.json()
}

export function useVocabularyQuery() {
  return useQuery<VocabularyLog[]>({
    queryKey: ["vocabulary"],
    queryFn: fetchVocabulary,
  })
}

// 2. Create vocabulary log
async function createVocabulary(body: {
  word: string
  partOfSpeech: string
  definition: string
  translation: string
  exampleSentence?: string
  masteryLevel?: number
}): Promise<VocabularyLog> {
  const res = await fetch("/api/language", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to create vocabulary log")
  }
  return res.json()
}

export function useCreateVocabularyMutation() {
  const queryClient = useQueryClient()
  return useMutation<VocabularyLog, Error, {
    word: string
    partOfSpeech: string
    definition: string
    translation: string
    exampleSentence?: string
    masteryLevel?: number
  }>({
    mutationFn: createVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] })
    },
  })
}

// 3. Update word mastery level
async function updateMastery(body: { id: string; masteryLevel: number }): Promise<VocabularyLog> {
  const res = await fetch("/api/language", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to update mastery level")
  }
  return res.json()
}

export function useUpdateMasteryMutation() {
  const queryClient = useQueryClient()
  return useMutation<VocabularyLog, Error, { id: string; masteryLevel: number }>({
    mutationFn: updateMastery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] })
    },
  })
}

// 4. Delete vocabulary log
async function deleteVocabulary(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/language?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error("Failed to delete vocabulary log")
  }
  return res.json()
}

export function useDeleteVocabularyMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] })
    },
  })
}
