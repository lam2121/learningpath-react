import { useState, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut, Loader2 } from 'lucide-react'
import tmaLogo from '@/asset/image/tma_logo.png'
import { useAuth } from '@/common/context/AuthContext'
import { useRadar } from '@/feature/radar'
import type { QuestionResult, SkillAxis } from '../api/placementTestTypes'
import { fetchPlacementTestResult, type PlacementResult, type PlacementAnswerDetail } from '../api/onboardingApi'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AxisScore {
  actual: number  // 0–100 from test
  target: number  // milestone target
}

type AxisMap = Record<SkillAxis, AxisScore>

// ─── Score computation ────────────────────────────────────────────────────────

// Tính điểm các trục dựa trên tỷ lệ câu trả lời đúng
function computeAxisScores(results: QuestionResult[], totalPerAxis: number = 12): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_custom']
  const scores: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_custom: 0 }

  axes.forEach((axis) => {
    const relevant = results.filter((r) => r.axis === axis)
    const correct = relevant.filter((r) => r.isCorrect).length
    scores[axis] = Math.round((correct / totalPerAxis) * 100)
  })

  return scores
}

const DEMO_TARGETS: Record<SkillAxis, number> = {
  D_doc: (20 / 100) * 78,
  C_comm: (50 / 100) * 78,
  T_trouble: (10 / 100) * 78,
  G_custom: (20 / 100) * 78,
}

function normalizeTarget(t: number): number {
  return Math.round(Math.min(Math.max(t, 0), 100))
}

function generateAISummary(scores: Record<SkillAxis, number>): string {
  const axisNames: Record<SkillAxis, string> = {
    D_doc: 'technical documentation',
    C_comm: 'communication & presentation',
    T_trouble: 'troubleshooting',
    G_custom: 'business negotiation',
  }

  const entries = Object.entries(scores) as [SkillAxis, number][]
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const best = sorted.map(([k]) => k)
  const worst = [...best].reverse()

  const totalAvg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4)

  if (totalAvg >= 75) {
    return `Excellent! Your IT communication skills are at a high level — particularly in ${axisNames[best[0]]}. The system will focus on ${axisNames[worst[0]]} to help you reach expert-level proficiency.`
  } else if (totalAvg >= 50) {
    return `Good! You have a solid foundation in ${axisNames[best[0]]}. Your learning path will be personalized to strengthen ${axisNames[worst[0]]} — the most important skill to improve in your career track.`
  } else {
    return `Welcome to the journey! Every expert starts here. The system will build a step-by-step learning path, prioritizing ${axisNames[worst[0]]} and reinforcing ${axisNames[best[0]]} — perfectly suited to your learning pace.`
  }
}

// ─── Track Level Configuration ────────────────────────────────────────────────

type StartingLevel = 'basic' | 'intermediate' | 'advanced'

const LEVEL_CONFIG: Record<StartingLevel, {
  label: string
  hours: number
  color: string
}> = {
  basic: {
    label: 'Basic Track',
    hours: 48,
    color: 'text-slate-700',
  },
  intermediate: {
    label: 'Intermediate Track',
    hours: 96,
    color: 'text-blue-700',
  },
  advanced: {
    label: 'Advanced Track',
    hours: 144,
    color: 'text-emerald-700',
  },
}

function determineStartingLevel(scores: Record<SkillAxis, number>): StartingLevel {
  const fractions = Object.values(scores).map(s => s / 100)
  const overall = fractions.reduce((a, b) => a + b, 0) / fractions.length
  const minSkill = Math.min(...fractions)

  if (overall < 0.45 || minSkill < 0.30) {
    return 'basic'
  } else if (overall >= 0.75 && minSkill >= 0.50) {
    return 'advanced'
  } else {
    return 'intermediate'
  }
}

// ─── Difficulty Label ─────────────────────────────────────────────────────────

function getDifficultyLabel(level: number): { label: string; color: string; bg: string; border: string } {
  if (level <= 2) return { label: 'Easy',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' }
  if (level <= 4) return { label: 'Medium', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'    }
  if (level <= 6) return { label: 'Hard',   color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200'  }
  return              { label: 'Expert', color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200'    }
}

// ─── Result Breakdown ─────────────────────────────────────────────────────────

const AXIS_META_DISPLAY = [
  { key: 'D_doc' as SkillAxis, label: 'Documentation', color: 'text-blue-500', bar: 'bg-blue-400', track: 'bg-blue-50' },
  { key: 'C_comm' as SkillAxis, label: 'Communication', color: 'text-emerald-500', bar: 'bg-emerald-400', track: 'bg-emerald-50' },
  { key: 'T_trouble' as SkillAxis, label: 'Troubleshooting', color: 'text-rose-500', bar: 'bg-rose-400', track: 'bg-rose-50' },
  { key: 'G_custom' as SkillAxis, label: 'Business', color: 'text-amber-500', bar: 'bg-amber-400', track: 'bg-amber-50' },
]

// ─── Main Result View ─────────────────────────────────────────────────────────

export function PlacementResultView() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const routerState = useRouterState({ select: (s) => s.location.state })
  const handleSignOut = () => {
    logout()
    navigate({ to: '/login' })
  }

  // State for backend result
  const [result, setResult] = useState<PlacementResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<SkillAxis>('D_doc')
  const [hoursPerWeek, setHoursPerWeek] = useState(8)

  // Use router state as instant paint fallback, but fetch from backend as source of truth
  const routerResults: QuestionResult[] = (routerState as { results?: QuestionResult[] })?.results ?? []

  const { reinitialize: reinitializeRadar } = useRadar()

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await fetchPlacementTestResult()
        setResult(data)
        if (data.learning_status === 'enrolled') {
          reinitializeRadar(true)
        }
      } catch (err) {
        console.error('Failed to fetch placement test result:', err)
        setError('Failed to load your results. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [reinitializeRadar])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.popup === 'details') {
        setShowDetails(true)
      } else {
        setShowDetails(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200)
    return () => clearTimeout(t)
  }, [])

  // While loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-lg font-medium text-slate-600">Loading your results...</p>
      </div>
    )
  }

  // If no result from backend and no router fallback, show empty state
  if (!result && routerResults.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl text-center">
          <div className="text-6xl mb-4 animate-in zoom-in-50 duration-500">📊</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
            No Results Yet
          </h1>
          <p className="text-slate-600 text-base font-medium mb-8">
            Complete the placement test to see your personalized IT communication skill profile.
          </p>
          <button
            onClick={() => navigate({ to: '/onboarding/role-selection' })}
            className="py-4 px-8 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-extrabold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Start Placement Test
          </button>
        </div>
      </div>
    )
  }

  // Use backend result if available, otherwise fall back to router state
  const useBackend = result && result.learning_status === 'enrolled'
  const resultsToUse = useBackend ? result.answers.map((a: PlacementAnswerDetail) => {
    // Options come back in DB order; the user's pick is matched by TEXT so the
    // letter the frontend shuffled at test time never needs to line up again.
    const opts = a.options.map((text: string, i: number) => ({ id: ['a', 'b', 'c', 'd'][i] ?? String(i), text }))
    const correctId = opts.find((o) => o.text === a.correct_answer)?.id ?? 'a'
    const selectedId = a.selected_text
      ? (opts.find((o) => o.text === a.selected_text)?.id ?? null)
      : null
    return {
      questionId: String(a.question_id),
      axis: a.axis as SkillAxis,
      difficulty: a.level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
      selectedId,
      isCorrect: a.is_correct,
      questionText: a.statement,
      options: opts,
      correctId,
    }
  }) : routerResults

  const totalQuestions = useBackend ? result.total_questions : 48
  const totalCorrect = useBackend ? result.total_correct : resultsToUse.filter((r: QuestionResult) => r.isCorrect).length
  const overallPct = useBackend ? result.overall_percent : Math.round((totalCorrect / totalQuestions) * 100)
  const scoreOutOf10 = ((totalCorrect / totalQuestions) * 10).toFixed(1)

  // Compute axis scores from backend or fallback
  const actualScores = useBackend ? {
    D_doc: result.skill_scores.D_doc || 0,
    C_comm: result.skill_scores.C_comm || 0,
    T_trouble: result.skill_scores.T_trouble || 0,
    G_custom: result.skill_scores.G_custom || 0,
  } : computeAxisScores(resultsToUse, totalQuestions / 4)

  // Target bars: use role baseline if available, otherwise fallback to demo targets
  const roleBaseline = useBackend && result.baseline ? {
    D_doc: result.baseline.D_doc || 0,
    C_comm: result.baseline.C_comm || 0,
    T_trouble: result.baseline.T_trouble || 0,
    G_custom: result.baseline.G_custom || 0,
  } : DEMO_TARGETS

  const axisMap: AxisMap = {
    D_doc: { actual: actualScores.D_doc, target: normalizeTarget(roleBaseline.D_doc) },
    C_comm: { actual: actualScores.C_comm, target: normalizeTarget(roleBaseline.C_comm) },
    T_trouble: { actual: actualScores.T_trouble, target: normalizeTarget(roleBaseline.T_trouble) },
    G_custom: { actual: actualScores.G_custom, target: normalizeTarget(roleBaseline.G_custom) },
  }

  // Hàm tính toán số câu đúng / tổng số câu (cố định mỗi trục 12 câu)
  const getAxisStats = (axis: SkillAxis) => {
    if (useBackend) {
      // Backend: compute from answers (group by axis)
      const relevant = resultsToUse.filter((r: QuestionResult) => r.axis === axis)
      const correct = relevant.filter((r: QuestionResult) => r.isCorrect).length
      const total = relevant.length
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
      return { correct, total, percentage }
    } else {
      // Fallback: fixed 12 per axis
      const relevant = resultsToUse.filter((r: QuestionResult) => r.axis === axis)
      const correct = relevant.filter((r: QuestionResult) => r.isCorrect).length
      const percentage = Math.round((correct / (totalQuestions / 4)) * 100)
      return { correct, total: totalQuestions / 4, percentage }
    }
  }

   const aiSummary = generateAISummary(actualScores)
   const startingLevel = useBackend ? result.starting_level as StartingLevel : determineStartingLevel(actualScores)
  
  const totalHours = LEVEL_CONFIG[startingLevel].hours
  const weeks = Math.ceil(totalHours / hoursPerWeek)
  const months = (weeks / 4.33).toFixed(1)

  const openDetails = () => {
    window.history.pushState({ popup: 'details' }, '')
    setShowDetails(true)
  }

  const closeDetails = () => {
    if (window.history.state?.popup === 'details') {
      window.history.back()
    } else {
      setShowDetails(false)
    }
  }

  function gradeLabel(pct: number): { label: string; color: string } {
    if (pct >= 80) return { label: 'Excellent', color: 'text-emerald-600' }
    if (pct >= 60) return { label: 'Good', color: 'text-blue-600' }
    if (pct >= 40) return { label: 'Needs Work', color: 'text-amber-600' }
    return { label: 'Keep Practicing', color: 'text-rose-600' }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="w-full bg-[#007aff] px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <img src={tmaLogo} alt="TMA Solutions" className="w-36 h-auto" />
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-10 pb-16">
        <div className={`w-full max-w-4xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Celebration header */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 animate-in zoom-in-50 duration-500">🎉</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
              Placement Test Complete!
            </h1>
            <p className="text-slate-600 text-base font-medium">
              This is your IT communication skill profile — measured across {totalQuestions} real-world questions.
            </p>

          </div>

          {/* ── Overall score & Starting Track ─────────────── */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-6 flex flex-col md:flex-row items-stretch">
            
            {/* LEFT SIDE: Score */}
            <div className="flex-1 flex items-center justify-center gap-6 pr-0 md:pr-8">
              {/* Score circle */}
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallPct / 100) * 263.9} 263.9`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-800">{scoreOutOf10}</span>
                  <span className="text-base font-bold text-slate-400 mt-1">/10</span>
                </div>
              </div>

              {/* Score details */}
              <div className="text-left flex flex-col justify-center">
                <div className={`text-4xl font-extrabold mb-3 ${gradeLabel(overallPct).color}`}>
                  {gradeLabel(overallPct).label}
                </div>
                <div className="text-slate-600 text-lg font-bold bg-slate-50 inline-flex px-4 py-2 rounded-xl border border-slate-100 whitespace-nowrap">
                  {totalCorrect} / {totalQuestions} correct overall
                </div>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px bg-slate-200 mx-6 my-4" />
            <div className="md:hidden h-px bg-slate-200 my-8 w-full" />

            {/* RIGHT SIDE: Starting Track */}
            <div className="flex-1 flex items-center justify-center pl-0 md:pl-8">
              <div className="w-full text-center flex flex-col items-center justify-center">
                 <p className={`text-sm ${LEVEL_CONFIG[startingLevel].color} font-bold uppercase tracking-widest mb-3 opacity-90`}>
                   RECOMMENDED TRACK
                 </p>
                 <h2 className={`text-4xl font-black ${LEVEL_CONFIG[startingLevel].color}`}>
                   {LEVEL_CONFIG[startingLevel].label}
                 </h2>
              </div>
            </div>

          </div>

          {/* ── Vertical Bar Chart ─────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                SKILL BREAKDOWN — ACTUAL VS TARGET
              </p>
              {/* Legend */}
              <div className="flex gap-5 mt-4 sm:mt-0">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                  <div className="w-5 h-4 bg-blue-400 rounded-sm" />
                  Actual Score
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                  <div className="w-5 h-0.5 bg-slate-400 border-0" style={{ borderTop: '2px dashed #94a3b8' }} />
                  Target Level
                </div>
              </div>
            </div>

            {/* Các cột dọc thể hiện điểm số */}
            <div className="flex justify-around items-end h-72 w-full pt-4">
              {AXIS_META_DISPLAY.map((ax) => {
                const stats = getAxisStats(ax.key)
                const target = axisMap[ax.key].target

                return (
                  <div key={ax.key} className="flex flex-col items-center flex-1">

                    {/* Phần hiển thị điểm số ở trên đầu cột */}
                    <div className="mb-3 text-center">
                      <span className={`text-3xl font-black ${ax.color}`}>
                        {stats.correct}
                      </span>
                      <span className="text-xl font-bold text-slate-400">
                        /{stats.total}
                      </span>
                    </div>

                    {/* Cột biểu đồ dọc */}
                    <div className={`relative w-28 h-48 rounded-t-xl ${ax.track} overflow-hidden border border-slate-100 flex items-end justify-center group`}>
                      {/* Đường chỉ tiêu (Target) */}
                      <div
                        className="absolute left-0 right-0 h-[2px] bg-slate-400/90 z-10 border-t-2 border-dashed border-slate-400"
                        style={{ bottom: `${target}%` }}
                      >
                        <span className="absolute -top-5 left-1 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Target
                        </span>
                      </div>

                      {/* Cột màu thể hiện tiến độ */}
                      <div
                        className={`w-full ${ax.bar} rounded-t-xl transition-all duration-1000 ease-out`}
                        style={{ height: `${showContent ? stats.percentage : 0}%` }}
                      />
                    </div>

                    {/* Nhãn (Label) ở dưới đáy cột (Đã xóa text Level) */}
                    <div className="mt-5 text-center">
                      <span className={`block text-lg font-bold ${ax.color}`}>
                        {ax.label}
                      </span>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Nút View Lại Kết Quả */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={openDetails}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-colors"
              >
                View Detailed Results
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── AI Summary ─────────────────────────────────────────────── */}
          <div className="bg-blue-50/60 border border-blue-100 shadow-sm rounded-3xl p-8 mb-8">
            <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-3">
              ADVISOR · PERSONAL FEEDBACK
            </p>
            <p className="text-base text-slate-700 font-medium leading-relaxed italic">
              "{aiSummary}"
            </p>
          </div>

          {/* ── Weekly Study Hours & ETA ───────────────────────────────── */}
          <div className="flex flex-col gap-6 mb-8">
            {/* Weekly Study Hours Card */}
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">
                  WEEKLY STUDY HOURS
                </p>
                <div className="px-4 py-1.5 rounded-xl text-sm font-black bg-blue-50 text-[#007aff] border border-blue-200">
                  {hoursPerWeek}h / week
                </div>
              </div>

              <div className="relative mb-2">
                <div className="absolute top-1/2 left-0 right-0 h-2 -mt-1 bg-slate-100 rounded-full" />
                <div
                  className="absolute top-1/2 left-0 h-2 -mt-1 bg-gradient-to-r from-blue-400 to-[#007aff] rounded-full pointer-events-none"
                  style={{ width: `${((hoursPerWeek - 1) / 19) * 100}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer relative z-10 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                             [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#007aff] 
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-bold mt-3">
                <span>1h (Relaxed)</span>
                <span>10h (Balanced)</span>
                <span>20h (Intensive)</span>
              </div>
            </div>

            {/* Estimated Completion Time Card */}
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-8 text-center">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-4">
                ESTIMATED COMPLETION TIME
              </p>

              <div className="flex items-end justify-center gap-2 mb-2">
                <span className="text-5xl font-black text-indigo-700">
                  {weeks}
                </span>
                <span className="text-slate-500 text-lg font-bold mb-1">weeks</span>
              </div>

              <p className="text-slate-600 text-sm mb-6 font-semibold">
                ≈ <span className="text-slate-900 font-black">{months}</span> months at{' '}
                <span className="text-slate-900 font-black">{hoursPerWeek}h/week</span>
              </p>

              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60 mb-3">
                <div
                  className="h-full rounded-full bg-[#007aff] transition-all duration-500"
                  style={{ width: `${Math.min((hoursPerWeek / 20) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mb-4">
                <span>1h</span>
                <span>10h</span>
                <span>20h</span>
              </div>

              <div className="text-sm text-slate-600 font-semibold">
                {hoursPerWeek >= 14
                  ? 'Great learning pace!'
                  : hoursPerWeek >= 8
                    ? 'Steady progress, on the right track.'
                    : 'Adding a few more hours/week will get you to your goal much faster.'}
              </div>
            </div>
          </div>

          {/* ── CTA Button ─────────────────────────────────────────────── */}
          <button
            id="btn-create-course"
            type="button"
            onClick={async () => {
              await reinitializeRadar(true)
              navigate({ to: '/profile' })
            }}
            className="w-full py-5 px-6 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-extrabold text-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span>Create My Course</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

           <p className="text-center text-sm font-semibold text-slate-400 mt-5">
             AI will generate 24 fully personalized lessons for your career track
           </p>
           {error && (
             <p className="mt-4 text-center text-sm text-red-500">{error}</p>
           )}
         </div>
       </div>

      {/* ── Details Popup ─────────────────────────────────────────────── */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDetails} />
          <div className="relative z-10 bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-800">Detailed Results ({totalCorrect}/{totalQuestions})</h2>
              <button onClick={closeDetails} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="flex px-6 pt-2 space-x-2 border-b border-slate-100 overflow-x-auto shrink-0 bg-white">
              {AXIS_META_DISPLAY.map(ax => {
                const isActive = activeTab === ax.key
                const axisResults = resultsToUse.filter((r: QuestionResult) => r.axis === ax.key)
                const axisCorrect = axisResults.filter((r: QuestionResult) => r.isCorrect).length
                const axisTotal = useBackend ? axisResults.length : totalQuestions / 4
                return (
                  <button
                    key={ax.key}
                    onClick={() => setActiveTab(ax.key)}
                    className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${isActive ? `border-blue-600 text-blue-600` : `border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`
                      }`}
                  >
                    <span className={isActive ? ax.color : ''}>{ax.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {axisCorrect}/{axisTotal}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
            {AXIS_META_DISPLAY.filter(ax => ax.key === activeTab).map((ax) => {
                const axisResults = resultsToUse.filter((r: QuestionResult) => r.axis === ax.key)
                return (
                  <div key={ax.key} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                      {axisResults.map((r: QuestionResult, idx: number) => {
                        const qText = r.questionText || `This is a sample question about ${ax.label} (Question ${idx + 1}). How would you handle this scenario?`
                        const options = r.options || [
                          { id: 'a', text: 'The correct approach for the situation.' },
                          { id: 'b', text: 'An incorrect, less optimal option.' },
                          { id: 'c', text: 'Another wrong choice that might seem right.' },
                          { id: 'd', text: 'Completely off topic.' },
                        ]
                        const correctId = r.correctId || (r.isCorrect ? (r.selectedId || 'a') : (r.selectedId === 'a' ? 'b' : 'a'))

                        return (
                          <div key={idx} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-start gap-4 mb-5">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${r.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {idx + 1}
                              </div>
                              <p className="text-slate-800 font-semibold leading-relaxed mt-1 flex-1">
                                {qText}
                              </p>
                              <div className="flex-shrink-0 flex flex-row items-center gap-2">
                                {/* Difficulty badge */}
                                {r.difficulty != null && (() => {
                                  const diff = getDifficultyLabel(r.difficulty)
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${diff.bg} ${diff.color} ${diff.border}`}>
                                      {diff.label}
                                      <span className="font-normal opacity-60">Lv {r.difficulty}</span>
                                    </span>
                                  )
                                })()}
                                {/* Correct / Incorrect badge */}
                                {r.isCorrect ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Correct
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Incorrect
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 md:pl-12">
                              {options.map(opt => {
                                const isSelected = r.selectedId === opt.id
                                const isCorrectAnswer = correctId === opt.id

                                let containerClass = "flex items-center gap-3 p-3.5 rounded-xl border transition-colors "
                                let icon = null

                                if (isSelected && isCorrectAnswer) {
                                  containerClass += "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  icon = <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                } else if (isSelected && !isCorrectAnswer) {
                                  containerClass += "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                                  icon = <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                } else if (!isSelected && isCorrectAnswer) {
                                  containerClass += "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  icon = <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                } else {
                                  containerClass += "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-medium"
                                  icon = <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                }

                                return (
                                  <div key={opt.id} className={containerClass}>
                                    {icon}
                                    <span className={`text-sm ${isSelected && !isCorrectAnswer ? 'line-through opacity-70' : ''}`}>
                                      {opt.text}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}