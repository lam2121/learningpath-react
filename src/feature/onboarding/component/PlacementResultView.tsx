import { useState, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import type { QuestionResult, SkillAxis } from './placementTestTypes'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AxisScore {
  actual: number  // 0–100 from test
  target: number  // milestone target
}

type AxisMap = Record<SkillAxis, AxisScore>

// ─── Radar Chart (pure SVG) ───────────────────────────────────────────────────

const AXES: { key: SkillAxis; label: string; labelEn: string }[] = [
  { key: 'D_doc',     label: 'Tài liệu',   labelEn: 'D' },
  { key: 'C_comm',    label: 'Giao tiếp',  labelEn: 'C' },
  { key: 'T_trouble', label: 'Sự cố',      labelEn: 'T' },
  { key: 'G_biz',     label: 'Thương mại', labelEn: 'G' },
]

const AXIS_COLORS: Record<SkillAxis, string> = {
  D_doc:     '#60a5fa',  // blue-400
  C_comm:    '#34d399',  // emerald-400
  T_trouble: '#f87171',  // rose-400
  G_biz:     '#fbbf24',  // amber-400
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

function computeAxisScores(results: QuestionResult[]): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_biz']
  const scores: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_biz: 0 }

  axes.forEach((axis) => {
    const relevant = results.filter((r) => r.axis === axis)
    if (relevant.length === 0) return
    const correct = relevant.filter((r) => r.isCorrect)
    const weightedScore = correct.reduce((sum, r) => sum + r.difficulty, 0)
    const maxWeight = relevant.reduce((sum, r) => sum + r.difficulty, 0)
    scores[axis] = Math.round((weightedScore / maxWeight) * 100)
  })

  return scores
}

// Demo target (Intermediate level for PM — shown when no session data)
const DEMO_TARGETS: Record<SkillAxis, number> = {
  D_doc:     (20 / 100) * 78,  // 78 = intermediate total budget, then normalize to 100
  C_comm:    (50 / 100) * 78,
  T_trouble: (10 / 100) * 78,
  G_biz:     (20 / 100) * 78,
}

// Normalize targets to 0-100 scale for radar
function normalizeTarget(t: number): number {
  return Math.round((t / 78) * 100)
}

// ─── AI Summary Generator (simulated) ────────────────────────────────────────

function generateAISummary(scores: Record<SkillAxis, number>): string {
  const best = (Object.entries(scores) as [SkillAxis, number][]).sort((a, b) => b[1] - a[1])[0]
  const worst = (Object.entries(scores) as [SkillAxis, number][]).sort((a, b) => a[1] - b[1])[0]

  const axisNames: Record<SkillAxis, string> = {
    D_doc: 'viết tài liệu kỹ thuật',
    C_comm: 'giao tiếp và thuyết trình',
    T_trouble: 'xử lý sự cố',
    G_biz: 'đàm phán thương mại',
  }

  const totalAvg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4)

  if (totalAvg >= 75) {
    return `Xuất sắc! Năng lực giao tiếp IT của bạn ở mức cao — đặc biệt về kỹ năng ${axisNames[best[0]]}. Hệ thống sẽ tập trung vào ${axisNames[worst[0]]} để giúp bạn đạt đến mức chuyên gia toàn diện.`
  } else if (totalAvg >= 50) {
    return `Tốt! Bạn có nền tảng vững chắc về ${axisNames[best[0]]}. Lộ trình học sẽ được cá nhân hóa để nâng cao ${axisNames[worst[0]]} — kỹ năng quan trọng nhất cần cải thiện trong career track của bạn.`
  } else {
    return `Chào mừng đến với hành trình! Mỗi chuyên gia đều bắt đầu từ đây. Hệ thống sẽ xây dựng lộ trình từng bước, ưu tiên ${axisNames[worst[0]]} và củng cố ${axisNames[best[0]]} — hoàn toàn phù hợp với nhịp học của bạn.`
  }
}

// ─── Result Breakdown ─────────────────────────────────────────────────────────

const AXIS_META_DISPLAY = [
  { key: 'D_doc' as SkillAxis,     label: 'Tài liệu',    color: 'text-blue-300',    bar: 'bg-blue-400',    track: 'bg-blue-400/20' },
  { key: 'C_comm' as SkillAxis,    label: 'Giao tiếp',   color: 'text-emerald-300', bar: 'bg-emerald-400', track: 'bg-emerald-400/20' },
  { key: 'T_trouble' as SkillAxis, label: 'Sự cố',       color: 'text-rose-300',    bar: 'bg-rose-400',    track: 'bg-rose-400/20' },
  { key: 'G_biz' as SkillAxis,     label: 'Thương mại',  color: 'text-amber-300',   bar: 'bg-amber-400',   track: 'bg-amber-400/20' },
]

// ─── Main Result View ─────────────────────────────────────────────────────────

export function PlacementResultView() {
  const navigate = useNavigate()
  const routerState = useRouterState({ select: (s) => s.location.state })

  // Pull results from router state, or use demo data
  const results: QuestionResult[] = (routerState as { results?: QuestionResult[] })?.results ?? []
  const hasDemoData = results.length === 0

  // Demo results for testing without going through the test
  const demoResults: QuestionResult[] = hasDemoData
    ? [
        { questionId: 'd1', axis: 'D_doc',     difficulty: 1, selectedId: 'b', isCorrect: true  },
        { questionId: 'd2', axis: 'D_doc',     difficulty: 1, selectedId: 'c', isCorrect: true  },
        { questionId: 'd3', axis: 'D_doc',     difficulty: 2, selectedId: 'b', isCorrect: true  },
        { questionId: 'd4', axis: 'D_doc',     difficulty: 2, selectedId: 'b', isCorrect: true  },
        { questionId: 'd5', axis: 'D_doc',     difficulty: 3, selectedId: 'b', isCorrect: true  },
        { questionId: 'd6', axis: 'D_doc',     difficulty: 3, selectedId: 'a', isCorrect: false },
        { questionId: 'c1', axis: 'C_comm',    difficulty: 1, selectedId: 'b', isCorrect: true  },
        { questionId: 'c2', axis: 'C_comm',    difficulty: 1, selectedId: 'b', isCorrect: true  },
        { questionId: 'c3', axis: 'C_comm',    difficulty: 2, selectedId: 'c', isCorrect: true  },
        { questionId: 'c4', axis: 'C_comm',    difficulty: 2, selectedId: 'a', isCorrect: false },
        { questionId: 'c5', axis: 'C_comm',    difficulty: 3, selectedId: 'a', isCorrect: false },
        { questionId: 'c6', axis: 'C_comm',    difficulty: 3, selectedId: 'b', isCorrect: true  },
        { questionId: 't1', axis: 'T_trouble', difficulty: 1, selectedId: 'b', isCorrect: true  },
        { questionId: 't2', axis: 'T_trouble', difficulty: 1, selectedId: 'b', isCorrect: true  },
        { questionId: 't3', axis: 'T_trouble', difficulty: 2, selectedId: 'c', isCorrect: true  },
        { questionId: 't4', axis: 'T_trouble', difficulty: 2, selectedId: 'a', isCorrect: false },
        { questionId: 't5', axis: 'T_trouble', difficulty: 3, selectedId: 'c', isCorrect: false },
        { questionId: 't6', axis: 'T_trouble', difficulty: 3, selectedId: 'b', isCorrect: true  },
        { questionId: 'g1', axis: 'G_biz',     difficulty: 1, selectedId: 'c', isCorrect: true  },
        { questionId: 'g2', axis: 'G_biz',     difficulty: 1, selectedId: 'c', isCorrect: true  },
        { questionId: 'g3', axis: 'G_biz',     difficulty: 2, selectedId: 'b', isCorrect: true  },
        { questionId: 'g4', axis: 'G_biz',     difficulty: 2, selectedId: 'a', isCorrect: false },
        { questionId: 'g5', axis: 'G_biz',     difficulty: 3, selectedId: 'c', isCorrect: false },
        { questionId: 'g6', axis: 'G_biz',     difficulty: 3, selectedId: 'b', isCorrect: true  },
      ]
    : results

  const actualScores = computeAxisScores(demoResults)
  const totalCorrect = demoResults.filter((r) => r.isCorrect).length
  const totalQuestions = demoResults.length || 24
  const overallPct = Math.round((totalCorrect / totalQuestions) * 100)

  const axisMap: AxisMap = {
    D_doc:     { actual: actualScores.D_doc,     target: normalizeTarget(DEMO_TARGETS.D_doc)     },
    C_comm:    { actual: actualScores.C_comm,    target: normalizeTarget(DEMO_TARGETS.C_comm)    },
    T_trouble: { actual: actualScores.T_trouble, target: normalizeTarget(DEMO_TARGETS.T_trouble) },
    G_biz:     { actual: actualScores.G_biz,     target: normalizeTarget(DEMO_TARGETS.G_biz)     },
  }

  const aiSummary = generateAISummary(actualScores)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200)
    return () => clearTimeout(t)
  }, [])

  function gradeLabel(pct: number): { label: string; color: string } {
    if (pct >= 80) return { label: 'Xuất sắc',    color: 'text-emerald-300' }
    if (pct >= 60) return { label: 'Tốt',         color: 'text-blue-300' }
    if (pct >= 40) return { label: 'Cần cải thiện', color: 'text-amber-300' }
    return              { label: 'Cần nỗ lực',    color: 'text-rose-300' }
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
              Hoàn thành Placement Test!
            </h1>
            <p className="text-blue-100/60 text-sm">
              Đây là hồ sơ năng lực giao tiếp IT của bạn — được đo qua 24 câu hỏi thực chiến.
            </p>
            {hasDemoData && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium">
                ⚡ Dữ liệu demo — truy cập /placement-test để làm bài thật
              </div>
            )}
          </div>

          {/* ── Overall score ───────────────────────────────────────────── */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-5 text-center">
            <div className="flex items-center justify-center gap-6">
              {/* Big score circle */}
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
                  <span className="text-3xl font-black text-white">{overallPct}</span>
                  <span className="text-xs text-white/40">%</span>
                </div>
              </div>

              {/* Score details */}
              <div className="text-left">
                <div className={`text-xl font-bold mb-1 ${gradeLabel(overallPct).color}`}>
                  {gradeLabel(overallPct).label}
                </div>
                <div className="text-white/60 text-sm">
                  {totalCorrect} / {totalQuestions} câu đúng
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {AXIS_META_DISPLAY.map((ax) => (
                    <div key={ax.key} className={`text-[10px] font-bold ${ax.color}`}>
                      {ax.label}: {actualScores[ax.key]}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Radar Chart + Legend ─────────────────────────────────────── */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-5 text-center">
              Radar Chart D/C/T/G — Năng lực vs Mục tiêu
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
                    Thực tế
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-6 h-0.5 bg-indigo-400 rounded border-0" style={{ borderTop: '1.5px dashed #818cf8' }} />
                    Mục tiêu
                  </div>
                </div>

                {/* Axis bars */}
                {AXIS_META_DISPLAY.map((ax) => {
                  const actual = axisMap[ax.key].actual
                  const target = axisMap[ax.key].target
                  const delta = actual - target
                  return (
                    <div key={ax.key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-semibold ${ax.color}`}>{ax.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-[10px]">Mục tiêu: {target}%</span>
                          <span className={`text-xs font-bold ${actual >= target ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {delta >= 0 ? '+' : ''}{delta}%
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
                  AI Advisor · Nhận xét cá nhân
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
            <span>✨ Tạo khóa học của tôi</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <p className="text-center text-xs text-white/30 mt-3">
            AI sẽ sinh ra 24 bài học được cá nhân hóa hoàn toàn cho career track của bạn
          </p>
        </div>
      </div>
    </div>
  )
}
