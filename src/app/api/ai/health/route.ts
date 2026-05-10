import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── GET /api/ai/health — Diagnostic endpoint (ADMIN only) ──── */

export async function GET(request: NextRequest) {
  // ─── Authentication & Authorization ──────────────────────
  const auth = await getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  if (auth.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Accesso riservato agli amministratori' }, { status: 403 })
  }

  // ─── Basic diagnostics (no sensitive info) ───────────────
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
      GEMINI_MODEL: process.env.GEMINI_MODEL || '(default: gemini-2.5-flash)',
      NODE_ENV: process.env.NODE_ENV,
    },
    models: [
      process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      'gemini-2.0-flash',
    ],
    geminiTest: null as Record<string, unknown> | null,
  }

  // ─── Optional Gemini connectivity test (?test=true) ──────
  const shouldTest = request.nextUrl.searchParams.get('test') === 'true'
  const apiKey = process.env.GEMINI_API_KEY

  if (shouldTest && apiKey) {
    const models = [
      process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      'gemini-2.0-flash',
    ]
    const geminiResults: Record<string, unknown> = {}

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        })

        const data = await response.json()
        geminiResults[model] = {
          status: response.status,
          ok: response.ok,
          hasContent: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
        }
      } catch {
        geminiResults[model] = { error: 'Request failed' }
      }
    }

    diagnostics.geminiTest = geminiResults
  } else if (shouldTest && !apiKey) {
    diagnostics.geminiTest = { error: 'GEMINI_API_KEY not set' }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
