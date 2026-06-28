import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vocabularyLogs } from "@/types/schema"
import { eq, and, asc, sql } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { translateText } from "@/lib/translate"
import { conjugateVerb } from "@/lib/verbs"

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

    // On-the-fly backfill for older logs
    const updatedLogs = await Promise.all(
      logs.map(async (log) => {
        let needsUpdate = false
        const updateFields: Record<string, string | null> = {}

        if (!log.autoTranslation) {
          const auto = await translateText(log.word)
          if (auto) {
            updateFields.autoTranslation = auto
            needsUpdate = true
            log.autoTranslation = auto
          }
        }

        const posList = log.partOfSpeech.split(",").map((p: string) => p.trim().toLowerCase())
        if (posList.includes("verb") && !log.v1) {
          const conj = conjugateVerb(log.word)
          
          updateFields.v1 = conj.v1
          updateFields.v2 = conj.v2
          updateFields.v3 = conj.v3
          updateFields.vIng = conj.vIng
          
          updateFields.v1Translation = log.translation.trim()
          updateFields.v2Translation = await translateText(conj.v2, "en", "id", false)
          updateFields.v3Translation = await translateText(conj.v3, "en", "id", false)
          updateFields.vIngTranslation = await translateText(conj.vIng, "en", "id", false)
          
          needsUpdate = true

          log.v1 = conj.v1
          log.v2 = conj.v2
          log.v3 = conj.v3
          log.vIng = conj.vIng
          log.v1Translation = updateFields.v1Translation
          log.v2Translation = updateFields.v2Translation
          log.v3Translation = updateFields.v3Translation
          log.vIngTranslation = updateFields.vIngTranslation
        }

        if (needsUpdate) {
          await db
            .update(vocabularyLogs)
            .set(updateFields)
            .where(and(eq(vocabularyLogs.id, log.id), eq(vocabularyLogs.userId, user.id)))
        }
        return log
      })
    )

    return NextResponse.json(updatedLogs)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server Error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

function isIndonesianVerb(indoWord: string): boolean {
  const w = indoWord.trim().toLowerCase()
  const commonIndoVerbs = [
    "makan", "minum", "tidur", "pergi", "datang", "duduk", "pulang",
    "main", "bantu", "beli", "jual", "tahu", "lihat", "dengar"
  ]
  if (commonIndoVerbs.includes(w)) return true

  // Match prefixes: me-, ber-, ter-, di-, bel-
  if (/^(me[nmy]?|ber|ter|di|bel|be)[a-z]+/i.test(w)) {
    const falsePositives = [
      "merah", "meja", "mentega", "mentimun", "terang", "terbang",
      "terigu", "dinding", "dinas", "besok", "bebek", "belakang"
    ]
    if (falsePositives.includes(w)) return false
    return true
  }
  return false
}

const SPECIAL_WORDS: Record<string, string> = {
  "at": "preposition",
  "in": "preposition",
  "on": "preposition",
  "of": "preposition",
  "to": "preposition",
  "by": "preposition",
  "for": "preposition",
  "with": "preposition",
  "about": "preposition",
  "against": "preposition",
  "between": "preposition",
  "into": "preposition",
  "through": "preposition",
  "during": "preposition",
  "before": "preposition",
  "after": "preposition",
  "above": "preposition",
  "below": "preposition",
  "from": "preposition",
  "up": "preposition",
  "down": "preposition",
  "out": "preposition",
  "over": "preposition",
  "under": "preposition",
  "off": "preposition",
  "and": "conjunction",
  "but": "conjunction",
  "or": "conjunction",
  "so": "conjunction",
  "because": "conjunction",
  "although": "conjunction",
  "while": "conjunction",
  "as": "conjunction",
  "if": "conjunction",
  "unless": "conjunction",
  "until": "conjunction",
  "since": "conjunction",
  "than": "conjunction",
  "i": "pronoun",
  "me": "pronoun",
  "my": "pronoun",
  "you": "pronoun",
  "he": "pronoun",
  "him": "pronoun",
  "she": "pronoun",
  "her": "pronoun",
  "it": "pronoun",
  "we": "pronoun",
  "us": "pronoun",
  "they": "pronoun",
  "them": "pronoun",
  "who": "pronoun",
  "which": "pronoun",
  "that": "pronoun",
  "this": "pronoun",
  "the": "determiner",
  "a": "determiner",
  "an": "determiner"
}

async function detectPartOfSpeech(englishWord: string, indonesianWord: string): Promise<string> {
  const cleanWord = englishWord.split(/[,;]/)[0].trim().toLowerCase()
  if (!cleanWord) return "noun"

  if (SPECIAL_WORDS[cleanWord]) {
    return SPECIAL_WORDS[cleanWord]
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const partsSet = new Set<string>()
        for (const entry of data) {
          if (entry.meanings) {
            for (const m of entry.meanings) {
              if (m.partOfSpeech) {
                partsSet.add(m.partOfSpeech.toLowerCase())
              }
            }
          }
        }
        if (partsSet.size > 0) {
          return Array.from(partsSet).join(", ")
        }
      }
    }
  } catch (error) {
    console.error("Error auto-detecting part of speech:", error)
  }
  return "noun" // default fallback
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
    const { word, partOfSpeech, definition, translation, exampleSentence, masteryLevel, langDirection } = body

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

    // Auto-translation: if id-en, translate Indonesian to English. Else English to Indonesian.
    let autoTranslation = direction === "id-en" 
      ? await translateText(capitalizedWord, "id", "en")
      : await translateText(capitalizedWord, "en", "id")

    if (autoTranslation) {
      autoTranslation = autoTranslation.trim().charAt(0).toUpperCase() + autoTranslation.trim().slice(1)
    }

    // Automatically detect part of speech based on the English word if not provided
    const englishWordRaw = direction === "id-en" ? capitalizedTranslation : capitalizedWord
    const indonesianWordRaw = direction === "id-en" ? capitalizedWord : capitalizedTranslation
    const detectedPartOfSpeech = partOfSpeech || await detectPartOfSpeech(englishWordRaw, indonesianWordRaw)

    let v1 = null
    let v2 = null
    let v3 = null
    let vIng = null
    let v1Translation = null
    let v2Translation = null
    let v3Translation = null
    let vIngTranslation = null

    const posList = detectedPartOfSpeech.split(",").map((p: string) => p.trim().toLowerCase())
    if (posList.includes("verb")) {
      // For verbs:
      // If direction is id-en, the English word to conjugate is the translation (e.g. "study").
      // If en-id, the English word to conjugate is the main word (e.g. "study").
      const englishVerb = direction === "id-en" ? capitalizedTranslation : capitalizedWord
      const cleanVerb = englishVerb.split(/[,;]/)[0].trim()
      const conj = conjugateVerb(cleanVerb)
      
      v1 = conj.v1 ? conj.v1.trim().charAt(0).toUpperCase() + conj.v1.trim().slice(1) : null
      v2 = conj.v2 ? conj.v2.trim().charAt(0).toUpperCase() + conj.v2.trim().slice(1) : null
      v3 = conj.v3 ? conj.v3.trim().charAt(0).toUpperCase() + conj.v3.trim().slice(1) : null
      vIng = conj.vIng ? conj.vIng.trim().charAt(0).toUpperCase() + conj.vIng.trim().slice(1) : null
      
      // V1 translation is the Indonesian equivalent (either word or translation)
      v1Translation = direction === "id-en" ? capitalizedWord : capitalizedTranslation
      
      // The translations for conjugated forms are always translated to Indonesian (from English)
      const rawV2Trans = await translateText(conj.v2, "en", "id", false)
      v2Translation = rawV2Trans ? rawV2Trans.trim().charAt(0).toUpperCase() + rawV2Trans.trim().slice(1) : null

      const rawV3Trans = await translateText(conj.v3, "en", "id", false)
      v3Translation = rawV3Trans ? rawV3Trans.trim().charAt(0).toUpperCase() + rawV3Trans.trim().slice(1) : null

      const rawVIngTrans = await translateText(conj.vIng, "en", "id", false)
      vIngTranslation = rawVIngTrans ? rawVIngTrans.trim().charAt(0).toUpperCase() + rawVIngTrans.trim().slice(1) : null
    }

    const [newLog] = await db
      .insert(vocabularyLogs)
      .values({
        userId: user.id,
        word: capitalizedWord,
        partOfSpeech: detectedPartOfSpeech,
        definition: definition || "n/a",
        translation: capitalizedTranslation,
        exampleSentence: exampleSentence ? exampleSentence.trim() : null,
        masteryLevel: masteryLevel !== undefined ? Number(masteryLevel) : 3,
        memorized: false,
        autoTranslation,
        v1,
        v2,
        v3,
        vIng,
        v1Translation,
        v2Translation,
        v3Translation,
        vIngTranslation,
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

    // Retrieve existing log to check its translation and autoTranslation
    const existingLogs = await db
      .select()
      .from(vocabularyLogs)
      .where(and(eq(vocabularyLogs.id, id), eq(vocabularyLogs.userId, user.id)))
      .limit(1)

    if (existingLogs.length === 0) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    const currentLog = existingLogs[0]

    const updateData: {
      masteryLevel?: number
      memorized?: boolean
      translation?: string
      autoTranslation?: string | null
    } = {}
    if (masteryLevel !== undefined) updateData.masteryLevel = Number(masteryLevel)
    if (memorized !== undefined) updateData.memorized = Boolean(memorized)

    // If marked as memorized (checklist) and translation does not match autoTranslation, update it
    if (Boolean(memorized) === true) {
      const currentTranslation = currentLog.translation.trim()
      if (currentLog.autoTranslation) {
        if (currentTranslation !== currentLog.autoTranslation.trim()) {
          updateData.translation = currentLog.autoTranslation
        }
      } else {
        const auto = await translateText(currentLog.word)
        if (auto) {
          updateData.autoTranslation = auto
          if (currentTranslation !== auto.trim()) {
            updateData.translation = auto
          }
        }
      }
    }

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
