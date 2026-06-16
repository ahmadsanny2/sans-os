import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vocabularyLogs } from "@/types/schema"
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
      .from(vocabularyLogs)
      .where(eq(vocabularyLogs.userId, user.id))
      .orderBy(desc(vocabularyLogs.createdAt))

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
    const { word, partOfSpeech, definition, translation, exampleSentence, masteryLevel } = body

    if (!word || !partOfSpeech || !definition || !translation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newLog] = await db
      .insert(vocabularyLogs)
      .values({
        userId: user.id,
        word,
        partOfSpeech,
        definition,
        translation,
        exampleSentence: exampleSentence || null,
        masteryLevel: masteryLevel !== undefined ? Number(masteryLevel) : 1,
      })
      .returning()

    return NextResponse.json(newLog)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, masteryLevel } = body

    if (!id || masteryLevel === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [updatedLog] = await db
      .update(vocabularyLogs)
      .set({ masteryLevel: Number(masteryLevel) })
      .where(and(eq(vocabularyLogs.id, id), eq(vocabularyLogs.userId, user.id)))
      .returning()

    if (!updatedLog) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLog)
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
      .delete(vocabularyLogs)
      .where(and(eq(vocabularyLogs.id, id), eq(vocabularyLogs.userId, user.id)))
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
