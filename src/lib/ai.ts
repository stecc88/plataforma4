import ZAI from 'z-ai-web-dev-sdk'

/* ─── Singleton ZAI Instance ─────────────────────────────────── */

let zaiInstance: any = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/* ─── Italian Proficiency Levels ─────────────────────────────── */

export type ItalianLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/* ─── Custom Error Classes ───────────────────────────────────── */

export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`)
    this.name = 'AITimeoutError'
  }
}

export class AIResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AIResponseError'
  }
}

/* ─── Timeout Helper ─────────────────────────────────────────── */

const AI_TIMEOUT_MS = 60_000 // 60 seconds

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = AI_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AITimeoutError(timeoutMs))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/* ─── Essay Correction Types ─────────────────────────────────── */

export interface EssayError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'syntax' | 'vocabulary' | 'style'
  original: string
  correction: string
  explanation: string
  position: number
}

export interface EssaySuggestions {
  connectors: string[]
  synonyms: Array<{ word: string; alternatives: string[] }>
}

export interface EssayCorrection {
  correctedText: string
  score: number
  errors: EssayError[]
  grammarNotes: string[]
  vocabularyNotes: string[]
  styleNotes: string[]
  suggestions: EssaySuggestions
  studyTopics: string[]
}

/* ─── Lesson Preparation ─────────────────────────────────────── */

export interface LessonPreparation {
  title: string
  level: ItalianLevel
  objectives: string[]
  activities: Array<{
    name: string
    description: string
    duration: string
    materials: string[]
  }>
  exercises: Array<{
    type: string
    instruction: string
    content: string
    answer: string
  }>
  homework: string[]
  notes: string[]
}

/* ─── JSON Extraction Helper ─────────────────────────────────── */

function extractJSON(content: string): string {
  let jsonStr = content.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }
  return jsonStr
}

/* ─── correctEssay ───────────────────────────────────────────── */

export async function correctEssay(
  text: string,
  level: ItalianLevel = 'B1'
): Promise<EssayCorrection> {
  try {
    const zai = await getZAI()

    const systemPrompt = `Sei un esperto docente di lingua italiana. Il tuo compito è correggere testi scritti in italiano da studenti di livello ${level}.
Analizza il testo e restituisci UNICAMENTE un oggetto JSON valido con la seguente struttura:
{
  "correctedText": "il testo corretto completo",
  "score": numero da 0 a 100,
  "errors": [
    {
      "type": "grammar|spelling|punctuation|syntax|vocabulary|style",
      "original": "la parte errata",
      "correction": "la correzione",
      "explanation": "spiegazione in italiano dell'errore",
      "position": indice_numerico
    }
  ],
  "grammarNotes": ["nota grammaticale 1", "nota grammaticale 2"],
  "vocabularyNotes": ["nota sul vocabolario 1"],
  "styleNotes": ["nota sullo stile 1"],
  "suggestions": {
    "connectors": ["connettore 1", "connettore 2"],
    "synonyms": [{"word": "parola", "alternatives": ["sinonimo1", "sinonimo2"]}]
  },
  "studyTopics": ["argomento di studio 1", "argomento di studio 2"]
}
Rispondi SOLO con il JSON, nessun altro testo.`

    const completion: any = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
      }),
      AI_TIMEOUT_MS
    )

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new AIResponseError('Nessuna risposta dal modello AI')
    }

    // Extract and parse JSON
    const jsonStr = extractJSON(content)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      throw new AIResponseError('Risposta AI non è un JSON valido')
    }

    const p = parsed as Record<string, unknown>

    // Validate essential fields
    if (typeof p.score !== 'number' || !p.correctedText) {
      throw new AIResponseError('Struttura della risposta AI non valida')
    }

    return {
      correctedText: String(p.correctedText),
      score: Math.max(0, Math.min(100, p.score as number)),
      errors: Array.isArray(p.errors) ? p.errors as EssayError[] : [],
      grammarNotes: Array.isArray(p.grammarNotes) ? p.grammarNotes as string[] : [],
      vocabularyNotes: Array.isArray(p.vocabularyNotes) ? p.vocabularyNotes as string[] : [],
      styleNotes: Array.isArray(p.styleNotes) ? p.styleNotes as string[] : [],
      suggestions: (p.suggestions as EssaySuggestions) || { connectors: [], synonyms: [] },
      studyTopics: Array.isArray(p.studyTopics) ? p.studyTopics as string[] : [],
    }
  } catch (error) {
    // Log for server-side debugging (never expose stack traces to client)
    console.error('[ai] correctEssay error:', error instanceof Error ? error.message : error)

    // Re-throw with a safe message — the API route will handle the response
    if (error instanceof AITimeoutError) {
      throw error
    }
    if (error instanceof AIResponseError) {
      throw error
    }

    // Wrap unexpected errors
    throw new AIResponseError('Errore nella correzione automatica. Riprova più tardi.')
  }
}

/* ─── generateLessonPreparation ──────────────────────────────── */

export async function generateLessonPreparation(
  weaknesses: string[],
  level: ItalianLevel = 'B1'
): Promise<LessonPreparation> {
  try {
    const zai = await getZAI()

    const systemPrompt = `Sei un docente esperto di lingua italiana. Genera una preparazione di lezione personalizzata per uno studente di livello ${level} che ha le seguenti debolezze: ${weaknesses.join(', ')}.
Restituisci UNICAMENTE un oggetto JSON valido con la seguente struttura:
{
  "title": "titolo della lezione",
  "level": "${level}",
  "objectives": ["obiettivo 1", "obiettivo 2"],
  "activities": [
    {
      "name": "nome attività",
      "description": "descrizione dettagliata",
      "duration": "20 minuti",
      "materials": ["materiale 1"]
    }
  ],
  "exercises": [
    {
      "type": "fill_blank|multiple_choice|translation|writing",
      "instruction": "istruzioni per l'esercizio",
      "content": "contenuto dell'esercizio",
      "answer": "risposta corretta"
    }
  ],
  "homework": ["compito 1", "compito 2"],
  "notes": ["nota per l'insegnante 1"]
}
Rispondi SOLO con il JSON, nessun altro testo.`

    const completion: any = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Genera una lezione per lavorare su: ${weaknesses.join(', ')}` },
        ],
        temperature: 0.7,
      }),
      AI_TIMEOUT_MS
    )

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new AIResponseError('Nessuna risposta dal modello AI')
    }

    // Extract and parse JSON
    const jsonStr = extractJSON(content)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      throw new AIResponseError('Risposta AI non è un JSON valido')
    }

    const p = parsed as Record<string, unknown>

    return {
      title: String(p.title || `Lezione - ${weaknesses[0] || 'Italiano'}`),
      level: (p.level as ItalianLevel) || level,
      objectives: Array.isArray(p.objectives) ? p.objectives as string[] : [],
      activities: Array.isArray(p.activities) ? p.activities as LessonPreparation['activities'] : [],
      exercises: Array.isArray(p.exercises) ? p.exercises as LessonPreparation['exercises'] : [],
      homework: Array.isArray(p.homework) ? p.homework as string[] : [],
      notes: Array.isArray(p.notes) ? p.notes as string[] : [],
    }
  } catch (error) {
    // Log for server-side debugging
    console.error('[ai] generateLessonPreparation error:', error instanceof Error ? error.message : error)

    // Re-throw — the API route will handle the response
    if (error instanceof AITimeoutError) {
      throw error
    }
    if (error instanceof AIResponseError) {
      throw error
    }

    throw new AIResponseError('Errore nella generazione della lezione. Riprova più tardi.')
  }
}
