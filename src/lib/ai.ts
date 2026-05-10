import ZAI from 'z-ai-web-dev-sdk'

/* ─── Singleton ZAI Instance ─────────────────────────────────── */

let zaiInstance: InstanceType<typeof ZAI> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/* ─── Italian Proficiency Levels ─────────────────────────────── */

export type ItalianLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

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

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI model')
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr) as EssayCorrection

    // Validate essential fields
    if (typeof parsed.score !== 'number' || !parsed.correctedText) {
      throw new Error('Invalid AI response structure')
    }

    return {
      correctedText: parsed.correctedText,
      score: Math.max(0, Math.min(100, parsed.score)),
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      grammarNotes: Array.isArray(parsed.grammarNotes) ? parsed.grammarNotes : [],
      vocabularyNotes: Array.isArray(parsed.vocabularyNotes) ? parsed.vocabularyNotes : [],
      styleNotes: Array.isArray(parsed.styleNotes) ? parsed.styleNotes : [],
      suggestions: parsed.suggestions || { connectors: [], synonyms: [] },
      studyTopics: Array.isArray(parsed.studyTopics) ? parsed.studyTopics : [],
    }
  } catch (error) {
    console.error('[ai] correctEssay error:', error)

    // Fallback: return a minimal correction object
    return {
      correctedText: text,
      score: 0,
      errors: [],
      grammarNotes: ['Errore nella correzione automatica. Riprova più tardi.'],
      vocabularyNotes: [],
      styleNotes: [],
      suggestions: { connectors: [], synonyms: [] },
      studyTopics: [],
    }
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

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Genera una lezione per lavorare su: ${weaknesses.join(', ')}` },
      ],
      temperature: 0.7,
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI model')
    }

    // Extract JSON from the response
    let jsonStr = content.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr) as LessonPreparation

    return {
      title: parsed.title || `Lezione - ${weaknesses[0] || 'Italiano'}`,
      level: parsed.level || level,
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      homework: Array.isArray(parsed.homework) ? parsed.homework : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    }
  } catch (error) {
    console.error('[ai] generateLessonPreparation error:', error)

    // Fallback
    return {
      title: `Lezione personalizzata - ${weaknesses[0] || 'Italiano'}`,
      level,
      objectives: [`Migliorare: ${weaknesses.join(', ')}`],
      activities: [
        {
          name: 'Riprova più tardi',
          description: 'Si è verificato un errore nella generazione della lezione.',
          duration: 'N/A',
          materials: [],
        },
      ],
      exercises: [],
      homework: [],
      notes: ['Errore nella generazione automatica. Riprova più tardi.'],
    }
  }
}
