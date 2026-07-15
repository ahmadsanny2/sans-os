import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vocabularyLogs } from "@/types/schema"
import { eq, and, asc, sql } from "drizzle-orm"
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
      .orderBy(asc(vocabularyLogs.word))

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
    const { word, translation, langDirection, masteryLevel } = body

    if (!word || !translation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const direction = langDirection || "en-id"

    // Check if the word already exists for the user (case-insensitive & trimmed)
    const existingWords = await db
      .select()
      .from(vocabularyLogs)
      .where(
        and(
          eq(vocabularyLogs.userId, user.id),
          sql`lower(trim(${vocabularyLogs.word})) = ${word.trim().toLowerCase()}`
        )
      )
      .limit(1)

    if (existingWords.length > 0) {
      return NextResponse.json({ error: "This vocabulary word is already registered" }, { status: 400 })
    }

    const capitalizedWord = word.trim().charAt(0).toUpperCase() + word.trim().slice(1)
    const capitalizedTranslation = translation.trim().charAt(0).toUpperCase() + translation.trim().slice(1)

    const [newLog] = await db
      .insert(vocabularyLogs)
      .values({
        userId: user.id,
        word: capitalizedWord,
        partOfSpeech: "noun",
        definition: "n/a",
        translation: capitalizedTranslation,
        exampleSentence: null,
        masteryLevel: masteryLevel !== undefined ? Number(masteryLevel) : 3,
        memorized: false,
        autoTranslation: null,
        v1: null,
        v2: null,
        v3: null,
        vIng: null,
        v1Translation: null,
        v2Translation: null,
        v3Translation: null,
        vIngTranslation: null,
        langDirection: direction,
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
    const { id, masteryLevel, memorized } = body

    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updateData: {
      masteryLevel?: number
      memorized?: boolean
    } = {}
    if (masteryLevel !== undefined) updateData.masteryLevel = Number(masteryLevel)
    if (memorized !== undefined) updateData.memorized = Boolean(memorized)

    const [updatedLog] = await db
      .update(vocabularyLogs)
      .set(updateData)
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
