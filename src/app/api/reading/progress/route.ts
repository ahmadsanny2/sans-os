import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { readingJournal, readingProgressLogs } from "@/types/schema"
import { eq, and, desc } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId parameter" }, { status: 400 })
    }

    const logs = await db
      .select()
      .from(readingProgressLogs)
      .where(and(eq(readingProgressLogs.bookId, bookId), eq(readingProgressLogs.userId, user.id)))
      .orderBy(desc(readingProgressLogs.createdAt))

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
    const { bookId, progress, notes } = body

    if (!bookId || !progress) {
      return NextResponse.json({ error: "Missing bookId or progress content" }, { status: 400 })
    }

    // Check if book exists and belongs to user
    const [book] = await db
      .select()
      .from(readingJournal)
      .where(and(eq(readingJournal.id, bookId), eq(readingJournal.userId, user.id)))

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Insert progress log
    const [newLog] = await db
      .insert(readingProgressLogs)
      .values({
        userId: user.id,
        bookId,
        progress: progress.trim(),
        notes: notes ? notes.trim() : null,
      })
      .returning()

    // Automatically update currentProgress (and switch status to Reading if it was To Read)
    const updateValues: Partial<typeof readingJournal.$inferInsert> = {
      currentProgress: progress.trim(),
    }
    if (book.status === "To Read") {
      updateValues.status = "Reading"
    }

    await db
      .update(readingJournal)
      .set(updateValues)
      .where(and(eq(readingJournal.id, bookId), eq(readingJournal.userId, user.id)))

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
      .delete(readingProgressLogs)
      .where(and(eq(readingProgressLogs.id, id), eq(readingProgressLogs.userId, user.id)))
      .returning()

    if (!deletedLog) {
      return NextResponse.json({ error: "Progress log not found" }, { status: 404 })
    }

    // Fetch remaining latest log for this book to update currentProgress on readingJournal
    const remainingLogs = await db
      .select()
      .from(readingProgressLogs)
      .where(and(eq(readingProgressLogs.bookId, deletedLog.bookId), eq(readingProgressLogs.userId, user.id)))
      .orderBy(desc(readingProgressLogs.createdAt))

    const latestProgress = remainingLogs.length > 0 ? remainingLogs[0].progress : null

    await db
      .update(readingJournal)
      .set({ currentProgress: latestProgress })
      .where(and(eq(readingJournal.id, deletedLog.bookId), eq(readingJournal.userId, user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
