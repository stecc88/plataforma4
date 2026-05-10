'use client'

import { useState, useSyncExternalStore } from 'react'
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion'
import { useRef } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PenLine,
  BookOpen,
  Brain,
  GraduationCap,
  Check,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  Feather,
  Star,
  Zap,
  Heart,
  Sparkles,
  BarChart3,
  Languages,
  Lightbulb,
  Crown,
  Globe,
  ChevronRight,
} from 'lucide-react'

/* ─── Hydration ──────────────────────────────────────────────── */

const emptySubscribe = () => () => {}

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

/* ─── Theme Toggle ───────────────────────────────────────────── */

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useHydrated()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle tema">
        <Sun className="size-5" />
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle tema"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="size-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="size-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {theme === 'dark' ? 'Modalità chiara' : 'Modalità scura'}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Animation Variants ─────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const heroTextReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

/* ─── Scroll-triggered Section ───────────────────────────────── */

function AnimatedSection({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ─── Feature Data ───────────────────────────────────────────── */

const features = [
  {
    icon: PenLine,
    title: 'Correzione Grammaticale',
    description:
      'Rileva e corregge errori grammaticali, ortografici e di punteggiatura con precisione maniacale.',
    accent: 'from-emerald-500 to-teal-500',
    bgAccent: 'bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    title: 'Analisi dei Testi',
    description:
      'Analizza struttura, coerenza e chiarezza dei tuoi testi con feedback dettagliato e personalizzato.',
    accent: 'from-amber-500 to-orange-500',
    bgAccent: 'bg-amber-500/10',
  },
  {
    icon: Brain,
    title: 'Intelligenza Artificiale',
    description:
      "Motore AI avanzato ottimizzato per l'italiano: comprende sfumature, registri e contesti linguistici.",
    accent: 'from-teal-500 to-cyan-500',
    bgAccent: 'bg-teal-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Apprendimento Adattivo',
    description:
      'Suggerimenti personalizzati basati sui tuoi errori ricorrenti e sul tuo livello di competenza.',
    accent: 'from-orange-500 to-red-500',
    bgAccent: 'bg-orange-500/10',
  },
  {
    icon: Languages,
    title: 'Traduzione Contestuale',
    description:
      "Traduce preservando il significato e le sfumature culturali, non solo parola per parola.",
    accent: 'from-emerald-500 to-emerald-700',
    bgAccent: 'bg-emerald-600/10',
  },
  {
    icon: Lightbulb,
    title: 'Suggerimenti Creativi',
    description:
      'Idee per arricchire i tuoi testi: metafore, sinonimi, connettivi e varianti stilistiche.',
    accent: 'from-amber-400 to-amber-600',
    bgAccent: 'bg-amber-400/10',
  },
]

/* ─── Benefits Data ──────────────────────────────────────────── */

const studentBenefits = [
  { icon: PenLine, text: 'Correzione istantanea dei temi' },
  { icon: BarChart3, text: 'Traccia i tuoi progressi nel tempo' },
  { icon: Lightbulb, text: 'Suggerimenti personalizzati per migliorare' },
  { icon: BookOpen, text: 'Note grammaticali chiare e dettagliate' },
]

const teacherBenefits = [
  { icon: GraduationCap, text: 'Monitora i progressi degli studenti' },
  { icon: Sparkles, text: 'Genera preparazioni di lezione con AI' },
  { icon: Brain, text: 'Identifica le debolezze comuni della classe' },
  { icon: Zap, text: 'Risparmia tempo nella correzione' },
]

/* ─── Steps Data ─────────────────────────────────────────────── */

const steps = [
  {
    number: '01',
    icon: BookOpen,
    title: 'Inserisci il tuo testo',
    description:
      "Scrivi o incolla il tuo testo nell'editor. Puoi anche descrivere ciò che vuoi creare.",
  },
  {
    number: '02',
    icon: Brain,
    title: "L'IA analizza e suggerisce",
    description:
      'La nostra intelligenza artificiale analizza il testo e genera suggerimenti personalizzati.',
  },
  {
    number: '03',
    icon: Star,
    title: 'Ricevi il risultato perfetto',
    description:
      'Applica i suggerimenti con un clic e ottieni un testo impeccabile in pochi istanti.',
  },
]

/* ─── Plans Data ─────────────────────────────────────────────── */

const plans = [
  {
    name: 'Piano Gratuito',
    price: '€0',
    period: '/mese',
    description: 'Perfetto per iniziare a scoprire ScribIA.',
    icon: Feather,
    features: [
      '5.000 parole al mese',
      'Correzione grammaticale',
      '3 suggerimenti al giorno',
      'Supporto email',
    ],
    cta: 'Inizia Gratis',
    popular: false,
  },
  {
    name: 'Piano Pro',
    price: '€9,99',
    period: '/mese',
    description: 'Per scrittori e professionisti che vogliono di più.',
    icon: Crown,
    features: [
      '100.000 parole al mese',
      'Tutte le funzionalità',
      'Suggerimenti illimitati',
      'Analisi dello stile avanzata',
      'Traduzione multilingue',
      'Supporto prioritario',
    ],
    cta: 'Prova Pro',
    popular: true,
  },
  {
    name: 'Piano Enterprise',
    price: '€29,99',
    period: '/mese',
    description: 'Per team e aziende con esigenze avanzate.',
    icon: Globe,
    features: [
      'Parole illimitate',
      'Tutte le funzionalità Pro',
      'API personalizzata',
      'Collaborazione team',
      'Analisi avanzata',
      'Account manager dedicato',
      'SLA garantito',
    ],
    cta: 'Contattaci',
    popular: false,
  },
]

/* ─── Props ──────────────────────────────────────────────────── */

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void
}

/* ─── Landing Page Component ─────────────────────────────────── */

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Funzionalità', href: '#funzionalita' },
    { label: 'Come Funziona', href: '#come-funziona' },
    { label: 'Prezzi', href: '#prezzi' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b shadow-sm"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md group-hover:shadow-lg transition-shadow">
              <Feather className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Scrib<span className="text-emerald-600 dark:text-emerald-400">IA</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenAuth('login')}
              className="text-sm font-medium"
            >
              Accedi
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenAuth('register')}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              Inizia ora
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500">
                      <Feather className="size-4 text-white" />
                    </div>
                    ScribIA
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                    >
                      {link.label}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </a>
                  ))}
                </nav>
                <Separator className="my-4" />
                <div className="flex flex-col gap-3 px-2">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => { setMobileOpen(false); onOpenAuth('login') }}
                  >
                    Accedi
                  </Button>
                  <Button
                    className="w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                    onClick={() => { setMobileOpen(false); onOpenAuth('register') }}
                  >
                    Inizia ora
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* ─── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/8 via-teal-400/5 to-transparent dark:from-emerald-500/10 dark:via-teal-400/5 rounded-full blur-3xl" />
            <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-amber-400/6 to-transparent dark:from-amber-400/8 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Italian flag accent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-2 mb-8"
              >
                <div className="flex h-2 rounded-full overflow-hidden shadow-sm">
                  <div className="w-8 bg-green-600" />
                  <div className="w-8 bg-white dark:bg-white/90" />
                  <div className="w-8 bg-red-500" />
                </div>
                <Badge variant="secondary" className="text-xs font-medium tracking-wide uppercase">
                  Made in Italy 🇮🇹
                </Badge>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={heroTextReveal}
                initial="hidden"
                animate="visible"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-400">
                  ScribIA
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 text-xl sm:text-2xl md:text-3xl font-medium text-foreground/80"
              >
                Il tuo assistente per la scrittura in italiano
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
              >
                ScribIA è il tuo assistente di scrittura AI che ti aiuta a creare,
                correggere e migliorare testi in italiano con precisione e creatività.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-col sm:flex-row items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => onOpenAuth('register')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all text-base px-8 h-12"
                >
                  Inizia ora
                  <ArrowRight className="size-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 h-12 border-2 hover:bg-accent/50"
                  asChild
                >
                  <a href="#funzionalita">Scopri di Più</a>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
              >
                {[
                  { value: '50K+', label: 'Utenti Attivi' },
                  { value: '10M+', label: 'Parole Generate' },
                  { value: '99.2%', label: 'Precisione' },
                  { value: '4.9★', label: 'Valutazione' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                      {stat.value}
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────────────────────────── */}
        <AnimatedSection id="funzionalita" className="py-20 md:py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Funzionalità
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Tutto ciò che ti serve per{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                  scrivere bene
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Strumenti potenti guidati dall&apos;intelligenza artificiale per ogni esigenza di scrittura in italiano.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <motion.div key={feature.title} variants={staggerItem}>
                    <Card className="group relative h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <CardHeader>
                        <div className={`flex size-12 items-center justify-center rounded-xl ${feature.bgAccent} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                          <Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ─── Benefits for Students & Teachers ──────────────────── */}
        <AnimatedSection id="benefici" className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Benefici
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Progettato per{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                  studenti
                </span>{' '}
                e{' '}
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-amber-500">
                  docenti
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Che tu stia imparando o insegnando, ScribIA si adatta alle tue esigenze.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Benefits */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-emerald-200 dark:border-emerald-900/40">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10">
                        <PenLine className="size-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-xl">Per gli Studenti</CardTitle>
                    </div>
                    <CardDescription>Migliora il tuo italiano con assistenza personalizzata</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {studentBenefits.map((b) => {
                        const Icon = b.icon
                        return (
                          <li key={b.text} className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                              <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm text-muted-foreground pt-1">{b.text}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Teacher Benefits */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-amber-200 dark:border-amber-900/40">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10">
                        <GraduationCap className="size-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <CardTitle className="text-xl">Per i Docenti</CardTitle>
                    </div>
                    <CardDescription>Risparmia tempo e migliora l&apos;insegnamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {teacherBenefits.map((b) => {
                        const Icon = b.icon
                        return (
                          <li key={b.text} className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                              <Icon className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm text-muted-foreground pt-1">{b.text}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* ─── How It Works ──────────────────────────────────────── */}
        <AnimatedSection id="come-funziona" className="py-20 md:py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Come Funziona
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Tre semplici passi verso{' '}
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-amber-500">
                  la perfezione
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Da testo grezzo a capolavoro letterario in pochissimo tempo.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-emerald-500/30" />
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div key={step.number} variants={staggerItem} className="flex flex-col items-center text-center relative">
                    <div className="relative mb-6">
                      <motion.div whileHover={{ scale: 1.08 }} className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20">
                        <Icon className="size-9 text-white" />
                      </motion.div>
                      <div className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
                    {index < steps.length - 1 && (
                      <div className="md:hidden mt-6 mb-2">
                        <ArrowRight className="size-5 text-muted-foreground/40 rotate-90" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ─── Pricing ────────────────────────────────────────────── */}
        <AnimatedSection id="prezzi" className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide uppercase">
                Prezzi
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Un piano per ogni{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                  esigenza
                </span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Inizia gratuitamente e scala quando sei pronto.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <motion.div key={plan.name} variants={staggerItem}>
                    <Card className={`group relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      plan.popular ? 'border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 bg-card' : 'border-border/60 bg-card/80 backdrop-blur-sm'
                    }`}>
                      {plan.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 px-4 shadow-md">
                            Più Popolare
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`flex size-10 items-center justify-center rounded-lg ${plan.popular ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                            <Icon className={`size-5 ${plan.popular ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                          </div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="mb-6">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        </div>
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <Check className={`size-4 mt-0.5 shrink-0 ${plan.popular ? 'text-amber-500' : 'text-emerald-500'}`} />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className={`w-full transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg'
                          }`}
                          size="lg"
                          onClick={() => onOpenAuth('register')}
                        >
                          {plan.cta}
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t bg-background mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md">
                  <Feather className="size-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Scrib<span className="text-emerald-600 dark:text-emerald-400">IA</span>
                </span>
              </a>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Il tuo assistente di scrittura AI per creare testi perfetti in italiano con precisione e creatività.
              </p>
            </div>
            {[
              { title: 'Prodotto', items: ['Funzionalità', 'Prezzi', 'API', 'Integrazioni'] },
              { title: 'Azienda', items: ['Chi Siamo', 'Blog', 'Carriere', 'Contatti'] },
              { title: 'Legale', items: ['Privacy', 'Termini', 'Cookie', 'GDPR'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScribIA. Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Fatto con <Heart className="size-3.5 text-red-500 fill-red-500 mx-0.5" /> in Italia
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
