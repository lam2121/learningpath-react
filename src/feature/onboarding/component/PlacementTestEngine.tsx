import { useState, useEffect, useRef } from 'react'
import { useNavigate, type HistoryState } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import { TestQuestionCard } from './TestQuestionCard'
import type { TestQuestion, QuestionResult, DifficultyLevel } from '../api/placementTestTypes'
import { SKILL_TO_AXIS } from '../api/placementTestTypes'
import { completePlacementTest, fetchPlacementTestQuestions } from '../api/onboardingApi'
import type { RawPlacementQuestionApi } from '../api/onboardingApi'

// ─── Constants ────────────────────────────────────────────────────────────────

// DB: 4 skills × 10 difficulty levels × 5 questions = 200 questions/role
// Test session: 24 questions (6 per axis), adaptive ±1 per answer
const TOTAL_QUESTIONS = 48       // 6 per axis × 4 axes
const MIN_LEVEL: DifficultyLevel = 1
const MAX_LEVEL: DifficultyLevel = 8
const START_LEVEL: DifficultyLevel = 4  // start at middle of 1-10 range
const TEST_DURATION_SECONDS = 30 * 60
const AXIS_SEQUENCE: Array<'D' | 'C' | 'T' | 'G'> = [
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
  'D', 'C', 'T', 'G',
] // 24 slots, round-robin across axes

// ─── Pool Helpers ─────────────────────────────────────────────────────────────

/** All valid difficulty levels */
const ALL_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

type Pool = Record<'D' | 'C' | 'T' | 'G', Partial<Record<DifficultyLevel, TestQuestion[]>>>

/** Fisher-Yates shuffle — returns a new shuffled array */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Transform raw API questions into the frontend TestQuestion shape */
function normalise(raw: RawPlacementQuestionApi): TestQuestion {
  const optionIds = ['a', 'b', 'c', 'd']
  // Shuffle the plain-text options so the correct answer is not always at position 'a'
  const shuffledTexts = shuffleArray(raw.options)
  const options = shuffledTexts.map((text, i) => ({ id: optionIds[i] ?? String(i), text }))
  const correctOption = options.find((o) => o.text === raw.correct_answer)
  return {
    id: String(raw.id),
    axis: SKILL_TO_AXIS[raw.skill],
    difficulty: raw.level as DifficultyLevel,
    question: raw.statement,
    options,
    correctId: correctOption?.id ?? options[0]?.id ?? 'a',
    explanation: '',
  }
}

/** Build the pool structure from the raw API response (levels 1–10) */
function buildPool(rawList: RawPlacementQuestionApi[]): Pool {
  const pool: Pool = { D: {}, C: {}, T: {}, G: {} }
  for (const raw of rawList) {
    const skill = raw.skill as 'D' | 'C' | 'T' | 'G'
    const level = raw.level as DifficultyLevel
    if (!pool[skill][level]) pool[skill][level] = []
    pool[skill][level]!.push(normalise(raw))
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
 * Falls back to adjacent levels (expanding outward) if the desired level is exhausted.
 */
function pickQuestion(
  pool: Pool,
  axis: 'D' | 'C' | 'T' | 'G',
  level: DifficultyLevel,
): TestQuestion | null {
  // Try the exact level first, then expand outward (±1, ±2, …)
  const candidates: DifficultyLevel[] = [level]
  for (let delta = 1; delta < ALL_LEVELS.length; delta++) {
    const up = (level + delta) as DifficultyLevel
    const down = (level - delta) as DifficultyLevel
    if (up <= MAX_LEVEL) candidates.push(up)
    if (down >= MIN_LEVEL) candidates.push(down)
  }
  for (const lvl of candidates) {
    const bucket = pool[axis][lvl]
    if (bucket && bucket.length > 0) {
      const q = pickRandom(bucket)
      if (q) return q
    }
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

  // ── Adaptive per-axis current difficulty level (starts at 5 = midpoint of 1-10)
  const [axisLevel, setAxisLevel] = useState<Record<'D' | 'C' | 'T' | 'G', DifficultyLevel>>({
    D: START_LEVEL, C: START_LEVEL, T: START_LEVEL, G: START_LEVEL,
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
  const [remainingSeconds, setRemainingSeconds] = useState(TEST_DURATION_SECONDS)
  const timerDeadlineRef = useRef<number | null>(null)

  // ── 30-minute countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (loadState !== 'ready' || isSubmitting) return

    if (timerDeadlineRef.current === null) {
      timerDeadlineRef.current = Date.now() + TEST_DURATION_SECONDS * 1000
    }

    const timerId = window.setInterval(() => {
      const secondsLeft = Math.max(
        0,
        Math.ceil((timerDeadlineRef.current! - Date.now()) / 1000),
      )
      setRemainingSeconds(secondsLeft)

      if (secondsLeft === 0) window.clearInterval(timerId)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [loadState, isSubmitting])

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

        // Pick the very first question (axis D, starting level 5 = midpoint)
        const firstAxis = AXIS_SEQUENCE[0]
        const firstQ = pickQuestion(pool, firstAxis, START_LEVEL)
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
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      correctId: currentQuestion.correctId,
    }
    const updatedResults = [...results, newResult]

    // ── Adaptive: update difficulty for this axis (+1 on correct, -1 on wrong) ──
    const skill = AXIS_SEQUENCE[currentIndex]
    const prevLevel = axisLevelRef.current[skill]
    const nextLevel = (
      isCorrect
        ? Math.min(prevLevel + 1, MAX_LEVEL)
        : Math.max(prevLevel - 1, MIN_LEVEL)
    ) as DifficultyLevel
    const updatedAxisLevel = { ...axisLevelRef.current, [skill]: nextLevel }

    const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1

    if (isLastQuestion) {
      setIsSubmitting(true)

      const rawRoleId = localStorage.getItem('pending_role_id')
      const roleId = rawRoleId ? parseInt(rawRoleId, 10) : null

      if (!roleId) {
        setIsSubmitting(false)
        setFetchError('No role selected. Please go back and choose a role.')
        navigate({ to: '/onboarding/role-selection' })
        return
      }

      type AnsweredResult = QuestionResult & { selectedId: string }
      const answeredResults = updatedResults.filter(
        (r): r is AnsweredResult => r.selectedId !== null,
      )
      const formattedResults = answeredResults.map((r) => ({
        question_id: parseInt(r.questionId, 10),
        selected_id: r.selectedId,
        is_correct: r.isCorrect,
        axis: r.axis,
        difficulty: r.difficulty,
      }))

      completePlacementTest({ role_id: roleId, placement_test_answers: formattedResults })
        .catch((err) => console.warn('Failed to commit placement test:', err))
        .finally(() => {
          localStorage.removeItem('pending_survey_answers')
          localStorage.removeItem('pending_role_id')
          navigate({ to: '/placement-result', state: { results: updatedResults } as HistoryState })
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
  const timerMinutes = Math.floor(remainingSeconds / 60)
  const timerSeconds = remainingSeconds % 60
  const isTimeRunningLow = remainingSeconds <= 5 * 60

  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0072FF] z-40 flex items-center justify-between px-6 shadow-md">
        <img src={tmaLogo} alt="TMA Solutions" className="h-8 w-auto" />
        <button
          id="btn-exit-test"
          type="button"
          onClick={() => setShowQuit(true)}
          className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/20 text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Role Selection</span>
        </button>
      </div>

      {/* Progress bar — top */}
      <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Countdown timer — fixed to the right side in normal and F11 modes */}
      <aside
        aria-live="polite"
        aria-label="Placement test time remaining"
        className={`fixed right-8 top-24 z-30 w-[280px] rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur-sm
          sm:right-6 lg:right-7 lg:top-5/14 lg:-translate-y-1/2
          ${isTimeRunningLow ? 'border-rose-200' : 'border-blue-100'}
        `}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <svg className={`h-4 w-4 ${isTimeRunningLow ? 'text-rose-500' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Time left
        </div>
        <div className={`mt-2 font-mono text-3xl font-bold tabular-nums ${isTimeRunningLow ? 'text-rose-600' : 'text-slate-800'}`}>
          {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ${isTimeRunningLow ? 'bg-rose-500' : 'bg-blue-600'}`}
            style={{ width: `${(remainingSeconds / TEST_DURATION_SECONDS) * 100}%` }}
          />
        </div>
        {remainingSeconds === 0 && (
          <p className="mt-2 text-xs font-semibold text-rose-600">Time is up</p>
        )}
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20 pt-24">
        <div className="w-full max-w-xl">

          {/* Header Stepper & Badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step <= 3
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {step < 3 ? '✓' : step}
                  </div>
                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-gray-200 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Step 2 / 3 — Placement Test
              </div>
            </div>
          </div>

          {/* Sub-step dots progress & counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex gap-1.5 w-86 flex-wrap max-w-[280px] sm:max-w-none">
                {AXIS_SEQUENCE.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === currentIndex
                      ? 'w-5 h-2 bg-blue-600'
                      : i < currentIndex
                        ? 'w-2 h-2 bg-blue-300'
                        : 'w-2 h-2 bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-gray-500 text-sm font-mono shrink-0 ml-3">
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
              <p className="text-center text-[11px] text-gray-400 mt-2">
                🔒 You cannot go back — choose carefully
              </p>
            )}
          </div>

          {/* Error notice */}
          {fetchError && (
            <p className="mt-4 text-center text-xs text-red-500">{fetchError}</p>
          )}
        </div>
      </div>

      {/* Quit Modal */}
      {showQuit && (
        <QuitModal
          onStay={() => setShowQuit(false)}
          onQuit={() => navigate({ to: '/onboarding/role-selection' })}
        />
      )}
    </div>
  )
}