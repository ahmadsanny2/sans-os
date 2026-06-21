import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { dialogueLogs } from "@/types/schema"
import { eq, and, desc } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await db
      .select()
      .from(dialogueLogs)
      .where(eq(dialogueLogs.userId, user.id))
      .orderBy(desc(dialogueLogs.createdAt))

    return NextResponse.json(logs)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

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
    const {
      vocabId,
      vocabWord,
      englishQuestion,
      indonesianQuestion,
      englishAnswer,
      indonesianAnswer,
    } = body

    if (
      !vocabId ||
      !vocabWord ||
      !englishQuestion?.trim() ||
      !indonesianQuestion?.trim() ||
      !englishAnswer?.trim() ||
      !indonesianAnswer?.trim()
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newLog] = await db
      .insert(dialogueLogs)
      .values({
        userId: user.id,
        vocabId,
        vocabWord: vocabWord.trim(),
        englishQuestion: englishQuestion.trim(),
        indonesianQuestion: indonesianQuestion.trim(),
        englishAnswer: englishAnswer.trim(),
        indonesianAnswer: indonesianAnswer.trim(),
      })
      .returning()

    return NextResponse.json(newLog)
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
      return NextResponse.json({ error: "Missing log ID" }, { status: 400 })
    }

    const [deletedLog] = await db
      .delete(dialogueLogs)
      .where(and(eq(dialogueLogs.id, id), eq(dialogueLogs.userId, user.id)))
      .returning()

    if (!deletedLog) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
