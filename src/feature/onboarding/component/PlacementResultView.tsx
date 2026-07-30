import { useState, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import type { QuestionResult, SkillAxis } from '../api/placementTestTypes'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AxisScore {
  actual: number  // 0–100 from test
  target: number  // milestone target
}

type AxisMap = Record<SkillAxis, AxisScore>

// ─── Radar Chart (pure SVG) ───────────────────────────────────────────────────

const AXES: { key: SkillAxis; label: string; labelEn: string }[] = [
  { key: 'D_doc',     label: 'Documentation',   labelEn: 'D' },
  { key: 'C_comm',    label: 'Communication',    labelEn: 'C' },
  { key: 'T_trouble', label: 'Troubleshooting',  labelEn: 'T' },
  { key: 'G_biz',     label: 'Business',         labelEn: 'G' },
]

const AXIS_COLORS: Record<SkillAxis, string> = {
  D_doc: '#60a5fa',  // blue-400
  C_comm: '#34d399',  // emerald-400
  T_trouble: '#f87171',  // rose-400
  G_biz: '#fbbf24',  // amber-400
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function buildPolygonPoints(cx: number, cy: number, maxR: number, values: number[], total: number) {
  return values
    .map((v, i) => {
      const angle = (360 / total) * i
      const r = (v / 100) * maxR
      const p = polarToCartesian(cx, cy, r, angle)
      return `${p.x},${p.y}`
    })
    .join(' ')
}

interface RadarChartProps {
  axisMap: AxisMap
  animated: boolean
}

function RadarChart({ axisMap, animated }: RadarChartProps) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const total = AXES.length

  const actualValues = AXES.map((a) => axisMap[a.key]?.actual ?? 0)
  const targetValues = AXES.map((a) => axisMap[a.key]?.target ?? 0)

  const [displayValues, setDisplayValues] = useState(AXES.map(() => 0))
  const [displayTarget, setDisplayTarget] = useState(AXES.map(() => 0))

  useEffect(() => {
    if (!animated) {
      setDisplayValues(actualValues)
      setDisplayTarget(targetValues)
      return
    }
    const duration = 900
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayValues(actualValues.map((v) => v * ease))
      setDisplayTarget(targetValues.map((v) => v * ease))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [animated, JSON.stringify(actualValues)])

  // Grid rings
  const rings = [20, 40, 60, 80, 100]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
      {/* Grid rings */}
      {rings.map((pct) => {
        const pts = Array.from({ length: total }, (_, i) => {
          const angle = (360 / total) * i
          const r = (pct / 100) * maxR
          return polarToCartesian(cx, cy, r, angle)
        })
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
        return (
          <path key={pct} d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        )
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const angle = (360 / total) * i
        const end = polarToCartesian(cx, cy, maxR, angle)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        )
      })}

      {/* Target polygon */}
      <polygon
        points={buildPolygonPoints(cx, cy, maxR, displayTarget, total)}
        fill="rgba(99,102,241,0.15)"
        stroke="rgba(129,140,248,0.7)"
        strokeWidth={1.5}
        strokeDasharray="5,3"
      />

      {/* Actual polygon */}
      <polygon
        points={buildPolygonPoints(cx, cy, maxR, displayValues, total)}
        fill="rgba(59,130,246,0.25)"
        stroke="rgba(96,165,250,0.9)"
        strokeWidth={2.5}
      />

      {/* Axis dots + labels */}
      {AXES.map((axis, i) => {
        const angle = (360 / total) * i
        const dotPt = polarToCartesian(cx, cy, (displayValues[i] / 100) * maxR, angle)
        const labelPt = polarToCartesian(cx, cy, maxR + 20, angle)

        return (
          <g key={axis.key}>
            {/* Dot on actual */}
            <circle cx={dotPt.x} cy={dotPt.y} r={4} fill={AXIS_COLORS[axis.key]} />
            {/* Label */}
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={AXIS_COLORS[axis.key]}
              fontSize={11}
              fontWeight={700}
              fontFamily="Inter, sans-serif"
            >
              {axis.labelEn}
            </text>
          </g>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.3)" />
    </svg>
  )
}

// ─── Score computation ────────────────────────────────────────────────────────

/**
 * Final score per axis = the difficulty level of the LAST question answered
 * for that axis (the adaptive endpoint after 6 questions per axis).
 *
 * Rule (US-06c):
 *  - Each axis starts at level 5/10
 *  - Correct → +1, Wrong → -1 (clamped 1–10)
 *  - After 6 questions the level reached IS the score for that axis
 *  - Final vector stored as level (1-10); displayed as level / 10 * 100 for radar
 */
function computeAxisScores(results: QuestionResult[]): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_biz']
  const scores: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_biz: 0 }

  axes.forEach((axis) => {
    const relevant = results.filter((r) => r.axis === axis)
    if (relevant.length === 0) return
    // The LAST question's difficulty = the adaptive level reached for this axis
    const lastLevel = relevant[relevant.length - 1].difficulty  // 1–10
    // Normalize to 0-100 for radar display
    scores[axis] = Math.round((lastLevel / 10) * 100)
  })

  return scores
}

/**
 * Raw level vector (1-10) per axis, stored in test_session.final_vector.
 * Used for backend submission and display labels.
 */
function computeLevelVector(results: QuestionResult[]): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_biz']
  const levels: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_biz: 0 }
  axes.forEach((axis) => {
    const relevant = results.filter((r) => r.axis === axis)
    if (relevant.length === 0) return
    levels[axis] = relevant[relevant.length - 1].difficulty  // 1–10
  })
  return levels
}

// Demo target (Intermediate level for PM — shown when no session data)
const DEMO_TARGETS: Record<SkillAxis, number> = {
  D_doc: (20 / 100) * 78,  // 78 = intermediate total budget, then normalize to 100
  C_comm: (50 / 100) * 78,
  T_trouble: (10 / 100) * 78,
  G_biz: (20 / 100) * 78,
}

// Normalize targets to 0-100 scale for radar
function normalizeTarget(t: number): number {
  return Math.round(Math.min(Math.max(t, 0), 100))
}

/**
 * Generate a personalized AI summary based on actual axis scores (0-100 scale).
 */
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

// ─── Result Breakdown ─────────────────────────────────────────────────────────

const AXIS_META_DISPLAY = [
  { key: 'D_doc'     as SkillAxis, label: 'Documentation',  color: 'text-blue-300',    bar: 'bg-blue-400',    track: 'bg-blue-400/20' },
  { key: 'C_comm'    as SkillAxis, label: 'Communication',  color: 'text-emerald-300', bar: 'bg-emerald-400', track: 'bg-emerald-400/20' },
  { key: 'T_trouble' as SkillAxis, label: 'Troubleshooting', color: 'text-rose-300',   bar: 'bg-rose-400',    track: 'bg-rose-400/20' },
  { key: 'G_biz'     as SkillAxis, label: 'Business',       color: 'text-amber-300',   bar: 'bg-amber-400',   track: 'bg-amber-400/20' },
]

// ─── Main Result View ─────────────────────────────────────────────────────────

export function PlacementResultView() {
  const navigate = useNavigate()
  const routerState = useRouterState({ select: (s) => s.location.state })

  // Pull results from router state, or use demo data
  const results: QuestionResult[] = (routerState as { results?: QuestionResult[] })?.results ?? []
  const hasDemoData = results.length === 0

  // Demo results for testing without going through the test
  // Simulates the T-axis example from the spec:
  // Q1 lvl5(✓)→Q2 lvl6(✓)→Q3 lvl7(✗)→Q4 lvl6(✓)→Q5 lvl7(✓)→Q6 lvl8  → T score = lvl 8
  const demoResults: QuestionResult[] = hasDemoData
    ? [
      // D_doc: 5→6→7→8→9→10 (all correct) → final level 10
      { questionId: 'd1', axis: 'D_doc',     difficulty: 5,  selectedId: 'b', isCorrect: true },
      { questionId: 'd2', axis: 'D_doc',     difficulty: 6,  selectedId: 'c', isCorrect: true },
      { questionId: 'd3', axis: 'D_doc',     difficulty: 7,  selectedId: 'b', isCorrect: true },
      { questionId: 'd4', axis: 'D_doc',     difficulty: 8,  selectedId: 'b', isCorrect: true },
      { questionId: 'd5', axis: 'D_doc',     difficulty: 9,  selectedId: 'b', isCorrect: true },
      { questionId: 'd6', axis: 'D_doc',     difficulty: 10, selectedId: 'b', isCorrect: true },
      // C_comm: 5→6→5→6→5→6 (alternating) → final level 6
      { questionId: 'c1', axis: 'C_comm',    difficulty: 5,  selectedId: 'b', isCorrect: true },
      { questionId: 'c2', axis: 'C_comm',    difficulty: 6,  selectedId: 'b', isCorrect: false },
      { questionId: 'c3', axis: 'C_comm',    difficulty: 5,  selectedId: 'c', isCorrect: true },
      { questionId: 'c4', axis: 'C_comm',    difficulty: 6,  selectedId: 'a', isCorrect: false },
      { questionId: 'c5', axis: 'C_comm',    difficulty: 5,  selectedId: 'a', isCorrect: true },
      { questionId: 'c6', axis: 'C_comm',    difficulty: 6,  selectedId: 'b', isCorrect: false },
      // T_trouble: spec example 5→6→7→6→7→8 → final level 8
      { questionId: 't1', axis: 'T_trouble', difficulty: 5,  selectedId: 'b', isCorrect: true },
      { questionId: 't2', axis: 'T_trouble', difficulty: 6,  selectedId: 'b', isCorrect: true },
      { questionId: 't3', axis: 'T_trouble', difficulty: 7,  selectedId: 'c', isCorrect: false },
      { questionId: 't4', axis: 'T_trouble', difficulty: 6,  selectedId: 'a', isCorrect: true },
      { questionId: 't5', axis: 'T_trouble', difficulty: 7,  selectedId: 'c', isCorrect: true },
      { questionId: 't6', axis: 'T_trouble', difficulty: 8,  selectedId: 'b', isCorrect: true },
      // G_biz: 5→4→3→4→3→4 (mostly wrong) → final level 4
      { questionId: 'g1', axis: 'G_biz',     difficulty: 5,  selectedId: 'c', isCorrect: false },
      { questionId: 'g2', axis: 'G_biz',     difficulty: 4,  selectedId: 'c', isCorrect: false },
      { questionId: 'g3', axis: 'G_biz',     difficulty: 3,  selectedId: 'b', isCorrect: true },
      { questionId: 'g4', axis: 'G_biz',     difficulty: 4,  selectedId: 'a', isCorrect: false },
      { questionId: 'g5', axis: 'G_biz',     difficulty: 3,  selectedId: 'c', isCorrect: true },
      { questionId: 'g6', axis: 'G_biz',     difficulty: 4,  selectedId: 'b', isCorrect: false },
    ]
    : results

  const actualScores = computeAxisScores(demoResults)   // 0–100 for radar
  const levelVector  = computeLevelVector(demoResults)   // 1–10 final_vector
  const totalCorrect = demoResults.filter((r) => r.isCorrect).length
  const totalQuestions = demoResults.length || 24
  // Overall level = average of the 4 axis final levels (1-10 scale)
  const avgLevel = Math.round(
    Object.values(levelVector).reduce((a, b) => a + b, 0) / 4
  )
  // Normalized to 0-100 for the score ring
  const overallPct = Math.round((avgLevel / 10) * 100)

  const axisMap: AxisMap = {
    D_doc: { actual: actualScores.D_doc, target: normalizeTarget(DEMO_TARGETS.D_doc) },
    C_comm: { actual: actualScores.C_comm, target: normalizeTarget(DEMO_TARGETS.C_comm) },
    T_trouble: { actual: actualScores.T_trouble, target: normalizeTarget(DEMO_TARGETS.T_trouble) },
    G_biz: { actual: actualScores.G_biz, target: normalizeTarget(DEMO_TARGETS.G_biz) },
  }

  const aiSummary = generateAISummary(actualScores)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200)
    return () => clearTimeout(t)
  }, [])

  function gradeLabel(pct: number): { label: string; color: string } {
    if (pct >= 80) return { label: 'Excellent',    color: 'text-emerald-300' }
    if (pct >= 60) return { label: 'Good',          color: 'text-blue-300' }
    if (pct >= 40) return { label: 'Needs Work',    color: 'text-amber-300' }
    return           { label: 'Keep Practicing', color: 'text-rose-300' }
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo */}
      <img src={tmaLogo} alt="TMA Solutions" className="absolute top-6 left-6 w-45 h-auto z-20" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 pb-16">
        <div className={`w-full max-w-2xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* ── Celebration header ──────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-in zoom-in-50 duration-500">🎉</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 drop-shadow-md">
              Placement Test Complete!
            </h1>
            <p className="text-blue-100/60 text-sm">
              This is your IT communication skill profile — measured across 24 real-world questions.
            </p>
            {hasDemoData && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium">
                ⚡ Demo data — go to /placement-test to take the real test
              </div>
            )}
          </div>

          {/* ── Overall score (level 1-10 scale) ────────────────────────── */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-5 text-center">
            <div className="flex items-center justify-center gap-6">
              {/* Big score circle — shows average level / 10 */}
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
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
                  <span className="text-3xl font-black text-white">{avgLevel}</span>
                  <span className="text-xs text-white/40">/10</span>
                </div>
              </div>

              {/* Score details */}
              <div className="text-left">
                <div className={`text-xl font-bold mb-1 ${gradeLabel(overallPct).color}`}>
                  {gradeLabel(overallPct).label}
                </div>
                <div className="text-white/60 text-sm">
                  {totalCorrect} / {totalQuestions} correct
                </div>
                <div className="mt-1 text-white/40 text-xs">
                  Avg level: {avgLevel}/10
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {AXIS_META_DISPLAY.map((ax) => (
                    <div key={ax.key} className={`text-[10px] font-bold ${ax.color}`}>
                      {ax.label}: Lv {levelVector[ax.key]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Radar Chart + Legend ─────────────────────────────────────── */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-5 text-center">
              Radar Chart D/C/T/G — Actual vs Target
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Chart */}
              <div className="flex-shrink-0">
                <RadarChart axisMap={axisMap} animated={showContent} />
              </div>

              {/* Legend + axis scores */}
              <div className="flex-1 space-y-4 w-full">
                {/* Legend */}
                <div className="flex gap-4 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-6 h-0.5 bg-blue-400 rounded" />
                    Actual
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-6 h-0.5 bg-indigo-400 rounded border-0" style={{ borderTop: '1.5px dashed #818cf8' }} />
                    Target
                  </div>
                </div>

                {/* Axis bars */}
                {AXIS_META_DISPLAY.map((ax) => {
                  const actual = axisMap[ax.key].actual
                  const target = axisMap[ax.key].target
                  const delta = actual - target
                  const lvl = levelVector[ax.key]  // 1–10
                  return (
                    <div key={ax.key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-semibold ${ax.color}`}>{ax.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-[10px]">Target: {target}%</span>
                          <span className={`text-xs font-bold tabular-nums ${actual >= target ? 'text-emerald-300' : 'text-rose-300'}`}>
                            Lv {lvl}/10
                          </span>
                          <span className={`text-[10px] ${delta >= 0 ? 'text-emerald-300/60' : 'text-rose-300/60'}`}>
                            ({delta >= 0 ? '+' : ''}{delta}%)
                          </span>
                        </div>
                      </div>
                      {/* Actual bar */}
                      <div className={`h-2.5 ${ax.track} rounded-full overflow-hidden relative`}>
                        <div
                          className={`h-full ${ax.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${actual}%` }}
                        />
                        {/* Target marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                          style={{ left: `${target}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── AI Summary ──────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-400/30 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                🤖
              </div>
              <div>
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2">
                  AI Advisor · Personal Feedback
                </p>
                <p className="text-sm text-white/80 leading-relaxed italic">
                  "{aiSummary}"
                </p>
              </div>
            </div>
          </div>

          {/* ── CTA Button ──────────────────────────────────────────────── */}
          <button
            id="btn-create-course"
            type="button"
            onClick={() => navigate({ to: '/milestone' })}
            className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:from-blue-600 hover:via-indigo-600 hover:to-violet-600 text-white font-extrabold text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span>✨ Create My Course</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <p className="text-center text-xs text-white/30 mt-3">
            AI will generate 24 fully personalized lessons for your career track
          </p>
        </div>
      </div>
    </div>
  )
}
