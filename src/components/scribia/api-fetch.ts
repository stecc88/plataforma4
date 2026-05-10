import { useAppStore } from '@/store/app-store'

/**
 * API fetch helper that adds Authorization header automatically.
 * Handles 401 with auto-logout.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAppStore.getState().token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  // Auto-logout on 401
  if (res.status === 401) {
    useAppStore.getState().logout()
    throw new Error('Sessione scaduta. Effettua di nuovo il login.')
  }

  // Parse response
  const data = await res.json().catch(() => ({ error: 'Errore di rete' }))

  if (!res.ok) {
    throw new Error(data.error || `Errore ${res.status}`)
  }

  return data as T
}

/**
 * API fetch without auth — for login/register.
 */
export async function apiFetchPublic<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({ error: 'Errore di rete' }))

  if (!res.ok) {
    throw new Error(data.error || `Errore ${res.status}`)
  }

  return data as T
}
