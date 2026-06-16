import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { readingJournal } from "@/types/schema"
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

    const books = await db
      .select()
      .from(readingJournal)
      .where(eq(readingJournal.userId, user.id))
      .orderBy(desc(readingJournal.createdAt))

    return NextResponse.json(books)
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
    const { title, author, status, rating, review } = body

    if (!title || !author || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const isCompleted = status === "Completed"
    const finishedAt = isCompleted ? new Date() : null

    const [newBook] = await db
      .insert(readingJournal)
      .values({
        userId: user.id,
        title,
        author,
        status,
        rating: isCompleted && rating !== undefined ? Number(rating) : null,
        review: isCompleted && review !== undefined ? review : null,
        finishedAt,
      })
      .returning()

    return NextResponse.json(newBook)
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
    const { id, title, author, status, rating, review } = body

    if (!id) {
      return NextResponse.json({ error: "Missing book ID" }, { status: 400 })
    }

    // Fetch current book state to check status
    const [currentBook] = await db
      .select()
      .from(readingJournal)
      .where(and(eq(readingJournal.id, id), eq(readingJournal.userId, user.id)))

    if (!currentBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Determine finishedAt values
    let finishedAtVal = currentBook.finishedAt
    if (status !== undefined) {
      if (status === "Completed") {
        // Set finishedAt to now if it wasn't completed before, or keep existing one
        finishedAtVal = currentBook.status === "Completed" ? currentBook.finishedAt : new Date()
      } else {
        // Reset finishedAt to null if status changed from Completed to something else
        finishedAtVal = null
      }
    }

    const isCompleted = status !== undefined ? status === "Completed" : currentBook.status === "Completed"

    const updateValues: Partial<typeof readingJournal.$inferInsert> = {}
    if (title !== undefined) updateValues.title = title
    if (author !== undefined) updateValues.author = author
    if (status !== undefined) updateValues.status = status
    
    // Set rating/review to null if status is not Completed
    if (isCompleted) {
      if (rating !== undefined) updateValues.rating = rating !== null ? Number(rating) : null
      if (review !== undefined) updateValues.review = review
    } else {
      updateValues.rating = null
      updateValues.review = null
    }
    updateValues.finishedAt = finishedAtVal

    const [updatedBook] = await db
      .update(readingJournal)
      .set(updateValues)
      .where(and(eq(readingJournal.id, id), eq(readingJournal.userId, user.id)))
      .returning()

    return NextResponse.json(updatedBook)
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
      return NextResponse.json({ error: "Missing book ID" }, { status: 400 })
    }

    const [deletedBook] = await db
      .delete(readingJournal)
      .where(and(eq(readingJournal.id, id), eq(readingJournal.userId, user.id)))
      .returning()

    if (!deletedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
