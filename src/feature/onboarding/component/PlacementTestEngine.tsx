import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import { TestQuestionCard } from './TestQuestionCard'
import type { TestQuestion, QuestionResult, SkillAxis } from '../api/placementTestTypes'
import { SKILL_TO_AXIS } from '../api/placementTestTypes'
import { completePlacementTest, fetchPlacementTestQuestions } from '../api/onboardingApi'
import type { RawPlacementQuestionApi } from '../api/onboardingApi'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 24        // 6 per axis × 4 axes
const QUESTIONS_PER_AXIS = 6
const AXIS_SEQUENCE: Array<'D' | 'C' | 'T' | 'G'> = [
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
] // 24 slots, round-robin across axes

// ─── Pool Helpers ─────────────────────────────────────────────────────────────

type Pool = Record<'D' | 'C' | 'T' | 'G', Record<1 | 2 | 3, TestQuestion[]>>

/** Transform raw API questions into the frontend TestQuestion shape */
function normalise(raw: RawPlacementQuestionApi): TestQuestion {
  const optionIds = ['a', 'b', 'c', 'd']
  const options = raw.options.map((text, i) => ({ id: optionIds[i] ?? String(i), text }))
  const correctOption = options.find((o) => o.text === raw.correct_answer)
  return {
    id: String(raw.id),
    axis: SKILL_TO_AXIS[raw.skill],
    difficulty: raw.level,
    question: raw.statement,
    options,
    correctId: correctOption?.id ?? options[0]?.id ?? 'a',
    explanation: '',
  }
}

/** Build the pool structure from the raw API response */
function buildPool(rawList: RawPlacementQuestionApi[]): Pool {
  const pool: Pool = {
    D: { 1: [], 2: [], 3: [] },
    C: { 1: [], 2: [], 3: [] },
    T: { 1: [], 2: [], 3: [] },
    G: { 1: [], 2: [], 3: [] },
  }
  for (const raw of rawList) {
    const skill = raw.skill as 'D' | 'C' | 'T' | 'G'
    const level = raw.level as 1 | 2 | 3
    if (pool[skill] && pool[skill][level]) {
      pool[skill][level].push(normalise(raw))
    }
  }
  return pool
}

/** Pick a random item from an array (modifies in place, returns picked item) */
function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  const idx = Math.floor(Math.random() * arr.length)
  return arr.splice(idx, 1)[0]
}

/**
 * Pick the next question for an axis at the given level.
 * Falls back to adjacent levels if the desired level is exhausted.
 */
function pickQuestion(
  pool: Pool,
  axis: 'D' | 'C' | 'T' | 'G',
  level: 1 | 2 | 3,
): TestQuestion | null {
  for (const fallback of [level, Math.min(level + 1, 3) as 1 | 2 | 3, Math.max(level - 1, 1) as 1 | 2 | 3]) {
    const q = pickRandom(pool[axis][fallback as 1 | 2 | 3])
    if (q) return q
  }
  return null
}

// ─── Quit Modal ────────────────────────────────────────────────────────────────

function QuitModal({ onStay, onQuit }: { onStay: () => void; onQuit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 bg-gray-900/95 border border-white/20 rounded-2xl p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-90 fade-in duration-200">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Exit the test?</h3>
        <p className="text-sm text-white/60 text-center mb-6 leading-relaxed">
          Your test progress will be <span className="text-rose-300 font-semibold">completely lost</span> if you exit. Are you sure?
        </p>
        <div className="flex gap-3">
          <button
            id="btn-quit-cancel"
            onClick={onStay}
            className="flex-1 py-3 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-300 hover:bg-blue-500/40 font-bold text-sm transition-all"
          >
            Continue Test
          </button>
          <button
            id="btn-quit-confirm"
            onClick={onQuit}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 font-medium text-sm transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="fixed inset-0 bg-blue-700/80" />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full border-4 border-blue-300/30 border-t-blue-300 animate-spin" />
        <p className="text-white/70 text-sm font-medium">Loading questions...</p>
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function NoQuestionsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="fixed inset-0 bg-blue-700/80" />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-6">
        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-4xl">
          📭
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">No Questions Available</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            There are no questions for this role yet. Please check back later or select a different role.
          </p>
        </div>
        <button
          id="btn-no-questions-back"
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/15 border border-white/25 text-white font-semibold text-sm hover:bg-white/25 transition-all"
        >
          ← Back to Role Selection
        </button>
      </div>
    </div>
  )
}

// ─── Main Engine Component ────────────────────────────────────────────────────

export function PlacementTestEngine() {
  const navigate = useNavigate()

  // ── Fetch state ─────────────────────────────────────────────────────────────
  const [loadState, setLoadState] = useState<'loading' | 'empty' | 'ready'>('loading')
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ── Question pool (mutable ref so pickQuestion can splice without re-renders)
  const poolRef = useRef<Pool | null>(null)

  // ── Adaptive per-axis current difficulty level ───────────────────────────────
  const [axisLevel, setAxisLevel] = useState<Record<'D' | 'C' | 'T' | 'G', 1 | 2 | 3>>({
    D: 1, C: 1, T: 1, G: 1,
  })
  const axisLevelRef = useRef(axisLevel) // keep ref in sync for use inside pickQuestion
  useEffect(() => { axisLevelRef.current = axisLevel }, [axisLevel])

  // ── Quiz state ───────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [visible, setVisible] = useState(true)
  const [showQuit, setShowQuit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Fetch questions on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const rawRoleId = localStorage.getItem('pending_role_id')
    const roleId = rawRoleId ? parseInt(rawRoleId, 10) : null

    if (!roleId) {
      setFetchError('No role selected. Please go back and choose a role.')
      setLoadState('empty')
      return
    }

    fetchPlacementTestQuestions(roleId)
      .then((data) => {
        if (!data || data.length === 0) {
          setLoadState('empty')
          return
        }
        const pool = buildPool(data)
        poolRef.current = pool

        // Pick the very first question (axis D, starting level 1)
        const firstAxis = AXIS_SEQUENCE[0]
        const firstQ = pickQuestion(pool, firstAxis, 1)
        if (!firstQ) {
          setLoadState('empty')
          return
        }
        setCurrentQuestion(firstQ)
        setLoadState('ready')
      })
      .catch((err) => {
        console.error('Failed to load placement test questions:', err)
        setFetchError(err?.message ?? 'Failed to load questions.')
        setLoadState('empty')
      })
  }, [])

  // ── Block browser back button ────────────────────────────────────────────────
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
      setShowQuit(true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ── Auto-scroll to top when question changes ─────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  // ─────────────────────────────────────────────────────────────────────────────

  function handleSelect(optionId: string) {
    setSelectedId(optionId)
  }

  function handleNext() {
    if (!selectedId || !currentQuestion || isSubmitting || !poolRef.current) return

    const isCorrect = selectedId === currentQuestion.correctId
    const newResult: QuestionResult = {
      questionId: currentQuestion.id,
      axis: currentQuestion.axis,
      difficulty: currentQuestion.difficulty,
      selectedId,
      isCorrect,
    }
    const updatedResults = [...results, newResult]

    // ── Adaptive: update difficulty for this axis ────────────────────────────
    const skill = AXIS_SEQUENCE[currentIndex]
    const prevLevel = axisLevelRef.current[skill]
    const nextLevel = (
      isCorrect
        ? Math.min(prevLevel + 1, 3)
        : Math.max(prevLevel - 1, 1)
    ) as 1 | 2 | 3
    const updatedAxisLevel = { ...axisLevelRef.current, [skill]: nextLevel }

    const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1

    if (isLastQuestion) {
      setIsSubmitting(true)

      const rawAnswers = localStorage.getItem('pending_survey_answers')
      const rawRoleId = localStorage.getItem('pending_role_id')
      const surveyAnswers = rawAnswers ? JSON.parse(rawAnswers) : null
      const roleId = rawRoleId ? parseInt(rawRoleId, 10) : null

      completePlacementTest({ role_id: roleId, survey_answers: surveyAnswers })
        .catch((err) => console.warn('Failed to commit placement test:', err))
        .finally(() => {
          localStorage.removeItem('pending_survey_answers')
          localStorage.removeItem('pending_role_id')
          navigate({ to: '/placement-result', state: { results: updatedResults } as any })
        })
      return
    }

    // ── Pick next question adaptively ────────────────────────────────────────
    const nextIndex = currentIndex + 1
    const nextAxis = AXIS_SEQUENCE[nextIndex]
    const nextLevelForAxis = nextAxis === skill ? nextLevel : updatedAxisLevel[nextAxis]
    const nextQ = pickQuestion(poolRef.current, nextAxis, nextLevelForAxis)

    // Animate out → update state → animate in
    setVisible(false)
    setTimeout(() => {
      setResults(updatedResults)
      setAxisLevel(updatedAxisLevel)
      axisLevelRef.current = updatedAxisLevel
      setCurrentIndex(nextIndex)
      setCurrentQuestion(nextQ)
      setSelectedId(null)
      setVisible(true)
    }, 250)
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (loadState === 'loading') return <LoadingScreen />
  if (loadState === 'empty') {
    return (
      <NoQuestionsScreen
        onBack={() => navigate({ to: '/onboarding/role-selection' })}
      />
    )
  }

  // ── Progress ─────────────────────────────────────────────────────────────────
  const progress = (currentIndex / TOTAL_QUESTIONS) * 100
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1
  const current = currentQuestion!

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Blue overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />

      {/* Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo */}
      <img src={tmaLogo} alt="TMA Solutions" className="absolute top-6 left-6 w-45 h-auto z-20" />

      {/* Exit button */}
      <button
        id="btn-exit-test"
        type="button"
        onClick={() => setShowQuit(true)}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 backdrop-blur-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Survey</span>
      </button>

      {/* Progress bar — top */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">

          {/* Header Stepper & Badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step <= 3
                        ? 'bg-blue-400 text-white shadow-md shadow-blue-900'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {step < 3 ? '✓' : step}
                  </div>
                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-white/20 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                Step 3 / 4 — Placement Test
              </div>
            </div>
          </div>

          {/* Sub-step dots progress & counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex gap-1.5 flex-wrap max-w-[280px] sm:max-w-none">
                {AXIS_SEQUENCE.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-5 h-2 bg-blue-300'
                        : i < currentIndex
                        ? 'w-2 h-2 bg-blue-400/60'
                        : 'w-2 h-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-white/40 text-sm font-mono shrink-0 ml-3">
              {currentIndex + 1} / {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Question Card */}
          <TestQuestionCard
            question={current}
            questionNumber={currentIndex + 1}
            total={TOTAL_QUESTIONS}
            selectedId={selectedId}
            onSelect={handleSelect}
            visible={visible}
          />

          {/* Next / Submit Button */}
          <div className={`mt-5 transition-all duration-300 ${selectedId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <button
              id="btn-next-question"
              type="button"
              onClick={handleNext}
              disabled={!selectedId || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg
                ${isSubmitting
                  ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] shadow-blue-500/20'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Compiling results...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <span>Submit</span>
                  <span>🎉</span>
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {!isLastQuestion && (
              <p className="text-center text-[11px] text-white/25 mt-2">
                🔒 You cannot go back — choose carefully
              </p>
            )}
          </div>

          {/* Error notice */}
          {fetchError && (
            <p className="mt-4 text-center text-xs text-rose-300/70">{fetchError}</p>
          )}
        </div>
      </div>

      {/* Quit Modal */}
      {showQuit && (
        <QuitModal
          onStay={() => setShowQuit(false)}
          onQuit={() => navigate({ to: '/onboarding/survey' })}
        />
      )}
    </div>
  )
}
