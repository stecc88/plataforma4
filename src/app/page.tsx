'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { AppShell } from '@/components/scribia/app-shell'
import { AuthForm } from '@/components/scribia/auth-form'
import { LandingPage } from '@/components/landing-page'
import { Feather } from 'lucide-react'

/* ─── Auth Initialization ────────────────────────────────────── */

function AuthInitializer() {
  const { token, isAuthenticated, hydrateAuth } = useAppStore()
  const [hydrated, setHydrated] = useState(() => !token || isAuthenticated)

  useEffect(() => {
    if (token && !isAuthenticated) {
      hydrateAuth(token).finally(() => setHydrated(true))
    }
  }, [token, isAuthenticated, hydrateAuth])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg animate-pulse">
            <Feather className="size-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return null
}

/* ─── Main Page ──────────────────────────────────────────────── */

export default function Home() {
  const { isAuthenticated } = useAppStore()
  const [ready, setReady] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')

  useEffect(() => {
    setReady(true)
  }, [])

  function openAuth(mode: 'login' | 'register') {
    setAuthTab(mode)
    setShowAuth(true)
  }

  // Wait for hydration
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg animate-pulse">
          <Feather className="size-6 text-white" />
        </div>
      </div>
    )
  }

  // Hydrate from localStorage token
  const token = useAppStore.getState().token
  if (token && !isAuthenticated) {
    return <AuthInitializer />
  }

  // Authenticated → AppShell
  if (isAuthenticated) {
    return <AppShell />
  }

  // Not authenticated → Landing Page with Auth overlay
  return (
    <>
      <LandingPage onOpenAuth={openAuth} />

      {/* Auth modal overlay */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <AuthForm
                initialTab={authTab}
                onSuccess={() => setShowAuth(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
