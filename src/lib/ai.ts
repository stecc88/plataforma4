import type {
  AICorrection,
  CertificationType,
  ItalianLevel,
  TextType,
} from './ai-correction.types'

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

/* ─── Re-export types for backward compatibility ─────────────── */

export type { ItalianLevel } from './ai-correction.types'

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

/* ─── Timeout Helper ─────────────────────────────────────────── */

const AI_TIMEOUT_MS = 120_000 // 2 minutes for complex correction

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

/* ─── JSON Extraction Helper ─────────────────────────────────── */

function extractJSON(content: string): string {
  let jsonStr = content.trim()

  // Remove markdown code fences if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // If the content starts with { and ends with }, assume it's already pure JSON
  if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
    return jsonStr
  }

  // Try to find the first { and last } as a fallback
  const firstBrace = jsonStr.indexOf('{')
  const lastBrace = jsonStr.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
  }

  return jsonStr
}

/* ─── Gemini REST API (Primary — works on Vercel) ───────────── */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

// Model priority: try Gemini 2.5 Flash first, fall back to 2.0 Flash
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.0-flash',
]

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
      role?: string
    }
    finishReason?: string
  }>
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

/**
 * Call the Gemini REST API directly via fetch().
 * Works in ALL environments — Vercel, local dev, Docker, etc.
 * No SDK dependency, no config file needed.
 * Just needs GEMINI_API_KEY environment variable.
 * Tries multiple models in priority order.
 */
async function callGeminiREST(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new AIResponseError('GEMINI_API_KEY non configurata. Imposta la variabile d\'ambiente.')
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
    },
  }

  // Try each model in priority order
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    console.log('[AI] Calling Gemini REST API, model:', model)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn('[AI] Gemini API error for model', model, ':', response.status, errorText.substring(0, 300))

        // Don't retry on these errors — try next model
        if (errorText.includes('User location is not supported')) {
          console.warn('[AI] Model', model, 'geo-blocked, trying next...')
          continue
        }
        if (response.status === 404) {
          console.warn('[AI] Model', model, 'not found, trying next...')
          continue
        }
        if (response.status === 429) {
          console.warn('[AI] Model', model, 'rate limited, trying next...')
          continue
        }

        // For other errors, parse and throw
        try {
          const errorJson = JSON.parse(errorText)
          throw new AIResponseError(`Errore API Gemini (${response.status}): ${errorJson?.error?.message || errorText.substring(0, 200)}`)
        } catch (e) {
          if (e instanceof AIResponseError) throw e
          throw new AIResponseError(`Errore API Gemini (${response.status}): ${errorText.substring(0, 200)}`)
        }
      }

      const data: GeminiResponse = await response.json()

      if (data.error) {
        console.error('[AI] Gemini API returned error:', data.error)
        throw new AIResponseError(`Errore Gemini: ${data.error.message || 'Errore sconosciuto'}`)
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!content) {
        console.error('[AI] No content in Gemini response:', JSON.stringify(data).substring(0, 500))
        throw new AIResponseError('Nessuna risposta dal modello AI')
      }

      console.log('[AI] Successfully used Gemini REST API, model:', model)
      return content
    } catch (error) {
      if (error instanceof AIResponseError) throw error
      console.warn('[AI] Unexpected error for model', model, ':', error)
      continue
    }
  }

  // All models failed
  throw new AIResponseError('Nessun modello Gemini disponibile. Provati: ' + GEMINI_MODELS.join(', '))
}

/* ─── Z-AI SDK Fallback (works locally through proxy) ────────── */

let zaiInstance: InstanceType<typeof import('z-ai-web-dev-sdk').default> | null = null

async function callZAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // This fallback only works locally where .z-ai-config exists.
  // On Vercel/production, it will gracefully fail because no config file exists.
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default

    if (!zaiInstance) {
      zaiInstance = await ZAI.create()
    }

    const completion = await zaiInstance.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new AIResponseError('Nessuna risposta dal modello AI (Z-AI fallback)')
    }

    return content
  } catch (error) {
    // Wrap ALL errors as AIResponseError so they're handled consistently
    if (error instanceof AIResponseError) throw error
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[AI] Z-AI SDK unavailable:', msg.substring(0, 200))
    throw new AIResponseError(`Z-AI SDK non disponibile: ${msg.substring(0, 150)}`)
  }
}

/* ─── Unified AI Call with Fallback ──────────────────────────── */

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Strategy:
  // 1. Try Gemini REST API with model fallback (works on Vercel US/EU servers)
  // 2. If all Gemini models fail (geo-restriction, quota, etc.), try Z-AI SDK (works locally through proxy)
  const errors: string[] = []

  // 1. Try Gemini REST API
  if (GEMINI_API_KEY) {
    try {
      const content = await callGeminiREST(systemPrompt, userPrompt)
      return content
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn('[AI] All Gemini REST API models failed:', msg.substring(0, 200))
      errors.push(`Gemini: ${msg.substring(0, 100)}`)
    }
  } else {
    errors.push('Gemini: GEMINI_API_KEY not set')
  }

  // 2. Try Z-AI SDK fallback (works locally through proxy)
  try {
    const content = await callZAI(systemPrompt, userPrompt)
    console.log('[AI] Successfully used Z-AI SDK fallback')
    return content
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[AI] Z-AI SDK fallback failed:', msg.substring(0, 200))
    errors.push(`Z-AI: ${msg.substring(0, 100)}`)
  }

  // 3. All methods failed
  throw new AIResponseError(
    `Impossibile contattare il servizio AI. Errori: ${errors.join(' | ')}`
  )
}

/* ─── PLIDA/CILS System Prompt ───────────────────────────────── */

const SYSTEM_PROMPT = `Sei un esaminatore certificato di italiano come lingua straniera,
specializzato nella correzione della PRODUZIONE SCRITTA delle
certificazioni PLIDA (Società Dante Alighieri) e CILS (Università
per Stranieri di Siena), dai livelli A1 a C2 secondo il QCER.

Il tuo unico compito è correggere testi scritti degli studenti
con un feedback pedagogico preciso, utile e completo.
Non proponi esercizi di ascolto, orale o grammatica isolata.
Correggi soltanto ciò che lo studente ti invia scritto.

══════════════════════════════════════════════
IDENTITÀ E COMPORTAMENTO
══════════════════════════════════════════════
- Parla SEMPRE in italiano all'interno dei campi testuali.
  Eccezione: per A1/A2, puoi aggiungere una riga nella L1 dello
  studente SOLO se esplicitamente richiesto.
- Tono: professionale, diretto, incoraggiante. Mai condiscendente.
- Adatta la profondità del feedback al livello dichiarato:
  A1/A2 → errori prioritari soltanto (non sovraccaricare).
  B1/B2 → tutti gli errori morfosintattici + stile essenziale.
  C1/C2 → errori + registro + coesione + stile avanzato.

══════════════════════════════════════════════
FORMATO DI RISPOSTA — JSON PURO OBBLIGATORIO
══════════════════════════════════════════════
Quando ricevi un testo da correggere, rispondi ESCLUSIVAMENTE
con un oggetto JSON valido. Nessun testo prima o dopo.
Nessun backtick markdown. Solo JSON puro.

La struttura è la seguente (rispetta esattamente i nomi dei campi):

{
  "markedText": string,
  "correctedText": string,
  "score": number,
  "certification": "PLIDA" | "CILS",
  "level": string,

  "scoreBreakdown": {
    "communicativeAdequacy": number,
    "grammaticalAccuracy": number,
    "lexicalRichness": number,
    "textualCohesion": number
  },

  "errors": [
    {
      "id": number,
      "category": string,
      "type": "grammar" | "spelling" | "punctuation" | "syntax" | "vocabulary" | "style",
      "original": string,
      "correction": string,
      "regola": string,
      "exampleCorrect": string,
      "exampleWrong": string,
      "occurrences": number,
      "occurrencePositions": string
    }
  ],

  "strengths": [
    {
      "category": "connectors" | "vocabulary" | "structure" | "style" | "coherence" | "other",
      "label": string,
      "description": string,
      "examples": string[]
    }
  ],

  "suggestions": {
    "connectors": {
      "used": string[],
      "recommended": string[]
    },
    "synonyms": [
      {
        "word": string,
        "count": number,
        "alternatives": string[]
      }
    ]
  },

  "studyTopics": string[],

  "finalNote": string
}

══════════════════════════════════════════════
ISTRUZIONI PER OGNI CAMPO
══════════════════════════════════════════════

── markedText ──
Riproponi il testo parola per parola con le marcature inline:
  ~~errore~~ → **correzione**
Per miglioramenti stilistici (non errori):
  [originale] → {versione migliore}

── correctedText ──
Il testo completo riscritto con tutte le correzioni applicate,
senza nessuna marcatura. Pronto per la riscrittura dello studente.

── score ──
Numero intero 0–100. Calcola come media pesata di scoreBreakdown.

── scoreBreakdown ──
Per CILS: ogni campo è /5, totale /20. Moltiplica ×5 per il campo score.
Per PLIDA: ogni campo è /25, totale /100. Usa direttamente per score.
  - communicativeAdequacy: realizzazione del compito comunicativo
  - grammaticalAccuracy: correttezza morfosintattica e ortografica
  - lexicalRichness: varietà e appropriatezza del lessico
  - textualCohesion: organizzazione, coerenza, uso dei connettivi

── errors ──
Un oggetto per ogni errore distinto. Se lo stesso errore appare
più volte, crea UN solo oggetto e usa i campi:
  - occurrences: quante volte appare
  - occurrencePositions: descrizione testuale delle posizioni
    es. "righe 1, 4 e 7"

Per ogni errore:
  - category: nome grammaticale in maiuscolo e italiano
    (es. "AUSILIARE NEL PASSATO PROSSIMO", "CONGIUNTIVO PRESENTE",
     "ACCORDO NOME-AGGETTIVO", "PREPOSIZIONE DI LUOGO", ecc.)
  - regola: spiegazione teorica chiara, 2–4 frasi. Includi la regola
    completa con eccezioni importanti. Linguaggio accessibile.
  - exampleCorrect: frase corretta con la stessa struttura dell'errore
  - exampleWrong: la stessa frase sbagliata per contrasto visivo

── strengths ──
Almeno 2 punti di forza SPECIFICI e CONCRETI. NON generici.
NON scrivere "buon uso del lessico". Scrivi invece:
"Ottimo uso del connettivo 'tuttavia' per introdurre la
contrargomentazione alla riga 3."

Categorie disponibili:
  - "connectors": uso efficace di connettivi o locuzioni avversative/
    causali/consecutive
  - "vocabulary": lessico vario, preciso, appropriato al registro
  - "structure": buona organizzazione del testo, paragrafi coerenti
  - "style": registro adeguato, varietà sintattica
  - "coherence": sviluppo logico dell'argomentazione
  - "other": altro punto di forza specifico

Il campo "examples" deve contenere le parole/frasi esatte del testo
che dimostrano il punto di forza. Es. ["tuttavia", "di conseguenza"].

── suggestions.connectors ──
  - used: OBBLIGATORIO. Elenca TUTTI i connettivi e le congiunzioni
    presenti nel testo, anche i più semplici (e, ma, però, perché,
    che, se, quando, mentre, quindi, poi, anche, ancora, ecc.).
    Cerca attentamente nel testo: ogni congiunzione conta.
    Es. ["e", "ma", "che", "perché", "quindi"]
  - recommended: OBBLIGATORIO. 5–8 connettivi appropriati al livello
    e al tipo di testo che lo studente NON ha usato e potrebbe integrare.
    Per A1/A2: connettivi semplici (poi, anche, però, allora, infatti,
    perciò, prima, dopo).
    Per B1/B2: connettivi intermedi (tuttavia, inoltre, nonostante,
    di conseguenza, eppure, sebbene, affinché, dato che, benché).
    Per C1/C2: connettivi avanzati (ciononostante, a tal proposito,
    in virtù di, laddove, giacché, al contempo, peraltro, nondimeno).
    NON includere connettivi già presenti in "used".

── suggestions.synonyms ──
Analizza il testo e identifica le parole PIENE (non articoli,
preposizioni o ausiliari) che si ripetono 2 o più volte.
Per ognuna:
  - word: la parola ripetuta (forma base / lemma)
  - count: numero esatto di occorrenze nel testo (conta attentamente!)
  - alternatives: 4–6 sinonimi ITALIANI appropriati al livello e al registro.
    IMPORTANTE: i sinonimi devono essere parole ITALIANE, non straniere.
    Per A1/A2: sinonimi semplici e comuni.
    Per C1/C2: sinonimi stilisticamente elevati.
Ordina per frequenza decrescente (la più ripetuta prima).
Se nessuna parola si ripete ≥2 volte, restituisci array vuoto [].

── studyTopics ──
Array di 2–4 argomenti grammaticali o testuali prioritari da rivedere.
Formulati come titoli di capitolo: es. "Scelta dell'ausiliare nel
passato prossimo", "Uso del congiuntivo nelle subordinate", ecc.

── finalNote ──
Una frase conclusiva incoraggiante e personalizzata (non generica).
Riferisciti a qualcosa di specifico del testo o del progresso.

══════════════════════════════════════════════
REGOLE AGGIUNTIVE
══════════════════════════════════════════════
- Se il testo non ha errori, errors = [] e score ≥ 85.
- Non inventare errori inesistenti.
- Se lo stesso errore appare più volte, UN solo oggetto con occurrences > 1.
- Il JSON deve essere valido: nessuna virgola finale, nessun commento.
- Non uscire mai dal formato JSON quando correggi un testo.

══════════════════════════════════════════════
LIVELLI — ASPETTATIVE E TOLLERANZE
══════════════════════════════════════════════
A1: priorità a verbi al presente e genere dei nomi.
    Tollera imprecisioni articolari e preposizionali minori.
A2: correggi passato prossimo, accordo aggettivi, preposizioni
    di luogo/tempo. Tollera congiuntivo mancante.
B1: aggiungi congiuntivo presente, condizionale semplice,
    pronomi diretti/indiretti.
B2: aggiungi congiuntivo imperfetto, periodo ipotetico,
    discorso indiretto, coesione testuale.
C1: massima attenzione a registro, nominalizzazioni,
    costruzioni implicite, punteggiatura avanzata.
C2: correzione stilistica completa. Segnala scelte subottimali
    di registro, ridondanze, calchi dalla L1.`

/* ─── Parse Correction from AI response ──────────────────────── */

function parseCorrectionResponse(
  content: string,
  certification: CertificationType,
  level: ItalianLevel
): AICorrection {
  // Extract and parse JSON
  const jsonStr = extractJSON(content)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('[AI] JSON parse failed. Raw content (first 300):', content.substring(0, 300))
    console.error('[AI] Extracted JSON (first 300):', jsonStr.substring(0, 300))
    console.error('[AI] Parse error:', parseError)
    throw new AIResponseError('Risposta AI non è un JSON valido')
  }

  const p = parsed as Record<string, unknown>

  // Validate essential fields
  if (typeof p.score !== 'number' || !p.correctedText) {
    console.error('[AI] Invalid structure. score:', typeof p.score, 'correctedText:', !!p.correctedText)
    throw new AIResponseError('Struttura della risposta AI non valida')
  }

  // Build the AICorrection with safe defaults
  const correction: AICorrection = {
    markedText: String(p.markedText || ''),
    correctedText: String(p.correctedText),
    score: Math.max(0, Math.min(100, p.score as number)),
    certification: (p.certification as CertificationType) || certification,
    level: String(p.level || level),
    scoreBreakdown: {
      communicativeAdequacy:
        typeof (p.scoreBreakdown as Record<string, unknown>)?.communicativeAdequacy === 'number'
          ? (p.scoreBreakdown as Record<string, unknown>).communicativeAdequacy as number
          : 0,
      grammaticalAccuracy:
        typeof (p.scoreBreakdown as Record<string, unknown>)?.grammaticalAccuracy === 'number'
          ? (p.scoreBreakdown as Record<string, unknown>).grammaticalAccuracy as number
          : 0,
      lexicalRichness:
        typeof (p.scoreBreakdown as Record<string, unknown>)?.lexicalRichness === 'number'
          ? (p.scoreBreakdown as Record<string, unknown>).lexicalRichness as number
          : 0,
      textualCohesion:
        typeof (p.scoreBreakdown as Record<string, unknown>)?.textualCohesion === 'number'
          ? (p.scoreBreakdown as Record<string, unknown>).textualCohesion as number
          : 0,
    },
    errors: Array.isArray(p.errors) ? (p.errors as AICorrection['errors']) : [],
    strengths: Array.isArray(p.strengths) ? (p.strengths as AICorrection['strengths']) : [],
    suggestions: {
      connectors: {
        used:
          Array.isArray((p.suggestions as Record<string, unknown>)?.connectors)
            ? ((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>)
                ?.used && Array.isArray(((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>).used)
              ? (((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>).used as string[])
              : []
            : [],
        recommended:
          Array.isArray((p.suggestions as Record<string, unknown>)?.connectors)
            ? ((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>)
                ?.recommended && Array.isArray(((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>).recommended)
              ? (((p.suggestions as Record<string, unknown>).connectors as Record<string, unknown>).recommended as string[])
              : []
            : [],
      },
      synonyms: Array.isArray((p.suggestions as Record<string, unknown>)?.synonyms)
        ? ((p.suggestions as Record<string, unknown>).synonyms as AICorrection['suggestions']['synonyms'])
        : [],
    },
    studyTopics: Array.isArray(p.studyTopics) ? (p.studyTopics as string[]) : [],
    finalNote: String(p.finalNote || ''),
  }

  return correction
}

/* ─── correctWriting ─────────────────────────────────────────── */

export interface CorrectWritingOptions {
  text: string
  level: ItalianLevel
  certification: CertificationType
  textType: TextType
}

export async function correctWriting(
  options: CorrectWritingOptions
): Promise<AICorrection> {
  const { text, level, certification, textType } = options

  try {
    const userPrompt = `Livello QCER: ${level}
Certificazione: ${certification}
Tipo di testo: ${textType}

Testo da correggere:

${text}`

    console.log('[AI] Sending correction request for level:', level, 'certification:', certification)

    const content = await withTimeout(
      callAI(SYSTEM_PROMPT, userPrompt),
      AI_TIMEOUT_MS
    )

    console.log('[AI] Got response, length:', content.length, 'first 100 chars:', content.substring(0, 100))

    const correction = parseCorrectionResponse(content, certification, level)

    console.log('[AI] Correction complete. Score:', correction.score, 'Errors:', correction.errors.length)

    return correction
  } catch (error) {
    console.error('[AI] Correction error:', error instanceof Error ? error.message : error)
    if (error instanceof AITimeoutError) {
      throw error
    }
    if (error instanceof AIResponseError) {
      throw error
    }

    throw new AIResponseError('Errore nella correzione automatica. Riprova più tardi.')
  }
}

/* ─── generateLessonPreparation ──────────────────────────────── */

export async function generateLessonPreparation(
  weaknesses: string[],
  level: ItalianLevel = 'B1'
): Promise<LessonPreparation> {
  try {
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

    const content = await withTimeout(
      callAI(systemPrompt, `Genera una lezione per lavorare su: ${weaknesses.join(', ')}`),
      AI_TIMEOUT_MS
    )

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
      objectives: Array.isArray(p.objectives) ? (p.objectives as string[]) : [],
      activities: Array.isArray(p.activities) ? (p.activities as LessonPreparation['activities']) : [],
      exercises: Array.isArray(p.exercises) ? (p.exercises as LessonPreparation['exercises']) : [],
      homework: Array.isArray(p.homework) ? (p.homework as string[]) : [],
      notes: Array.isArray(p.notes) ? (p.notes as string[]) : [],
    }
  } catch (error) {
    if (error instanceof AITimeoutError) {
      throw error
    }
    if (error instanceof AIResponseError) {
      throw error
    }

    throw new AIResponseError('Errore nella generazione della lezione. Riprova più tardi.')
  }
}
