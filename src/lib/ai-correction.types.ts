/* ─── PLIDA/CILS AI Correction Types ──────────────────────────── */
// Complete types for the AI writing correction system.
// Used by both the essay-detail component and the API route.

export type ErrorType =
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'syntax'
  | 'vocabulary'
  | 'style'

export type StrengthCategory =
  | 'connectors'
  | 'vocabulary'
  | 'structure'
  | 'style'
  | 'coherence'
  | 'other'

export type CertificationType = 'PLIDA' | 'CILS'

export type ItalianLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type TextType =
  | 'email'
  | 'tema'
  | 'lettera_formale'
  | 'racconto'
  | 'saggio'
  | 'riassunto'
  | 'altro'

export interface CorrectionError {
  id: number
  /** Grammatical name in uppercase Italian, e.g. "AUSILIARE NEL PASSATO PROSSIMO" */
  category: string
  type: ErrorType
  original: string
  correction: string
  /** Complete theoretical explanation with rule and exceptions */
  regola: string
  /** Correct example sentence with the same structure */
  exampleCorrect: string
  /** Wrong example sentence for visual contrast */
  exampleWrong: string
  /** How many times this error appears in the text */
  occurrences: number
  /** Textual description of positions, e.g. "righe 1, 4 e 7" */
  occurrencePositions: string
}

export interface Strength {
  category: StrengthCategory
  label: string
  /** Specific and concrete description of the strength */
  description: string
  /** Exact words/phrases from the text demonstrating the strength */
  examples: string[]
}

export interface ConnectorSuggestions {
  /** Connectors already used in the text */
  used: string[]
  /** Recommended connectors the student could incorporate */
  recommended: string[]
}

export interface SynonymSuggestion {
  /** Repeated word (base form / lemma) */
  word: string
  /** Number of occurrences in the text */
  count: number
  /** 4-6 synonyms appropriate to the level and register */
  alternatives: string[]
}

export interface ScoreBreakdown {
  /** CILS: /5 · PLIDA: /25 — Realization of the communicative task */
  communicativeAdequacy: number
  /** CILS: /5 · PLIDA: /25 — Morphosyntactic and orthographic correctness */
  grammaticalAccuracy: number
  /** CILS: /5 · PLIDA: /25 — Variety and appropriateness of vocabulary */
  lexicalRichness: number
  /** CILS: /5 · PLIDA: /25 — Organization, coherence, use of connectors */
  textualCohesion: number
}

export interface AICorrection {
  /** Original text with inline error markings: ~~error~~ → **correction** */
  markedText: string
  /** Complete rewritten text without markings */
  correctedText: string
  /** Score 0-100 */
  score: number
  certification: CertificationType
  level: string
  scoreBreakdown: ScoreBreakdown
  errors: CorrectionError[]
  strengths: Strength[]
  suggestions: {
    connectors: ConnectorSuggestions
    synonyms: SynonymSuggestion[]
  }
  /** Prioritized grammatical/textual topics to review */
  studyTopics: string[]
  /** Personalized and encouraging final note */
  finalNote: string
  /** Self-assessment data (added client-side) */
  selfAssessment?: {
    selfScore: number
    selfNotes: string
    assessedAt: string
  }
}

/** Text type labels for UI display */
export const TEXT_TYPE_LABELS: Record<TextType, string> = {
  email: 'Email',
  tema: 'Tema',
  lettera_formale: 'Lettera formale',
  racconto: 'Racconto',
  saggio: 'Saggio',
  riassunto: 'Riassunto',
  altro: 'Altro',
}

/** Certification labels for UI display */
export const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  PLIDA: 'PLIDA (Società Dante Alighieri)',
  CILS: 'CILS (Università per Stranieri di Siena)',
}

/** Level descriptions for UI display */
export const LEVEL_LABELS: Record<ItalianLevel, string> = {
  A1: 'A1 — Principiante',
  A2: 'A2 — Elementare',
  B1: 'B1 — Intermedio',
  B2: 'B2 — Intermedio superiore',
  C1: 'C1 — Avanzato',
  C2: 'C2 — Padronanza',
}
