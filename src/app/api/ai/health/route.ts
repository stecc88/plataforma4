import { NextResponse } from 'next/server'

/* ─── GET /api/ai/health — Diagnostic endpoint ──────────────────── */

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `SET (${process.env.GEMINI_API_KEY.substring(0, 8)}...)` : 'NOT SET',
      GEMINI_MODEL: process.env.GEMINI_MODEL || '(default: gemini-2.5-flash)',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
    models: [] as string[],
    geminiTest: {} as Record<string, unknown>,
    zaiTest: null as Record<string, unknown> | null,
  }

  // Test Gemini REST API
  const apiKey = process.env.GEMINI_API_KEY
  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
  ]
  diagnostics.models = models
  diagnostics.geminiTest = {}

  if (apiKey) {
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
        const geminiResults = diagnostics.geminiTest as Record<string, unknown>
        geminiResults[model] = {
          status: response.status,
          ok: response.ok,
          error: data.error?.message || null,
          hasContent: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
        }
      } catch (error) {
        const geminiResults = diagnostics.geminiTest as Record<string, unknown>
        geminiResults[model] = {
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }
  } else {
    diagnostics.geminiTest = 'GEMINI_API_KEY not set'
  }

  // Test Z-AI SDK
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Reply with OK' },
        { role: 'user', content: 'Say OK' },
      ],
      thinking: { type: 'disabled' },
    })
    diagnostics.zaiTest = {
      available: true,
      hasResponse: !!completion.choices?.[0]?.message?.content,
    }
  } catch (error) {
    diagnostics.zaiTest = {
      available: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
