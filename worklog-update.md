---
Task ID: 1
Agent: main
Task: Fix AI correction not working on Vercel production

Work Log:
- Diagnosed root cause: z-ai-web-dev-sdk requires a local proxy (172.25.136.193:8080) configured in /etc/.z-ai-config, which is inaccessible from Vercel servers
- Discovered the Gemini API key has quota issues (429 - quota exceeded) on the free tier
- Rewrote src/lib/ai.ts with a hybrid approach:
  1. PRIMARY: Gemini REST API via fetch() with GEMINI_API_KEY env var (works on Vercel)
  2. FALLBACK: z-ai-web-dev-sdk (works locally through proxy when Gemini fails)
- Added responseMimeType: application/json to Gemini config for structured JSON output
- Added GEMINI_MODEL env var support for model selection flexibility
- Tested locally: Gemini REST API returns 429 (quota), Z-AI SDK fallback works correctly
- Lint passes, dev server runs fine
- Committed and pushed to GitHub (stecc88/plataforma4, main branch)

Stage Summary:
- The AI correction code now supports both Vercel and local environments
- IMPORTANT for Vercel: GEMINI_API_KEY env var MUST be set in Vercel project settings
- The current Gemini API key has quota issues (429). User needs to enable billing, wait for quota reset, or use a different key
- On Vercel servers (US/EU), Gemini API should work without geographic restrictions
