import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface BucketItem {
  id: string
  userId: string
  title: string
  imageUrl: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
}

// 1. Fetch all bucket items
async function fetchBucketList(): Promise<BucketItem[]> {
  const res = await fetch("/api/bucket-list")
  if (!res.ok) {
    throw new Error("Failed to fetch bucket list items")
  }
  return res.json()
}

export function useBucketListQuery() {
  return useQuery<BucketItem[]>({
    queryKey: ["bucket-list"],
    queryFn: fetchBucketList,
  })
}

// 2. Create bucket item
async function createBucketItem(body: {
  title: string
  imageUrl?: string | null
}): Promise<BucketItem> {
  const res = await fetch("/api/bucket-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to create bucket list item")
  }
  return res.json()
}

export function useCreateBucketItemMutation() {
  const queryClient = useQueryClient()
  return useMutation<BucketItem, Error, { title: string; imageUrl?: string | null }>({
    mutationFn: createBucketItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bucket-list"] })
    },
  })
}

// 3. Update bucket item (title, completed, imageUrl)
async function updateBucketItem(body: {
  id: string
  title?: string
  imageUrl?: string | null
  completed?: boolean
}): Promise<BucketItem> {
  const res = await fetch("/api/bucket-list", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to update bucket list item")
  }
  return res.json()
}

export function useUpdateBucketItemMutation() {
  const queryClient = useQueryClient()
  return useMutation<BucketItem, Error, {
    id: string
    title?: string
    imageUrl?: string | null
    completed?: boolean
  }>({
    mutationFn: updateBucketItem,
    onSuccess: (updated) => {
      // Optimistic cache update for fast responsiveness
      queryClient.setQueryData<BucketItem[]>(["bucket-list"], (old) => {
        if (!old) return []
        return old.map((item) => (item.id === updated.id ? updated : item))
      })
      queryClient.invalidateQueries({ queryKey: ["bucket-list"] })
    },
  })
}

// 4. Delete bucket item
async function deleteBucketItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/bucket-list?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error("Failed to delete bucket list item")
  }
  return res.json()
}

export function useDeleteBucketItemMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteBucketItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bucket-list"] })
    },
  })
}
