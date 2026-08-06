import { useState, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import tmaLogo from '@/asset/image/tma_logo.png'
import { useAuth } from '@/common/context/AuthContext'
import type { QuestionResult, SkillAxis } from '../api/placementTestTypes'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AxisScore {
  actual: number  // 0–100 from test
  target: number  // milestone target
}

type AxisMap = Record<SkillAxis, AxisScore>

// ─── Score computation ────────────────────────────────────────────────────────

// Tính điểm các trục dựa trên tỷ lệ câu trả lời đúng
function computeAxisScores(results: QuestionResult[], totalPerAxis: number = 12): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_biz']
  const scores: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_biz: 0 }

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
  G_biz: (20 / 100) * 78,
}

function normalizeTarget(t: number): number {
  return Math.round(Math.min(Math.max(t, 0), 100))
}

function generateAISummary(scores: Record<SkillAxis, number>): string {
  const axisNames: Record<SkillAxis, string> = {
    D_doc: 'technical documentation',
    C_comm: 'communication & presentation',
    T_trouble: 'troubleshooting',
    G_biz: 'business negotiation',
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

// ─── Result Breakdown ─────────────────────────────────────────────────────────

const AXIS_META_DISPLAY = [
  { key: 'D_doc' as SkillAxis, label: 'Documentation', color: 'text-blue-500', bar: 'bg-blue-400', track: 'bg-blue-50' },
  { key: 'C_comm' as SkillAxis, label: 'Communication', color: 'text-emerald-500', bar: 'bg-emerald-400', track: 'bg-emerald-50' },
  { key: 'T_trouble' as SkillAxis, label: 'Troubleshooting', color: 'text-rose-500', bar: 'bg-rose-400', track: 'bg-rose-50' },
  { key: 'G_biz' as SkillAxis, label: 'Business', color: 'text-amber-500', bar: 'bg-amber-400', track: 'bg-amber-50' },
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

  const results: QuestionResult[] = (routerState as { results?: QuestionResult[] })?.results ?? []
  const hasDemoData = results.length === 0

  const demoResults: QuestionResult[] = hasDemoData
    ? [
      { questionId: 'd1', axis: 'D_doc', difficulty: 5, selectedId: 'a', isCorrect: false },
      { questionId: 'd2', axis: 'D_doc', difficulty: 6, selectedId: 'a', isCorrect: false },
      { questionId: 'd3', axis: 'D_doc', difficulty: 7, selectedId: 'a', isCorrect: false },
      { questionId: 'd4', axis: 'D_doc', difficulty: 8, selectedId: 'a', isCorrect: false },
      { questionId: 'd5', axis: 'D_doc', difficulty: 9, selectedId: 'b', isCorrect: true },
      { questionId: 'd6', axis: 'D_doc', difficulty: 10, selectedId: 'b', isCorrect: true },
      { questionId: 'd7', axis: 'D_doc', difficulty: 5, selectedId: 'a', isCorrect: false },
      { questionId: 'd8', axis: 'D_doc', difficulty: 6, selectedId: 'c', isCorrect: true },
      { questionId: 'd9', axis: 'D_doc', difficulty: 7, selectedId: 'b', isCorrect: true },
      { questionId: 'd10', axis: 'D_doc', difficulty: 8, selectedId: 'b', isCorrect: true },
      { questionId: 'd11', axis: 'D_doc', difficulty: 9, selectedId: 'b', isCorrect: true },
      { questionId: 'd12', axis: 'D_doc', difficulty: 10, selectedId: 'b', isCorrect: true },

      { questionId: 'c1', axis: 'C_comm', difficulty: 5, selectedId: 'b', isCorrect: true },
      { questionId: 'c2', axis: 'C_comm', difficulty: 6, selectedId: 'b', isCorrect: true },
      { questionId: 'c3', axis: 'C_comm', difficulty: 5, selectedId: 'c', isCorrect: true },
      { questionId: 'c4', axis: 'C_comm', difficulty: 6, selectedId: 'a', isCorrect: true },
      { questionId: 'c5', axis: 'C_comm', difficulty: 5, selectedId: 'a', isCorrect: true },
      { questionId: 'c6', axis: 'C_comm', difficulty: 6, selectedId: 'b', isCorrect: true },
      { questionId: 'c7', axis: 'C_comm', difficulty: 5, selectedId: 'b', isCorrect: true },
      { questionId: 'c8', axis: 'C_comm', difficulty: 6, selectedId: 'b', isCorrect: true },
      { questionId: 'c9', axis: 'C_comm', difficulty: 5, selectedId: 'c', isCorrect: true },
      { questionId: 'c10', axis: 'C_comm', difficulty: 6, selectedId: 'a', isCorrect: true },
      { questionId: 'c11', axis: 'C_comm', difficulty: 5, selectedId: 'a', isCorrect: true },
      { questionId: 'c12', axis: 'C_comm', difficulty: 6, selectedId: 'b', isCorrect: true },

      { questionId: 't1', axis: 'T_trouble', difficulty: 5, selectedId: 'b', isCorrect: true },
      { questionId: 't2', axis: 'T_trouble', difficulty: 6, selectedId: 'b', isCorrect: true },
      { questionId: 't3', axis: 'T_trouble', difficulty: 7, selectedId: 'c', isCorrect: true },
      { questionId: 't4', axis: 'T_trouble', difficulty: 6, selectedId: 'a', isCorrect: true },
      { questionId: 't5', axis: 'T_trouble', difficulty: 7, selectedId: 'c', isCorrect: true },
      { questionId: 't6', axis: 'T_trouble', difficulty: 8, selectedId: 'b', isCorrect: true },
      { questionId: 't7', axis: 'T_trouble', difficulty: 5, selectedId: 'b', isCorrect: true },
      { questionId: 't8', axis: 'T_trouble', difficulty: 6, selectedId: 'b', isCorrect: true },
      { questionId: 't9', axis: 'T_trouble', difficulty: 7, selectedId: 'c', isCorrect: true },
      { questionId: 't10', axis: 'T_trouble', difficulty: 6, selectedId: 'a', isCorrect: true },
      { questionId: 't11', axis: 'T_trouble', difficulty: 7, selectedId: 'c', isCorrect: true },
      { questionId: 't12', axis: 'T_trouble', difficulty: 8, selectedId: 'b', isCorrect: true },

      { questionId: 'g1', axis: 'G_biz', difficulty: 5, selectedId: 'c', isCorrect: true },
      { questionId: 'g2', axis: 'G_biz', difficulty: 4, selectedId: 'c', isCorrect: true },
      { questionId: 'g3', axis: 'G_biz', difficulty: 3, selectedId: 'b', isCorrect: true },
      { questionId: 'g4', axis: 'G_biz', difficulty: 4, selectedId: 'a', isCorrect: true },
      { questionId: 'g5', axis: 'G_biz', difficulty: 3, selectedId: 'c', isCorrect: true },
      { questionId: 'g6', axis: 'G_biz', difficulty: 4, selectedId: 'b', isCorrect: true },
      { questionId: 'g7', axis: 'G_biz', difficulty: 5, selectedId: 'c', isCorrect: true },
      { questionId: 'g8', axis: 'G_biz', difficulty: 4, selectedId: 'c', isCorrect: true },
      { questionId: 'g9', axis: 'G_biz', difficulty: 3, selectedId: 'b', isCorrect: true },
      { questionId: 'g10', axis: 'G_biz', difficulty: 4, selectedId: 'a', isCorrect: true },
      { questionId: 'g11', axis: 'G_biz', difficulty: 3, selectedId: 'c', isCorrect: true },
      { questionId: 'g12', axis: 'G_biz', difficulty: 4, selectedId: 'b', isCorrect: true },
    ]
    : results

  const totalQuestions = 48 // Tổng số câu hỏi cố định theo yêu cầu
  const questionsPerAxis = totalQuestions / 4 // 12 câu mỗi trục

  const totalCorrect = demoResults.filter((r) => r.isCorrect).length
  // Tính điểm hệ 10 và làm tròn 1 chữ số thập phân
  const scoreOutOf10 = ((totalCorrect / totalQuestions) * 10).toFixed(1)
  const overallPct = Math.round((totalCorrect / totalQuestions) * 100)

  const actualScores = computeAxisScores(demoResults, questionsPerAxis)
  const axisMap: AxisMap = {
    D_doc: { actual: actualScores.D_doc, target: normalizeTarget(DEMO_TARGETS.D_doc) },
    C_comm: { actual: actualScores.C_comm, target: normalizeTarget(DEMO_TARGETS.C_comm) },
    T_trouble: { actual: actualScores.T_trouble, target: normalizeTarget(DEMO_TARGETS.T_trouble) },
    G_biz: { actual: actualScores.G_biz, target: normalizeTarget(DEMO_TARGETS.G_biz) },
  }

  // Hàm tính toán số câu đúng / tổng số câu (cố định mỗi trục 12 câu)
  const getAxisStats = (axis: SkillAxis) => {
    const relevant = demoResults.filter((r) => r.axis === axis)
    const correct = relevant.filter((r) => r.isCorrect).length
    const percentage = Math.round((correct / questionsPerAxis) * 100)
    return { correct, total: questionsPerAxis, percentage }
  }

  const aiSummary = generateAISummary(actualScores)
  const startingLevel = determineStartingLevel(actualScores)
  
  const [showContent, setShowContent] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<SkillAxis>('D_doc')
  const [hoursPerWeek, setHoursPerWeek] = useState(8)

  const totalHours = LEVEL_CONFIG[startingLevel].hours
  const weeks = Math.ceil(totalHours / hoursPerWeek)
  const months = (weeks / 4.33).toFixed(1)

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

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200)
    return () => clearTimeout(t)
  }, [])

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
            onClick={() => navigate({ to: '/profile' })}
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
                const axisResults = demoResults.filter(r => r.axis === ax.key)
                const axisCorrect = axisResults.filter(r => r.isCorrect).length
                return (
                  <button
                    key={ax.key}
                    onClick={() => setActiveTab(ax.key)}
                    className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${isActive ? `border-blue-600 text-blue-600` : `border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`
                      }`}
                  >
                    <span className={isActive ? ax.color : ''}>{ax.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {axisCorrect}/{questionsPerAxis}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {AXIS_META_DISPLAY.filter(ax => ax.key === activeTab).map((ax) => {
                const axisResults = demoResults.filter(r => r.axis === ax.key)
                return (
                  <div key={ax.key} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6">
                      {axisResults.map((r, idx) => {
                        const qText = r.questionText || `This is a sample question about ${ax.label} (Question ${idx + 1}). How would you handle this scenario?`
                        const options = r.options || [
                          { id: 'a', text: 'The correct approach for the situation.' },
                          { id: 'b', text: 'An incorrect, less optimal option.' },
                          { id: 'c', text: 'Another wrong choice that might seem right.' },
                          { id: 'd', text: 'Completely off topic.' }
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
                              <div className="flex-shrink-0">
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