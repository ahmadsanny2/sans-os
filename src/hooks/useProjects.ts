import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface ProjectTask {
  id: string
  userId: string
  projectId: string
  name: string
  completed: boolean
  priority: string
  deadline: string | null
  createdAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  status: string
  priority: string
  deadline: string | null
  createdAt: string
  tasks: ProjectTask[]
}

// 1. Fetch user projects (includes nested tasks)
async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) {
    throw new Error("Failed to fetch projects")
  }
  return res.json()
}

export function useProjectsQuery() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })
}

// 2. Create new project
async function createProject(body: {
  name: string
  description?: string
  status?: string
  priority?: string
  deadline?: string
}): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to create project")
  }
  return res.json()
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation<Project, Error, {
    name: string
    description?: string
    status?: string
    priority?: string
    deadline?: string
  }>({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        if (!old) return [{ ...newProject, tasks: [] }]
        return [...old.filter((p) => p.id !== newProject.id), { ...newProject, tasks: [] }]
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// 3. Delete project
async function deleteProject(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/projects?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error("Failed to delete project")
  }
  return res.json()
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, string, { previous: Project[] | undefined }>({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previous = queryClient.getQueryData<Project[]>(["projects"])
      if (previous) {
        queryClient.setQueryData<Project[]>(
          ["projects"],
          previous.filter((p) => p.id !== id)
        )
      }
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// 4. Create new project task
async function createTask(body: {
  projectId: string
  name: string
  priority?: string
  deadline?: string
}): Promise<ProjectTask> {
  const res = await fetch("/api/projects/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to create task")
  }
  return res.json()
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation<ProjectTask, Error, {
    projectId: string
    name: string
    priority?: string
    deadline?: string
  }>({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        if (!old) return []
        return old.map((p) => {
          if (p.id === newTask.projectId) {
            return {
              ...p,
              tasks: [...p.tasks.filter((t) => t.id !== newTask.id), newTask],
            }
          }
          return p
        })
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// 5. Delete task
async function deleteTask(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/projects/tasks?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error("Failed to delete task")
  }
  return res.json()
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, string, { previous: Project[] | undefined }>({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previous = queryClient.getQueryData<Project[]>(["projects"])
      if (previous) {
        queryClient.setQueryData<Project[]>(
          ["projects"],
          previous.map((p) => ({
            ...p,
            tasks: p.tasks.filter((t) => t.id !== id),
          }))
        )
      }
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// 6. Toggle task completed status
async function toggleTask(body: { id: string; completed: boolean }): Promise<ProjectTask> {
  const res = await fetch("/api/projects/tasks/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error("Failed to toggle task status")
  }
  return res.json()
}

export function useToggleTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation<ProjectTask, Error, { id: string; completed: boolean }, { previous: Project[] | undefined }>({
    mutationFn: toggleTask,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previous = queryClient.getQueryData<Project[]>(["projects"])
      if (previous) {
        queryClient.setQueryData<Project[]>(
          ["projects"],
          previous.map((p) => ({
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === variables.id ? { ...t, completed: variables.completed } : t
            ),
          }))
        )
      }
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
