import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectSubTasks } from "@/types/schema"
import { eq, and } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, name } = body

    if (!taskId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newSubTask] = await db
      .insert(projectSubTasks)
      .values({
        userId: user.id,
        taskId,
        name,
        completed: false,
      })
      .returning()

    return NextResponse.json(newSubTask)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing sub-task ID" }, { status: 400 })
    }

    const [deletedSubTask] = await db
      .delete(projectSubTasks)
      .where(and(eq(projectSubTasks.id, id), eq(projectSubTasks.userId, user.id)))
      .returning()

    if (!deletedSubTask) {
      return NextResponse.json({ error: "Sub-task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
