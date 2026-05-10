import { NextResponse } from 'next/server'

/* ─── Health Check ───────────────────────────────────────────── */

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ScribIA',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  })
}
