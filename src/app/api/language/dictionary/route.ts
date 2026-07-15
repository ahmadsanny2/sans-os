import { NextResponse } from "next/server"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const letter = searchParams.get("letter")
    const query = searchParams.get("q")
    const word = searchParams.get("word")

    // Case 1: Fetch word details (translation only)
    if (word) {
      const cleanWord = word.trim().toLowerCase()

      // Fetch Translation from Google Translate
      const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(cleanWord)}`
      let translation = ""
      
      try {
        const transRes = await fetch(translateUrl)
        if (transRes.ok) {
          const transData = await transRes.json()
          if (transData && transData[0] && transData[0][0]) {
            translation = transData[0][0][0]
          }
        }
      } catch (err) {
        console.error("Translation API error:", err)
      }

      return NextResponse.json({
        word: cleanWord,
        partOfSpeech: "noun",
        definition: "n/a",
        translation: translation || "No translation found.",
        alternativeTranslations: [],
        dictionaryData: null
      })
    }

    // Case 2: List words from Datamuse API
    let searchUrl = ""
    if (query) {
      searchUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(query.trim().toLowerCase())}*&max=50`
    } else if (letter) {
      searchUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(letter.trim().toLowerCase())}*&max=50`
    } else {
      searchUrl = `https://api.datamuse.com/words?sp=a*&max=50`
    }

    const res = await fetch(searchUrl)
    if (!res.ok) {
      throw new Error("Datamuse API error")
    }
    const data = await res.json()
    let wordsList = data
      .map((item: { word: string }) => ({ word: item.word }))
      .sort((a: { word: string }, b: { word: string }) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()))
    
    if (query) {
      const cleanQuery = query.trim().toLowerCase()
      wordsList = wordsList.filter((item: { word: string }) => item.word.toLowerCase() !== cleanQuery)
      wordsList.unshift({ word: cleanQuery })
    }
    
    return NextResponse.json(wordsList)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
