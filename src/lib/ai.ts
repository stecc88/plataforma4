import ZAI from 'z-ai-web-dev-sdk'
import type {
  AICorrection,
  CertificationType,
  ItalianLevel,
  TextType,
} from './ai-correction.types'

/* ─── Singleton ZAI Instance ─────────────────────────────────── */

let zaiInstance: any = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

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

const AI_TIMEOUT_MS = 90_000 // 90 seconds for complex correction

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

/* ─── JSON Extraction Helper ─────────────────────────────────── */

function extractJSON(content: string): string {
  let jsonStr = content.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }
  return jsonStr
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
  - used: tutti i connettivi già presenti nel testo
    (es. ["e", "ma", "perché", "quindi"])
  - recommended: 5–8 connettivi appropriati al livello e al tipo di
    testo che lo studente NON ha usato e potrebbe integrare.
    Per A1/A2: connettivi semplici (poi, anche, però, allora).
    Per B1/B2: connettivi intermedi (tuttavia, inoltre, nonostante,
    di conseguenza, eppure, sebbene, affinché).
    Per C1/C2: connettivi avanzati (ciononostante, a tal proposito,
    in virtù di, laddove, giacché, al contempo).

── suggestions.synonyms ──
Analizza il testo e identifica le parole PIENE (non articoli,
preposizioni o ausiliari) che si ripetono 3 o più volte.
Per ognuna:
  - word: la parola ripetuta (forma base / lemma)
  - count: numero di occorrenze nel testo
  - alternatives: 4–6 sinonimi appropriati al livello e al registro.
    Per A1/A2: sinonimi semplici e comuni.
    Per C1/C2: sinonimi stilisticamente elevati.
Ordina per frequenza decrescente (la più ripetuta prima).
Se nessuna parola si ripete ≥3 volte, restituisci array vuoto [].

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
    const zai = await getZAI()

    const userPrompt = `Livello QCER: ${level}
Certificazione: ${certification}
Tipo di testo: ${textType}

Testo da correggere:

${text}`

    const completion: any = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
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
  } catch (error) {
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
      objectives: Array.isArray(p.objectives) ? (p.objectives as string[]) : [],
      activities: Array.isArray(p.activities) ? (p.activities as LessonPreparation['activities']) : [],
      exercises: Array.isArray(p.exercises) ? (p.exercises as LessonPreparation['exercises']) : [],
      homework: Array.isArray(p.homework) ? (p.homework as string[]) : [],
      notes: Array.isArray(p.notes) ? (p.notes as string[]) : [],
    }
  } catch (error) {
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
